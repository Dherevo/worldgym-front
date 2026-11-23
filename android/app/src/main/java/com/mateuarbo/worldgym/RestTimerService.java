package com.mateuarbo.worldgym;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;
import androidx.core.app.ServiceCompat;

import com.getcapacitor.JSObject;

// Foreground service of the workout notification. It shows, one at a time, what the user can do next without opening the app:
//  - set running: stopwatch + "finish set"
//  - logging: "same as suggested" (one tap) or a text field for reps and weight
//  - resting: countdown (-30 s / +30 s / start set); when it ends, sound + vibration through a second notification
//  - ready: "start set"
// The web app decides what comes next and sends the notification of each step; the buttons come back as events.
// The end time is absolute (epoch ms), so nothing depends on the web view running while the phone is locked.
public class RestTimerService extends Service {

    static final String ACTION_START = "com.mateuarbo.worldgym.REST_START";
    static final String ACTION_ADD = "com.mateuarbo.worldgym.REST_ADD";
    static final String ACTION_SUB = "com.mateuarbo.worldgym.REST_SUB";
    static final String ACTION_START_SET = "com.mateuarbo.worldgym.REST_START_SET";
    static final String ACTION_STOP = "com.mateuarbo.worldgym.REST_STOP";
    // Sent by the system alarm at the end of the rest (the Handler can be paused by Doze or the battery saver)
    static final String ACTION_FINISH = "com.mateuarbo.worldgym.REST_FINISH";
    static final String ACTION_ACTIVE = "com.mateuarbo.worldgym.SET_ACTIVE";
    static final String ACTION_LOGGING = "com.mateuarbo.worldgym.SET_LOGGING";
    static final String ACTION_READY = "com.mateuarbo.worldgym.SET_READY";
    static final String ACTION_STOP_SET = "com.mateuarbo.worldgym.SET_FINISH";
    static final String ACTION_LOG_SAME = "com.mateuarbo.worldgym.SET_LOG_SAME";
    static final String ACTION_LOG_INPUT = "com.mateuarbo.worldgym.SET_LOG_INPUT";
    static final String ACTION_EXTRA_SET = "com.mateuarbo.worldgym.SET_EXTRA";
    static final String ACTION_NEXT_EXERCISE = "com.mateuarbo.worldgym.SET_NEXT_EXERCISE";

    static final String EXTRA_ENDS_AT = "endsAt";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_TEXT = "text";
    static final String EXTRA_ADD_LABEL = "addLabel";
    static final String EXTRA_SUB_LABEL = "subLabel";
    static final String EXTRA_START_LABEL = "startLabel";
    static final String EXTRA_DONE_TITLE = "doneTitle";
    static final String EXTRA_DONE_TEXT = "doneText";
    static final String EXTRA_CHOOSE = "choose";
    static final String EXTRA_EXTRA_LABEL = "extraLabel";
    static final String EXTRA_NEXT_LABEL = "nextLabel";
    static final String EXTRA_STARTED_AT = "startedAt";
    static final String EXTRA_FINISH_LABEL = "finishLabel";
    static final String EXTRA_SAME_LABEL = "sameLabel";
    static final String EXTRA_EDIT_LABEL = "editLabel";
    static final String EXTRA_INPUT_HINT = "inputHint";
    static final String EXTRA_SAVING_TEXT = "savingText";
    static final String EXTRA_REPS = "reps";
    static final String EXTRA_WEIGHT = "weight";
    private static final String KEY_INPUT = "set_input";
    // Brand colour of the notification background (the app's header colour)
    private static final int BRAND_COLOR = 0xFF424530;

    private static final String CHANNEL_TIMER = "rest_timer_v2";
    private static final String CHANNEL_DONE = "rest_done";
    private static final int ID_TIMER = 4101;
    private static final int ID_DONE = 4102;
    private static final long ADD_MS = 30_000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable finishTask = this::finishRest;
    private PowerManager.WakeLock wakeLock;
    // true from the start of a rest until it ends or another step takes over
    private boolean resting = false;

    private long endsAt;
    private String title = "";
    private String text = "";
    private String addLabel = "+30 s";
    private String subLabel = "-30 s";
    private String startLabel = "";
    private String doneTitle = "";
    private String doneText = "";
    private boolean choose = false;
    private String extraLabel = "";
    private String nextLabel = "";
    private long startedAt;
    private String finishLabel = "";
    private String sameLabel = "";
    private String editLabel = "";
    private String inputHint = "";
    private String savingText = "";
    private int sameReps;
    private double sameWeight;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_START.equals(action)) {
            endsAt = intent.getLongExtra(EXTRA_ENDS_AT, System.currentTimeMillis());
            title = intent.getStringExtra(EXTRA_TITLE);
            text = intent.getStringExtra(EXTRA_TEXT);
            addLabel = intent.getStringExtra(EXTRA_ADD_LABEL);
            subLabel = intent.getStringExtra(EXTRA_SUB_LABEL);
            startLabel = intent.getStringExtra(EXTRA_START_LABEL);
            doneTitle = intent.getStringExtra(EXTRA_DONE_TITLE);
            doneText = intent.getStringExtra(EXTRA_DONE_TEXT);
            choose = intent.getBooleanExtra(EXTRA_CHOOSE, false);
            extraLabel = intent.getStringExtra(EXTRA_EXTRA_LABEL);
            nextLabel = intent.getStringExtra(EXTRA_NEXT_LABEL);

            createChannels();
            NotificationManagerCompat.from(this).cancel(ID_DONE);
            goForeground(buildTimerNotification());
            resting = true;
            schedule();
        } else if (ACTION_FINISH.equals(action)) {
            // The system alarm: if the Handler did not finish the rest, it is done now. The service may have been recreated
            // (nothing in memory), so the texts come with the alarm
            long alarmEnds = intent.getLongExtra(EXTRA_ENDS_AT, 0);
            if (endsAt == 0) {
                restoreFromAlarm(intent);
                resting = true;
            }
            // A rest that was extended or replaced has another end: its old alarm does nothing
            if (resting && alarmEnds == endsAt) finishRest();
        } else if (ACTION_ADD.equals(action) || ACTION_SUB.equals(action)) {
            // A rest that already finished has no service left, so this only runs while counting down.
            // Taking time off past the end just finishes the rest right away
            endsAt += ACTION_ADD.equals(action) ? ADD_MS : -ADD_MS;
            NotificationManagerCompat.from(this).notify(ID_TIMER, buildTimerNotification());
            schedule();
            JSObject data = new JSObject();
            data.put("endsAt", endsAt);
            RestTimerPlugin.emit("restChanged", data);
        } else if (ACTION_START_SET.equals(action)) {
            cancelAll();
            RestTimerPlugin.emit("startSet", new JSObject());
            stopSelf();
        } else if (ACTION_ACTIVE.equals(action)) {
            pauseCountdown();
            title = intent.getStringExtra(EXTRA_TITLE);
            text = intent.getStringExtra(EXTRA_TEXT);
            startedAt = intent.getLongExtra(EXTRA_STARTED_AT, System.currentTimeMillis());
            finishLabel = intent.getStringExtra(EXTRA_FINISH_LABEL);
            createChannels();
            NotificationManagerCompat.from(this).cancel(ID_DONE);
            goForeground(buildActiveNotification());
        } else if (ACTION_LOGGING.equals(action)) {
            pauseCountdown();
            title = intent.getStringExtra(EXTRA_TITLE);
            text = intent.getStringExtra(EXTRA_TEXT);
            sameLabel = intent.getStringExtra(EXTRA_SAME_LABEL);
            editLabel = intent.getStringExtra(EXTRA_EDIT_LABEL);
            inputHint = intent.getStringExtra(EXTRA_INPUT_HINT);
            savingText = intent.getStringExtra(EXTRA_SAVING_TEXT);
            sameReps = intent.getIntExtra(EXTRA_REPS, 0);
            sameWeight = intent.getDoubleExtra(EXTRA_WEIGHT, 0);
            createChannels();
            NotificationManagerCompat.from(this).cancel(ID_DONE);
            goForeground(buildLoggingNotification(false));
        } else if (ACTION_READY.equals(action)) {
            pauseCountdown();
            title = intent.getStringExtra(EXTRA_TITLE);
            text = intent.getStringExtra(EXTRA_TEXT);
            startLabel = intent.getStringExtra(EXTRA_START_LABEL);
            createChannels();
            NotificationManagerCompat.from(this).cancel(ID_DONE);
            goForeground(buildReadyNotification());
        } else if (ACTION_STOP_SET.equals(action)) {
            // The notification stays until the web app answers with the logging one
            RestTimerPlugin.emit("stopSet", new JSObject());
        } else if (ACTION_LOG_SAME.equals(action)) {
            JSObject data = new JSObject();
            data.put("reps", sameReps);
            data.put("weight", sameWeight);
            showSaving();
            RestTimerPlugin.emit("logSet", data);
        } else if (ACTION_LOG_INPUT.equals(action)) {
            Bundle results = RemoteInput.getResultsFromIntent(intent);
            CharSequence typed = results != null ? results.getCharSequence(KEY_INPUT) : null;
            JSObject data = new JSObject();
            data.put("input", typed != null ? typed.toString() : "");
            showSaving();
            RestTimerPlugin.emit("logSet", data);
        } else if (ACTION_EXTRA_SET.equals(action)) {
            cancelAll();
            RestTimerPlugin.emit("extraSet", new JSObject());
            stopSelf();
        } else if (ACTION_NEXT_EXERCISE.equals(action)) {
            cancelAll();
            RestTimerPlugin.emit("nextExercise", new JSObject());
            stopSelf();
        } else if (ACTION_STOP.equals(action)) {
            cancelAll();
            stopSelf();
        } else {
            // Restarted by the system without data: nothing to count
            stopSelf();
        }

        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(finishTask);
        releaseWakeLock();
        super.onDestroy();
    }

    private void goForeground(Notification notification) {
        if (Build.VERSION.SDK_INT >= 34) {
            ServiceCompat.startForeground(this, ID_TIMER, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(ID_TIMER, notification);
        }
    }

    private void restoreFromAlarm(Intent intent) {
        if (endsAt == 0) {
            endsAt = intent.getLongExtra(EXTRA_ENDS_AT, 0);
            doneTitle = intent.getStringExtra(EXTRA_DONE_TITLE);
            doneText = intent.getStringExtra(EXTRA_DONE_TEXT);
            startLabel = intent.getStringExtra(EXTRA_START_LABEL);
            extraLabel = intent.getStringExtra(EXTRA_EXTRA_LABEL);
            nextLabel = intent.getStringExtra(EXTRA_NEXT_LABEL);
            choose = intent.getBooleanExtra(EXTRA_CHOOSE, false);
            createChannels();
        }
    }

    private PendingIntent finishAlarmIntent() {
        Intent intent = new Intent(this, RestTimerService.class).setAction(ACTION_FINISH)
            .putExtra(EXTRA_ENDS_AT, endsAt)
            .putExtra(EXTRA_DONE_TITLE, doneTitle)
            .putExtra(EXTRA_DONE_TEXT, doneText)
            .putExtra(EXTRA_START_LABEL, startLabel)
            .putExtra(EXTRA_EXTRA_LABEL, extraLabel)
            .putExtra(EXTRA_NEXT_LABEL, nextLabel)
            .putExtra(EXTRA_CHOOSE, choose);
        return PendingIntent.getService(this, 9, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // The system alarm works in Doze, where the Handler and the wake lock below may be paused. Exact when the user allowed
    // "alarms and reminders" (needed from Android 14), otherwise as close as the system lets it
    private void scheduleAlarm() {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAt, finishAlarmIntent());
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, endsAt, finishAlarmIntent());
            }
        } catch (SecurityException ignored) {
            // no permission for alarms: the Handler is all there is
        }
    }

    private void cancelAlarm() {
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(finishAlarmIntent());
    }

    // Wakes the phone up (CPU only) at the end time, even with the screen off
    private void schedule() {
        scheduleAlarm();
        handler.removeCallbacks(finishTask);
        long wait = Math.max(0, endsAt - System.currentTimeMillis());
        handler.postDelayed(finishTask, wait);

        releaseWakeLock();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "worldgym:rest");
        wakeLock.acquire(wait + 5_000L);
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        wakeLock = null;
    }

    private void cancelAll() {
        resting = false;
        cancelAlarm();
        handler.removeCallbacks(finishTask);
        releaseWakeLock();
        stopForeground(STOP_FOREGROUND_REMOVE);
        NotificationManagerCompat nm = NotificationManagerCompat.from(this);
        nm.cancel(ID_TIMER);
        nm.cancel(ID_DONE);
    }

    private void finishRest() {
        // Handler and alarm can both arrive: the second one finds nothing to finish
        if (!resting) return;
        resting = false;
        cancelAlarm();
        handler.removeCallbacks(finishTask);
        stopForeground(STOP_FOREGROUND_REMOVE);
        NotificationManagerCompat.from(this).cancel(ID_TIMER);

        NotificationCompat.Builder done = new NotificationCompat.Builder(this, CHANNEL_DONE)
            .setSmallIcon(R.drawable.ic_stat_logo)
            .setColor(BRAND_COLOR)
            .setContentTitle(doneTitle)
            .setContentText(doneText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setTimeoutAfter(5 * 60_000L)
            .setContentIntent(openAppIntent());

        // Planned sets done: extra set or next exercise; otherwise the next set
        if (choose) {
            done.addAction(0, extraLabel, serviceIntent(ACTION_EXTRA_SET, 7))
                .addAction(0, nextLabel, serviceIntent(ACTION_NEXT_EXERCISE, 8));
        } else {
            done.addAction(0, startLabel, serviceIntent(ACTION_START_SET, 2));
        }

        try {
            NotificationManagerCompat.from(this).notify(ID_DONE, done.build());
        } catch (SecurityException ignored) {
            // Notification permission denied: nothing to show
        }

        releaseWakeLock();
        stopSelf();
    }

    private Notification buildTimerNotification() {
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_TIMER)
            .setSmallIcon(R.drawable.ic_stat_logo)
            .setColor(BRAND_COLOR)
            .setColorized(true)
            .setContentTitle(title)
            .setContentText(text)
            .setWhen(endsAt)
            .setShowWhen(true)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(openAppIntent());

        if (choose) {
            // Planned sets done: the next step is an extra set or the next exercise (Android shows three buttons at most)
            b.addAction(0, addLabel, serviceIntent(ACTION_ADD, 1))
             .addAction(0, extraLabel, serviceIntent(ACTION_EXTRA_SET, 7))
             .addAction(0, nextLabel, serviceIntent(ACTION_NEXT_EXERCISE, 8));
        } else {
            b.addAction(0, subLabel, serviceIntent(ACTION_SUB, 3))
             .addAction(0, addLabel, serviceIntent(ACTION_ADD, 1))
             .addAction(0, startLabel, serviceIntent(ACTION_START_SET, 2));
        }
        return b.build();
    }

    // A step that is not the rest takes over: the end-of-rest timer must not fire
    private void pauseCountdown() {
        resting = false;
        cancelAlarm();
        handler.removeCallbacks(finishTask);
        releaseWakeLock();
    }

    // After sending the values the notification would keep its spinner: show it as saving until the web app answers
    private void showSaving() {
        try {
            NotificationManagerCompat.from(this).notify(ID_TIMER, buildLoggingNotification(true));
        } catch (SecurityException ignored) {
            // Notification permission denied
        }
    }

    // Common look: brand colour as the background and an ongoing foreground-service notification
    private NotificationCompat.Builder baseBuilder() {
        return new NotificationCompat.Builder(this, CHANNEL_TIMER)
            .setSmallIcon(R.drawable.ic_stat_logo)
            .setColor(BRAND_COLOR)
            .setColorized(true)
            .setContentTitle(title)
            .setContentText(text)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .setContentIntent(openAppIntent());
    }

    // Set running: stopwatch counting up
    private Notification buildActiveNotification() {
        return baseBuilder()
            .setWhen(startedAt)
            .setShowWhen(true)
            .setUsesChronometer(true)
            .addAction(0, finishLabel, serviceIntent(ACTION_STOP_SET, 4))
            .build();
    }

    // Set finished: one tap with the suggested reps and weight, or type them
    private Notification buildLoggingNotification(boolean saving) {
        NotificationCompat.Builder b = baseBuilder().setShowWhen(false);
        if (saving) return b.setContentText(savingText).build();

        RemoteInput input = new RemoteInput.Builder(KEY_INPUT).setLabel(inputHint).build();
        // Remote input needs a mutable intent (Android 12+) so the system can add the typed text
        int mutable = Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0;
        PendingIntent typed = PendingIntent.getService(this, 6,
            new Intent(this, RestTimerService.class).setAction(ACTION_LOG_INPUT),
            PendingIntent.FLAG_UPDATE_CURRENT | mutable);

        return b
            .addAction(0, sameLabel, serviceIntent(ACTION_LOG_SAME, 5))
            .addAction(new NotificationCompat.Action.Builder(0, editLabel, typed).addRemoteInput(input).build())
            .build();
    }

    // Waiting to start the set
    private Notification buildReadyNotification() {
        return baseBuilder()
            .setShowWhen(false)
            .addAction(0, startLabel, serviceIntent(ACTION_START_SET, 2))
            .build();
    }

    private PendingIntent serviceIntent(String action, int requestCode) {
        Intent intent = new Intent(this, RestTimerService.class).setAction(action);
        return PendingIntent.getService(this, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private PendingIntent openAppIntent() {
        Intent intent = new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private void createChannels() {
        NotificationManager nm = getSystemService(NotificationManager.class);

        // The countdown itself: no sound or vibration, but default importance: some phones (Xiaomi) hide
        // low-importance notifications from the lock screen
        NotificationChannel timer = new NotificationChannel(CHANNEL_TIMER, getString(R.string.rest_channel_timer), NotificationManager.IMPORTANCE_DEFAULT);
        timer.setSound(null, null);
        timer.enableVibration(false);
        timer.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        timer.setShowBadge(false);
        nm.createNotificationChannel(timer);

        // The end of the rest: sound and vibration
        NotificationChannel done = new NotificationChannel(CHANNEL_DONE, getString(R.string.rest_channel_done), NotificationManager.IMPORTANCE_HIGH);
        done.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        done.enableVibration(true);
        done.setVibrationPattern(new long[] { 0, 300, 150, 300, 150, 500 });
        done.setSound(
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
            new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()
        );
        done.setShowBadge(false);
        nm.createNotificationChannel(done);
    }
}

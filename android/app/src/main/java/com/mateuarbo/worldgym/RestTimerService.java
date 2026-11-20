package com.mateuarbo.worldgym;

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
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;

import com.getcapacitor.JSObject;

// Foreground service of the rest timer: keeps a fixed notification with a countdown (visible on the lock screen)
// and, when the rest ends, plays the sound and vibrates through a second, high-importance notification.
// The end time is absolute (epoch ms), so nothing depends on the web view running while the phone is locked.
public class RestTimerService extends Service {

    static final String ACTION_START = "com.mateuarbo.worldgym.REST_START";
    static final String ACTION_ADD = "com.mateuarbo.worldgym.REST_ADD";
    static final String ACTION_SUB = "com.mateuarbo.worldgym.REST_SUB";
    static final String ACTION_START_SET = "com.mateuarbo.worldgym.REST_START_SET";
    static final String ACTION_STOP = "com.mateuarbo.worldgym.REST_STOP";

    static final String EXTRA_ENDS_AT = "endsAt";
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_TEXT = "text";
    static final String EXTRA_ADD_LABEL = "addLabel";
    static final String EXTRA_SUB_LABEL = "subLabel";
    static final String EXTRA_START_LABEL = "startLabel";
    static final String EXTRA_DONE_TITLE = "doneTitle";
    static final String EXTRA_DONE_TEXT = "doneText";

    private static final String CHANNEL_TIMER = "rest_timer_v2";
    private static final String CHANNEL_DONE = "rest_done";
    private static final int ID_TIMER = 4101;
    private static final int ID_DONE = 4102;
    private static final long ADD_MS = 30_000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable finishTask = this::finishRest;
    private PowerManager.WakeLock wakeLock;

    private long endsAt;
    private String title = "";
    private String text = "";
    private String addLabel = "+30 s";
    private String subLabel = "-30 s";
    private String startLabel = "";
    private String doneTitle = "";
    private String doneText = "";

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

            createChannels();
            NotificationManagerCompat.from(this).cancel(ID_DONE);
            goForeground(buildTimerNotification());
            schedule();
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

    // Wakes the phone up (CPU only) at the end time, even with the screen off
    private void schedule() {
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
        handler.removeCallbacks(finishTask);
        releaseWakeLock();
        stopForeground(STOP_FOREGROUND_REMOVE);
        NotificationManagerCompat nm = NotificationManagerCompat.from(this);
        nm.cancel(ID_TIMER);
        nm.cancel(ID_DONE);
    }

    private void finishRest() {
        stopForeground(STOP_FOREGROUND_REMOVE);
        NotificationManagerCompat.from(this).cancel(ID_TIMER);

        Notification done = new NotificationCompat.Builder(this, CHANNEL_DONE)
            .setSmallIcon(R.drawable.ic_stat_rest)
            .setContentTitle(doneTitle)
            .setContentText(doneText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setAutoCancel(true)
            .setTimeoutAfter(5 * 60_000L)
            .setContentIntent(openAppIntent())
            .addAction(0, startLabel, serviceIntent(ACTION_START_SET, 2))
            .build();

        try {
            NotificationManagerCompat.from(this).notify(ID_DONE, done);
        } catch (SecurityException ignored) {
            // Notification permission denied: nothing to show
        }

        releaseWakeLock();
        stopSelf();
    }

    private Notification buildTimerNotification() {
        return new NotificationCompat.Builder(this, CHANNEL_TIMER)
            .setSmallIcon(R.drawable.ic_stat_rest)
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
            .setContentIntent(openAppIntent())
            .addAction(0, subLabel, serviceIntent(ACTION_SUB, 3))
            .addAction(0, addLabel, serviceIntent(ACTION_ADD, 1))
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

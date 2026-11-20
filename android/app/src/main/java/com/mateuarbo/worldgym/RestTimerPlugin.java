package com.mateuarbo.worldgym;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

// Bridge between the web app and the rest timer notification (RestTimerService).
// JS -> native: start({ endsAt, title, text, addLabel, startLabel, doneTitle, doneText }), stop().
// showActive / showLogging / showReady: the other steps of a set (see RestTimerService).
// native -> JS (events, kept until the app listens): "startSet", "restChanged" { endsAt }, "stopSet",
// "logSet" { reps, weight } or { input }, "extraSet", "nextExercise".
@CapacitorPlugin(
    name = "RestTimer",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class RestTimerPlugin extends Plugin {

    private static RestTimerPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    // Called by the service when a button of the notification is pressed
    static void emit(String event, JSObject data) {
        if (instance != null) instance.notifyListeners(event, data, true);
    }

    @PluginMethod
    public void start(PluginCall call) {
        Long endsAt = call.getLong("endsAt");
        if (endsAt == null) {
            call.reject("endsAt is required");
            return;
        }

        Context ctx = getContext();
        Intent intent = new Intent(ctx, RestTimerService.class).setAction(RestTimerService.ACTION_START);
        intent.putExtra(RestTimerService.EXTRA_ENDS_AT, (long) endsAt);
        intent.putExtra(RestTimerService.EXTRA_TITLE, call.getString("title", ""));
        intent.putExtra(RestTimerService.EXTRA_TEXT, call.getString("text", ""));
        intent.putExtra(RestTimerService.EXTRA_ADD_LABEL, call.getString("addLabel", "+30 s"));
        intent.putExtra(RestTimerService.EXTRA_SUB_LABEL, call.getString("subLabel", "-30 s"));
        intent.putExtra(RestTimerService.EXTRA_START_LABEL, call.getString("startLabel", ""));
        intent.putExtra(RestTimerService.EXTRA_DONE_TITLE, call.getString("doneTitle", ""));
        intent.putExtra(RestTimerService.EXTRA_DONE_TEXT, call.getString("doneText", ""));
        intent.putExtra(RestTimerService.EXTRA_CHOOSE, Boolean.TRUE.equals(call.getBoolean("choose", false)));
        intent.putExtra(RestTimerService.EXTRA_EXTRA_LABEL, call.getString("extraLabel", ""));
        intent.putExtra(RestTimerService.EXTRA_NEXT_LABEL, call.getString("nextLabel", ""));
        ContextCompat.startForegroundService(ctx, intent);
        call.resolve();
    }

    // Set running: stopwatch from `startedAt` and a "finish set" button
    @PluginMethod
    public void showActive(PluginCall call) {
        Intent intent = new Intent(getContext(), RestTimerService.class).setAction(RestTimerService.ACTION_ACTIVE);
        intent.putExtra(RestTimerService.EXTRA_TITLE, call.getString("title", ""));
        intent.putExtra(RestTimerService.EXTRA_TEXT, call.getString("text", ""));
        intent.putExtra(RestTimerService.EXTRA_STARTED_AT, call.getLong("startedAt", System.currentTimeMillis()).longValue());
        intent.putExtra(RestTimerService.EXTRA_FINISH_LABEL, call.getString("finishLabel", ""));
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    // Set finished: suggested reps/weight in one tap, or typed text
    @PluginMethod
    public void showLogging(PluginCall call) {
        Intent intent = new Intent(getContext(), RestTimerService.class).setAction(RestTimerService.ACTION_LOGGING);
        intent.putExtra(RestTimerService.EXTRA_TITLE, call.getString("title", ""));
        intent.putExtra(RestTimerService.EXTRA_TEXT, call.getString("text", ""));
        intent.putExtra(RestTimerService.EXTRA_SAME_LABEL, call.getString("sameLabel", ""));
        intent.putExtra(RestTimerService.EXTRA_EDIT_LABEL, call.getString("editLabel", ""));
        intent.putExtra(RestTimerService.EXTRA_INPUT_HINT, call.getString("inputHint", ""));
        intent.putExtra(RestTimerService.EXTRA_SAVING_TEXT, call.getString("savingText", ""));
        intent.putExtra(RestTimerService.EXTRA_REPS, call.getInt("reps", 0).intValue());
        intent.putExtra(RestTimerService.EXTRA_WEIGHT, call.getDouble("weight", 0.0).doubleValue());
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    // Waiting to start the next set (after moving on to another exercise)
    @PluginMethod
    public void showReady(PluginCall call) {
        Intent intent = new Intent(getContext(), RestTimerService.class).setAction(RestTimerService.ACTION_READY);
        intent.putExtra(RestTimerService.EXTRA_TITLE, call.getString("title", ""));
        intent.putExtra(RestTimerService.EXTRA_TEXT, call.getString("text", ""));
        intent.putExtra(RestTimerService.EXTRA_START_LABEL, call.getString("startLabel", ""));
        ContextCompat.startForegroundService(getContext(), intent);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context ctx = getContext();
        ctx.startService(new Intent(ctx, RestTimerService.class).setAction(RestTimerService.ACTION_STOP));
        call.resolve();
    }

    // Before Android 13 notifications need no permission
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33) {
            JSObject res = new JSObject();
            res.put("notifications", "granted");
            call.resolve(res);
        } else {
            super.checkPermissions(call);
        }
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            checkPermissions(call);
        } else {
            super.requestPermissions(call);
        }
    }
}

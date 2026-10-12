package com.biteranks.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Aggiornamenti dell'app da GitHub Releases.
 * A ogni apertura (avvio o ritorno in primo piano) legge version.json dall'ultima release (creata dalla GitHub Action a ogni push su main):
 * se il versionCode è più alto di quello installato chiede all'utente di aggiornare, scarica l'APK
 * e apre l'installer di Android (fuori dal Play Store Android chiede sempre una conferma all'utente).
 */
class UpdateManager {

    private static final String APK_MIME = "application/vnd.android.package-archive";
    private static final long MIN_CHECK_INTERVAL_MS = 60_000;

    private final Activity activity;
    private final Handler mainThread = new Handler(Looper.getMainLooper());
    private final File updatesDir;

    // APK già scaricato che aspetta il permesso "installa app sconosciute"
    private File apkWaitingForPermission;
    // controllo, finestra di dialogo o download in corso (usati solo dal thread principale)
    private boolean busy;
    private long lastCheckAt;
    private int postponedVersionCode;

    UpdateManager(Activity activity) {
        this.activity = activity;
        this.updatesDir = new File(activity.getCacheDir(), "updates");
    }

    void onResume() {
        if (apkWaitingForPermission != null && canInstallPackages()) {
            File apk = apkWaitingForPermission;
            apkWaitingForPermission = null;
            install(apk);
            return;
        }
        checkForUpdate();
    }

    // Controlla a ogni avvio e ogni volta che l'app torna in primo piano (al massimo una volta al minuto)
    private void checkForUpdate() {
        long now = SystemClock.elapsedRealtime();
        if (busy || apkWaitingForPermission != null || (lastCheckAt != 0 && now - lastCheckAt < MIN_CHECK_INTERVAL_MS)) {
            return;
        }
        lastCheckAt = now;
        busy = true;
        new Thread(() -> {
            try {
                JSONObject info = new JSONObject(new String(download(BuildConfig.UPDATE_INFO_URL), "UTF-8"));
                int latestCode = info.getInt("versionCode");
                if (latestCode <= BuildConfig.VERSION_CODE) {
                    deleteOldDownloads();
                    mainThread.post(() -> busy = false);
                    return;
                }
                String versionName = info.optString("versionName", String.valueOf(latestCode));
                String apkUrl = info.getString("apkUrl");
                mainThread.post(() -> askToUpdate(latestCode, versionName, apkUrl));
            } catch (Exception ignored) {
                // offline o nessuna release pubblicata: si riprova alla prossima apertura
                mainThread.post(() -> busy = false);
            }
        }).start();
    }

    private void askToUpdate(int versionCode, String versionName, String apkUrl) {
        // "Più tardi" vale fino alla chiusura dell'app o finché non esce una versione ancora più nuova
        if (activity.isFinishing() || versionCode == postponedVersionCode) {
            busy = false;
            return;
        }
        new AlertDialog.Builder(activity)
                .setTitle(R.string.update_title)
                .setMessage(activity.getString(R.string.update_message, versionName))
                .setPositiveButton(R.string.update_now, (d, w) -> downloadAndInstall(apkUrl))
                .setNegativeButton(R.string.update_later, (d, w) -> postpone(versionCode))
                .setOnCancelListener(d -> postpone(versionCode))
                .show();
    }

    private void postpone(int versionCode) {
        postponedVersionCode = versionCode;
        busy = false;
    }

    private void downloadAndInstall(String apkUrl) {
        ProgressBar bar = new ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal);
        bar.setIndeterminate(true);
        int pad = (int) (24 * activity.getResources().getDisplayMetrics().density);
        bar.setPadding(pad, pad / 2, pad, 0);
        AlertDialog progress = new AlertDialog.Builder(activity)
                .setTitle(R.string.update_downloading)
                .setView(bar)
                .setCancelable(false)
                .show();

        new Thread(() -> {
            File apk = new File(updatesDir, "BiteRanks.apk");
            boolean ok = downloadToFile(apkUrl, apk, bar);
            mainThread.post(() -> {
                progress.dismiss();
                busy = false;
                if (ok) {
                    install(apk);
                } else {
                    Toast.makeText(activity, R.string.update_failed, Toast.LENGTH_LONG).show();
                }
            });
        }).start();
    }

    private void install(File apk) {
        if (!canInstallPackages()) {
            apkWaitingForPermission = apk;
            Toast.makeText(activity, R.string.update_allow_install, Toast.LENGTH_LONG).show();
            activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.getPackageName())));
            return;
        }
        Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".fileprovider", apk);
        Intent intent = new Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, APK_MIME)
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        activity.startActivity(intent);
    }

    private boolean canInstallPackages() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.O
                || activity.getPackageManager().canRequestPackageInstalls();
    }

    private void deleteOldDownloads() {
        File[] files = updatesDir.listFiles();
        if (files == null) return;
        for (File f : files) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    private static HttpURLConnection open(String url) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(30000);
        conn.setUseCaches(false);
        conn.setInstanceFollowRedirects(true); // github.com/.../latest/download -> file della release
        if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) {
            conn.disconnect();
            throw new IOException("HTTP " + conn.getResponseCode() + " per " + url);
        }
        return conn;
    }

    private static byte[] download(String url) throws IOException {
        HttpURLConnection conn = open(url);
        try (InputStream in = conn.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            copy(in, out, -1, null);
            return out.toByteArray();
        } finally {
            conn.disconnect();
        }
    }

    private boolean downloadToFile(String url, File target, ProgressBar bar) {
        HttpURLConnection conn = null;
        try {
            if (!updatesDir.exists() && !updatesDir.mkdirs()) return false;
            conn = open(url);
            long total = conn.getContentLengthLong();
            try (InputStream in = conn.getInputStream(); OutputStream out = new FileOutputStream(target)) {
                copy(in, out, total, bar);
            }
            return true;
        } catch (IOException e) {
            //noinspection ResultOfMethodCallIgnored
            target.delete();
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static void copy(InputStream in, OutputStream out, long total, ProgressBar bar) throws IOException {
        byte[] buffer = new byte[64 * 1024];
        long done = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            out.write(buffer, 0, read);
            done += read;
            if (bar != null && total > 0) {
                int percent = (int) (done * 100 / total);
                bar.post(() -> {
                    bar.setIndeterminate(false);
                    bar.setProgress(percent);
                });
            }
        }
    }
}

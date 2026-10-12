package com.biteranks.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.GeolocationPermissions;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.webkit.WebViewAssetLoader;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

/**
 * Guscio dell'app: una WebView che mostra il sito compilato (vite-project/dist) incluso nell'APK.
 * I file vengono serviti da https://appassets.androidplatform.net/ così i percorsi assoluti del sito
 * (es. fetch('/ranking/index.json')) funzionano come sul web.
 */
public class MainActivity extends Activity {

    private static final String APP_HOST = WebViewAssetLoader.DEFAULT_DOMAIN;
    private static final String START_URL = "https://" + APP_HOST + "/";
    private static final int REQUEST_LOCATION = 1;

    private WebView webView;
    private UpdateManager updateManager;

    // richiesta di posizione del sito in attesa della risposta dell'utente al permesso Android
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);
        webView = new WebView(this);
        root.addView(webView);
        setContentView(root);
        applySystemBarInsets(root);

        setupWebView();
        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(START_URL);
        }

        updateManager = new UpdateManager(this);
        updateManager.checkForUpdate();
    }

    // Da Android 15 l'app va a tutto schermo: lasciamo spazio a barra di stato e navigazione
    private void applySystemBarInsets(FrameLayout root) {
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                controller.setSystemBarsAppearance(light, light);
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        // il sito usa questo marcatore per nascondere il bottone "scarica l'app"
        settings.setUserAgentString(settings.getUserAgentString() + " BiteRanksApp/" + BuildConfig.VERSION_NAME);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/", this::loadWebAsset)
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (APP_HOST.equals(uri.getHost())) {
                    return false;
                }
                openExternally(uri);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingGeoOrigin = origin;
                pendingGeoCallback = callback;
                requestPermissions(new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                }, REQUEST_LOCATION);
            }

            // window.open(...) e i link target="_blank" (Google Maps, sito del locale, Donate...) si aprono fuori dall'app
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                        openExternally(request.getUrl());
                        v.destroy();
                        return true;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popup);
                resultMsg.sendToTarget();
                return true;
            }
        });
    }

    // Serve i file da assets/www; ogni percorso senza estensione (route di React Router) riceve index.html
    private WebResourceResponse loadWebAsset(String path) {
        if (path.isEmpty() || !path.substring(path.lastIndexOf('/') + 1).contains(".")) {
            path = "index.html";
        }
        try {
            InputStream stream = getAssets().open("www/" + path);
            String mime = URLConnection.guessContentTypeFromName(path);
            if (path.endsWith(".js") || path.endsWith(".mjs")) mime = "text/javascript";
            else if (path.endsWith(".css")) mime = "text/css";
            else if (path.endsWith(".json")) mime = "application/json";
            else if (path.endsWith(".svg")) mime = "image/svg+xml";
            else if (path.endsWith(".woff2")) mime = "font/woff2";
            else if (path.endsWith(".webp")) mime = "image/webp";
            if (mime == null) mime = "application/octet-stream";
            boolean isText = mime.startsWith("text/") || mime.equals("application/json") || mime.equals("image/svg+xml");
            return new WebResourceResponse(mime, isText ? "UTF-8" : null, stream);
        } catch (IOException e) {
            return null;
        }
    }

    private void openExternally(Uri uri) {
        Intent intent;
        if ("intent".equals(uri.getScheme())) {
            try {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
            } catch (Exception e) {
                return;
            }
        } else {
            intent = new Intent(Intent.ACTION_VIEW, uri);
        }
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, R.string.no_app_for_link, Toast.LENGTH_SHORT).show();
        }
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_LOCATION && pendingGeoCallback != null) {
            pendingGeoCallback.invoke(pendingGeoOrigin, hasLocationPermission(), false);
            pendingGeoCallback = null;
            pendingGeoOrigin = null;
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
        updateManager.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}

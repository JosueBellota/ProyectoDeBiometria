package com.example.androidbiometria;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebSettings;

/**
 * @file WebNodoActivity.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Actividad para mostrar una página web en un WebView.
 */
public class WebNodoActivity extends AppCompatActivity {

    /**
     * @brief Inicializa la actividad y carga la URL en el WebView.
     * @param savedInstanceState Estado guardado de la instancia anterior.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_web_nodo);

        String url = getIntent().getStringExtra("url");

        WebView webView = findViewById(R.id.webNodo);
        WebSettings webSettings = webView.getSettings();

        // 🔹 Habilitar JavaScript y almacenamiento
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // 🔹 Permitir cookies
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // 🔹 Habilitar depuración (opcional, para probar)
        WebView.setWebContentsDebuggingEnabled(true);

        webView.loadUrl(url);
    }
}

package com.example.androidbiometria;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;

public class WebNodoActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_web_nodo);

        String url = getIntent().getStringExtra("url"); // URL enviada desde MainActivity

        WebView webView = findViewById(R.id.webNodo);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true); // Si tu web usa JS, actívalo

        webView.loadUrl(url);
    }
}

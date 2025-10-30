package com.example.androidbiometria;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.*;
import android.content.Intent;

public class Register extends AppCompatActivity {

    private static final String API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
    private EditText nameField, emailField, passwordField;
    private Button registerButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        nameField = findViewById(R.id.name);
        emailField = findViewById(R.id.email);
        passwordField = findViewById(R.id.password);
        registerButton = findViewById(R.id.registerButton);

        registerButton.setOnClickListener(v -> registrarUsuario());
    }

    private void registrarUsuario() {
        String nombre = nameField.getText().toString().trim();
        String correo = emailField.getText().toString().trim();
        String password = passwordField.getText().toString().trim();

        if (nombre.isEmpty() || correo.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Completa todos los campos", Toast.LENGTH_SHORT).show();
            return;
        }

        new Thread(() -> {
            try {
                java.net.URL url = new java.net.URL(API_BASE + "/usuarios");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setDoOutput(true);

                // 🔹 Enviar los datos requeridos por el backend
                String jsonBody = String.format(
                        "{\"nombre\":\"%s\", \"correo\":\"%s\", \"rol\":\"ciudadano\", \"password\":\"%s\"}",
                        nombre, correo, password
                );

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonBody.getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int responseCode = conn.getResponseCode();
                java.io.InputStream responseStream = (responseCode >= 200 && responseCode < 300)
                        ? conn.getInputStream() : conn.getErrorStream();

                String response = new java.util.Scanner(responseStream, "UTF-8").useDelimiter("\\A").next();
                conn.disconnect();

                runOnUiThread(() -> {
                    if (responseCode == 200) {
                        Toast.makeText(this, "✅ Registro exitoso", Toast.LENGTH_SHORT).show();
                        startActivity(new Intent(this, MainActivity.class));
                        finish();
                    } else {
                        Toast.makeText(this, "⚠️ Error backend: " + response, Toast.LENGTH_LONG).show();
                    }
                });

            } catch (Exception e) {
                runOnUiThread(() ->
                        Toast.makeText(this, "❌ Error: " + e.getMessage(), Toast.LENGTH_LONG).show()
                );
            }
        }).start();
    }
}

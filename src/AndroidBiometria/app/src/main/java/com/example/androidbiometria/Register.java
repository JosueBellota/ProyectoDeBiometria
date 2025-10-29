package com.example.androidbiometria;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.*;
import android.content.Intent;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class Register extends AppCompatActivity {


    private static final String API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
    private EditText nameField, emailField, passwordField;
    private Button registerButton;
    private FirebaseAuth auth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        auth = FirebaseAuth.getInstance();

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

        auth.createUserWithEmailAndPassword(correo, password)
                .addOnSuccessListener(result -> {
                    FirebaseUser user = result.getUser();

                    // 🔹 Llamar a tu backend para registrar también al usuario
                    new Thread(() -> {
                        try {
                            java.net.URL url = new java.net.URL(API_BASE + "/usuarios");

                            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                            conn.setRequestMethod("POST");
                            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                            conn.setDoOutput(true);

                            // 🔹 Enviar datos requeridos por el backend
                            String jsonBody = String.format(
                                    "{\"nombre\":\"%s\", \"correo\":\"%s\", \"rol\":\"ciudadano\", \"password\":\"%s\"}",
                                    nombre, correo, password
                            );

                            try (java.io.OutputStream os = conn.getOutputStream()) {
                                byte[] input = jsonBody.getBytes("utf-8");
                                os.write(input, 0, input.length);
                            }

                            int responseCode = conn.getResponseCode();
                            if (responseCode == 200) {
                                runOnUiThread(() -> {
                                    Toast.makeText(this, "✅ Registro exitoso", Toast.LENGTH_SHORT).show();
                                    startActivity(new Intent(this, MainActivity.class));
                                    finish();
                                });
                            } else {
                                java.io.InputStream errorStream = conn.getErrorStream();
                                String errorMsg = new java.util.Scanner(errorStream, "UTF-8").useDelimiter("\\A").next();
                                runOnUiThread(() ->
                                        Toast.makeText(this, "⚠️ Error backend: " + errorMsg, Toast.LENGTH_LONG).show()
                                );
                            }

                            conn.disconnect();
                        } catch (Exception e) {
                            runOnUiThread(() ->
                                    Toast.makeText(this, "❌ Error: " + e.getMessage(), Toast.LENGTH_LONG).show()
                            );
                        }
                    }).start();

                })
                .addOnFailureListener(e ->
                        Toast.makeText(this, "❌ Error Firebase: " + e.getMessage(), Toast.LENGTH_SHORT).show()
                );
    }

}
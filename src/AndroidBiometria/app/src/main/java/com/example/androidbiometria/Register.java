package com.example.androidbiometria;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.*;
import android.content.Intent;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

/**
 * @file Register.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Actividad para el registro de nuevos usuarios.
 *
 * Permite a los usuarios crear una cuenta proporcionando nombre, correo y contraseña.
 * Realiza validaciones de entrada, crea el usuario en Firebase Authentication y
 * registra los datos adicionales en el backend REST.
 */
public class Register extends AppCompatActivity {

    private static final String API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
    private FirebaseAuth mAuth;
    private EditText nameField, emailField, passwordField, passwordField2;
    private Button registerButton;

    /**
     * @brief Valida el formato del correo electrónico.
     * @param correo Dirección de correo a validar.
     * @return true si el formato es válido, false en caso contrario.
     */
    private boolean validarCorreo(String correo) {
        String regexCorreo = "^[\\w!#$%&'*+/=?`{|}~^-]+(?:\\.[\\w!#$%&'*+/=?`{|}~^-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,6}$";
        return correo.matches(regexCorreo);
    }

    /**
     * @brief Valida la fortaleza de la contraseña.
     * @param password Contraseña a validar.
     * @return true si cumple con los requisitos (mínimo 8 caracteres, mayúscula, minúscula, número).
     */
    private boolean validarPassword(String password) {
        // La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número.
        String regexPassword = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";
        return password.matches(regexPassword);
    }

    /**
     * @brief Inicializa la actividad y los componentes de la interfaz.
     * @param savedInstanceState Estado guardado de la instancia anterior.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        mAuth = FirebaseAuth.getInstance();
        nameField = findViewById(R.id.name);
        emailField = findViewById(R.id.email);
        passwordField = findViewById(R.id.password);
        passwordField2 = findViewById(R.id.password2); // Assuming R.id.password2 exists
        registerButton = findViewById(R.id.registerButton);

        registerButton.setOnClickListener(v -> registrarUsuario());
    }

    /**
     * @brief Ejecuta el proceso de registro del usuario.
     *
     * Valida los campos, crea el usuario en Firebase Auth, envía correo de verificación
     * y registra los datos del usuario en la base de datos a través del servidor REST.
     */
    private void registrarUsuario() {
        String nombre = nameField.getText().toString().trim();
        String correo = emailField.getText().toString().trim();
        String password = passwordField.getText().toString().trim();
        String password2 = passwordField2.getText().toString().trim(); // Get password2

        if (nombre.isEmpty() || correo.isEmpty() || password.isEmpty() || password2.isEmpty()) {
            Toast.makeText(this, "Completa todos los campos", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!validarCorreo(correo)) {
            Toast.makeText(this, "El correo no tiene un formato válido.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!validarPassword(password)) {
            Toast.makeText(this,
                    "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número.",
                    Toast.LENGTH_LONG).show();
            return;
        }

        if (!password.equals(password2)) {
            Toast.makeText(this, "Las contraseñas no coinciden.", Toast.LENGTH_SHORT).show();
            return;
        }

        // Primero, registrar en Firebase Authentication
        mAuth.createUserWithEmailAndPassword(correo, password)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null) {
                            // Enviar correo de verificación
                            user.sendEmailVerification()
                                    .addOnCompleteListener(taskVerification -> {
                                        if (taskVerification.isSuccessful()) {
                                            Toast.makeText(this, "✅ Registro exitoso. Se ha enviado un correo de verificación.", Toast.LENGTH_LONG).show();
                                            // Luego, registrar en el backend de Firebase Functions
                                            new Thread(() -> {
                                                try {
                                                    java.net.URL url = new java.net.URL(API_BASE + "/usuarios");
                                                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                                                    conn.setRequestMethod("POST");
                                                    conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                                                    conn.setDoOutput(true);

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
                                                            // Ya se mostró el toast de verificación, solo navegar
                                                            startActivity(new Intent(this, MainActivity.class));
                                                            finish();
                                                        } else {
                                                            Toast.makeText(this, "⚠️ Error backend: " + response, Toast.LENGTH_LONG).show();
                                                            // TODO: Considerar revertir la creación del usuario en Firebase Auth si el backend falla
                                                        }
                                                    });

                                                } catch (Exception e) {
                                                    runOnUiThread(() ->
                                                            Toast.makeText(this, "❌ Error al registrar en backend: " + e.getMessage(), Toast.LENGTH_LONG).show()
                                                    );
                                                }
                                            }).start();
                                        } else {
                                            Toast.makeText(this, "⚠️ Error al enviar correo de verificación.", Toast.LENGTH_SHORT).show();
                                        }
                                    });
                        }
                    } else {
                        // Si el registro de Firebase Auth falla
                        String errorMessage = "Error en el registro: " + task.getException().getMessage();
                        Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show();
                    }
                });
    }
}

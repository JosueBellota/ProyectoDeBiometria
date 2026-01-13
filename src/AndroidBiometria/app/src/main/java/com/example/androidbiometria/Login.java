package com.example.androidbiometria;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

import java.util.List;

/**
 * @file Login.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Actividad de inicio de sesión de la aplicación.
 *
 * Permite a los usuarios autenticarse mediante correo/contraseña o huella dactilar.
 * Gestiona la navegación hacia el registro o la actividad principal si la autenticación
 * es exitosa.
 */
public class Login extends AppCompatActivity {

    private EditText emailField, passwordField;
    private Button loginButton, registerButton, fingerprintButton, enrollFingerprintButton;
    private FirebaseAuth auth;
    private BiometricAuthHelper biometricAuthHelper;

    /**
     * @brief Inicializa la actividad, los componentes de UI y los listeners.
     * @param savedInstanceState Estado guardado de la instancia anterior.
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        auth = FirebaseAuth.getInstance();
        biometricAuthHelper = new BiometricAuthHelper(this);

        FirebaseUser currentUser = auth.getCurrentUser();
        if (currentUser != null && currentUser.isEmailVerified()) {
            goToMain();
            return;
        }

        emailField = findViewById(R.id.email);
        passwordField = findViewById(R.id.password);
        loginButton = findViewById(R.id.loginButton);
        registerButton = findViewById(R.id.registerButton);
        fingerprintButton = findViewById(R.id.fingerprintButton);
        enrollFingerprintButton = findViewById(R.id.enrollFingerprintButton); // Initialize new button

        loginButton.setOnClickListener(v -> loginUsuario());
        registerButton.setOnClickListener(v -> startActivity(new Intent(this, Register.class)));
        
        // --- OnClickListener for the new Enroll button ---
        enrollFingerprintButton.setOnClickListener(v -> {
            String email = emailField.getText().toString().trim();
            String password = passwordField.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Por favor, introduce tu correo y contraseña para enrolar.", Toast.LENGTH_LONG).show();
                return;
            }

            if (!biometricAuthHelper.canAuthenticate()) {
                Toast.makeText(this, "Tu dispositivo no es compatible con la autenticación por huella.", Toast.LENGTH_LONG).show();
                return;
            }

            // Check if user is already enrolled
            if (biometricAuthHelper.getEnrolledUsers().contains(email)) {
                Toast.makeText(this, "Esta cuenta ya tiene una huella asociada.", Toast.LENGTH_SHORT).show();
                return;
            }

            // To enroll, we must first validate the credentials are correct
            auth.signInWithEmailAndPassword(email, password)
                .addOnSuccessListener(result -> {
                    // Credentials are valid, proceed to enroll screen
                    goToFingerprintEnroll(email, password);
                })
                .addOnFailureListener(e -> {
                    // Credentials are not valid
                    Toast.makeText(Login.this, "Correo o contraseña incorrectos. No se puede enrolar.", Toast.LENGTH_SHORT).show();
                });
        });


        // --- Biometric Login Logic ---
        if (biometricAuthHelper.canAuthenticate()) {
            fingerprintButton.setVisibility(View.VISIBLE);
            List<String> enrolledUsers = biometricAuthHelper.getEnrolledUsers();
            if (enrolledUsers.isEmpty()) {
                fingerprintButton.setEnabled(false);
            } else {
                fingerprintButton.setEnabled(true);
                fingerprintButton.setOnClickListener(v -> showAccountSelectorAndAuthenticate());
            }
        }
    }

    /**
     * @brief Muestra un selector de cuentas enroladas para autenticación biométrica.
     */
    private void showAccountSelectorAndAuthenticate() {
        biometricAuthHelper.showAccountSelector(this, (activity, email) -> {
            // After user selects an account, show biometric prompt for that account
            biometricAuthHelper.authenticate(activity, email, new BiometricAuthHelper.AuthCallback() {
                @Override
                public void onAuthSuccess(String decryptedEmail, String decryptedPassword) {
                    performFirebaseLogin(decryptedEmail, decryptedPassword, true);
                }

                @Override
                public void onAuthError(String errorMessage) {
                    Toast.makeText(Login.this, errorMessage, Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    /**
     * @brief Inicia el proceso de login con correo y contraseña ingresados.
     */
    private void loginUsuario() {
        String email = emailField.getText().toString().trim();
        String password = passwordField.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Completa todos los campos", Toast.LENGTH_SHORT).show();
            return;
        }
        performFirebaseLogin(email, password, false);
    }

    /**
     * @brief Realiza la autenticación contra Firebase Auth.
     * @param email Correo electrónico.
     * @param password Contraseña.
     * @param isBiometricLogin Indica si el login fue iniciado por biometría.
     */
    private void performFirebaseLogin(String email, String password, boolean isBiometricLogin) {
        auth.signInWithEmailAndPassword(email, password)
                .addOnSuccessListener(result -> {
                    FirebaseUser user = result.getUser();
                    if (user != null && user.isEmailVerified()) {
                        if (!isBiometricLogin) {
                            Toast.makeText(this, "Inicio de sesión exitoso", Toast.LENGTH_SHORT).show();
                        }
                        goToMain();
                    } else {
                        auth.signOut();
                        Toast.makeText(this, "Por favor, verifica tu correo.", Toast.LENGTH_LONG).show();
                    }
                })
                .addOnFailureListener(e ->
                        Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show()
                );
    }

    /**
     * @brief Navega a la actividad principal.
     */
    private void goToMain() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    /**
     * @brief Navega a la actividad de enrolamiento de huella.
     * @param email Correo del usuario.
     * @param password Contraseña del usuario.
     */
    private void goToFingerprintEnroll(String email, String password) {
        Intent intent = new Intent(this, FingerprintEnrollActivity.class);
        intent.putExtra("email", email);
        intent.putExtra("password", password);
        startActivity(intent);
        finish();
    }
}
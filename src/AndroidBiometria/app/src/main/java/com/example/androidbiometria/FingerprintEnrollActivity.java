package com.example.androidbiometria;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

public class FingerprintEnrollActivity extends AppCompatActivity {

    private BiometricAuthHelper biometricAuthHelper;
    private String email;
    private String password;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_fingerprint_enroll);

        biometricAuthHelper = new BiometricAuthHelper(this);

        email = getIntent().getStringExtra("email");
        password = getIntent().getStringExtra("password");

        if (email == null || password == null) {
            // Should not happen, but as a safeguard
            goToMain();
            return;
        }

        Button yesButton = findViewById(R.id.yesButton);
        Button noButton = findViewById(R.id.noButton);

        noButton.setOnClickListener(v -> goToMain());

        yesButton.setOnClickListener(v -> {
            // Disable buttons to prevent multiple clicks
            yesButton.setEnabled(false);
            noButton.setEnabled(false);
            
            // Use the helper to show the prompt and handle enrollment
            biometricAuthHelper.enroll(this, email, password, new BiometricAuthHelper.EnrollmentCallback() {
                @Override
                public void onEnrollmentSuccess() {
                    Toast.makeText(FingerprintEnrollActivity.this, "Configuración de huella guardada.", Toast.LENGTH_SHORT).show();
                    goToMain();
                }

                @Override
                public void onEnrollmentFailure(String error) {
                    Toast.makeText(FingerprintEnrollActivity.this, error, Toast.LENGTH_LONG).show();
                    goToMain();
                }
            });
        });
    }

    private void goToMain() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}

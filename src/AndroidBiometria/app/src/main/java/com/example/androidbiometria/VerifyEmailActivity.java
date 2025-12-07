package com.example.androidbiometria;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class VerifyEmailActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;
    private TextView messageView;
    private Button resendButton, logoutButton;
    private Handler handler;
    private Runnable verificationChecker;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_verify_email);

        mAuth = FirebaseAuth.getInstance();
        FirebaseUser user = mAuth.getCurrentUser();

        messageView = findViewById(R.id.verificationMessage);
        resendButton = findViewById(R.id.resendEmailButton);
        logoutButton = findViewById(R.id.logoutButton);

        if (user != null) {
            messageView.setText("Se ha enviado un correo de verificación a " + user.getEmail() + ". Por favor, revisa tu bandeja de entrada y sigue las instrucciones para activar tu cuenta.");
        }

        resendButton.setOnClickListener(v -> {
            if (user != null) {
                user.sendEmailVerification().addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        Toast.makeText(VerifyEmailActivity.this, "Correo de verificación enviado.", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(VerifyEmailActivity.this, "Error al reenviar el correo: " + task.getException().getMessage(), Toast.LENGTH_SHORT).show();
                    }
                });
            }
        });

        logoutButton.setOnClickListener(v -> {
            mAuth.signOut();
            // The listener will handle the redirect
        });

        // Add a listener to automatically redirect if user logs out
        mAuth.addAuthStateListener(firebaseAuth -> {
            if (firebaseAuth.getCurrentUser() == null) {
                goToLogin();
            }
        });

        // Start a periodic check for email verification status
        handler = new Handler();
        verificationChecker = new Runnable() {
            @Override
            public void run() {
                FirebaseUser currentUser = mAuth.getCurrentUser();
                if (currentUser != null) {
                    currentUser.reload().addOnCompleteListener(task -> {
                        if (task.isSuccessful() && currentUser.isEmailVerified()) {
                            Toast.makeText(VerifyEmailActivity.this, "¡Correo verificado!", Toast.LENGTH_SHORT).show();
                            goToMain();
                        } else {
                            // Schedule the next check
                            handler.postDelayed(this, 5000); // Check every 5 seconds
                        }
                    });
                }
            }
        };
    }

    @Override
    protected void onStart() {
        super.onStart();
        // Start the verification checker when the activity becomes visible
        handler.post(verificationChecker);
    }

    @Override
    protected void onStop() {
        super.onStop();
        // Stop the verification checker when the activity is no longer visible
        handler.removeCallbacks(verificationChecker);
    }

    private void goToLogin() {
        Intent intent = new Intent(VerifyEmailActivity.this, Login.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void goToMain() {
        Intent intent = new Intent(VerifyEmailActivity.this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}

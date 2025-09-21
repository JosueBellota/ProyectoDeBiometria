package com.example.androidbiometria;

import android.util.Log;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

public class FirebaseManager {

    private static final String TAG = "FirebaseManager";
    private FirebaseFirestore db;

    public FirebaseManager() {
        // Inicializar Firebase Firestore
        db = FirebaseFirestore.getInstance();
        enviarPlacasTest(); // Enviar datos automáticamente al crearse
    }

    /**
     * Envía las placas 1, 2, 3, 4 a Firebase para测试
     */
    public void enviarPlacasTest() {
        if (db == null) {
            Log.e(TAG, "Firebase no inicializado");
            return;
        }

        Log.d(TAG, "Enviando placas de testeo a Firebase...");

        // Enviar placa 1
        Map<String, Object> placa1 = new HashMap<>();
        placa1.put("placa", 1);
        placa1.put("timestamp", System.currentTimeMillis());
        enviarDocumento(placa1, "placa_1");

        // Enviar placa 2
        Map<String, Object> placa2 = new HashMap<>();
        placa2.put("placa", 2);
        placa2.put("timestamp", System.currentTimeMillis());
        enviarDocumento(placa2, "placa_2");

        // Enviar placa 3
        Map<String, Object> placa3 = new HashMap<>();
        placa3.put("placa", 3);
        placa3.put("timestamp", System.currentTimeMillis());
        enviarDocumento(placa3, "placa_3");

        // Enviar placa 4
        Map<String, Object> placa4 = new HashMap<>();
        placa4.put("placa", 4);
        placa4.put("timestamp", System.currentTimeMillis());
        enviarDocumento(placa4, "placa_4");
    }

    /**
     * Método helper para enviar documentos a Firebase
     */
    private void enviarDocumento(Map<String, Object> datos, String nombreDocumento) {
        db.collection("medidas")
                .document(nombreDocumento)
                .set(datos)
                .addOnSuccessListener(aVoid -> {
                    Log.d(TAG, "Placa enviada exitosamente: " + nombreDocumento);
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error enviando placa " + nombreDocumento + ": " + e.getMessage());
                });
    }
}
package com.example.androidbiometria;

import android.util.Log;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

public class EnviarDatosDeIBeacon {

    private static final String TAG = ">>>>>";
    private FirebaseFirestore db;

    public EnviarDatosDeIBeacon() {
        // Inicializar Firebase Firestore
        db = FirebaseFirestore.getInstance();

        // Llamamos al test de forma automática
        Testeos.testearEnvioEmisora(this);
    }

    /**
     * Envía a Firebase el nombre de la emisora detectada.
     *
     * @param nombreEmisora texto con el nombre de la emisora
     */
    public void enviarNombreDeEmisora(String nombreEmisora) {
        if (db == null) {
            Log.e(TAG, "Firebase no inicializado");
            return;
        }

        Log.d(TAG, "Enviando nombre de emisora a Firebase: " + nombreEmisora);

        Map<String, Object> datos = new HashMap<>();
        datos.put("nombre_emisora", nombreEmisora);
        datos.put("timestamp", System.currentTimeMillis());

        db.collection("emisoras")
                .add(datos) // 🔹 ID automático
                .addOnSuccessListener(docRef -> {
                    Log.d(TAG, "Nombre de emisora enviado: " + docRef.getId());
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error enviando nombre de emisora: " + e.getMessage());
                });
    }
}

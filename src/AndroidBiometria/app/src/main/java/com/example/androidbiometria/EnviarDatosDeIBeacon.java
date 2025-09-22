package com.example.androidbiometria;

import android.util.Log;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

public class EnviarDatosDeIBeacon {

    private static final String TAG = ">>>>>";

    private FirebaseFirestore db;
    private final String DOCUMENTO_EMISORA = "emisora_unica"; // Documento fijo

    public EnviarDatosDeIBeacon() {
        // Inicializar Firebase Firestore
        db = FirebaseFirestore.getInstance();
    }

    /**
     * Envía o actualiza en Firebase el nombre de la emisora detectada.
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
        datos.put("nombre", nombreEmisora);
        datos.put("timestamp", System.currentTimeMillis());

        db.collection("emisoras")
                .document(DOCUMENTO_EMISORA) // Documento fijo para evitar repeticiones
                .set(datos) // reemplaza los datos existentes
                .addOnSuccessListener(aVoid -> Log.d(TAG, "Nombre de emisora actualizado en Firebase"))
                .addOnFailureListener(e -> Log.e(TAG, "Error enviando nombre de emisora: " + e.getMessage()));
    }
}

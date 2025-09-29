package com.example.androidbiometria;

import android.util.Log;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.HttpsCallableResult;

public class EnviarDatosDeIBeacon {

    private static final String TAG = ">>>>>";

    private FirebaseFunctions functions;

    private FirebaseFirestore db;
    private final String DOCUMENTO_EMISORA = "emisora_unica"; // Documento fijo

    public EnviarDatosDeIBeacon() {
        // Inicializar Firebase Firestore
        //db = FirebaseFirestore.getInstance();

        // Inicializar Firebase Functions y apuntar al emulador
        functions = FirebaseFunctions.getInstance();

        // Apuntar al emulador
        functions.useEmulator("10.0.2.2", 8788); // <--- Aquí el puerto del emulador
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




    /**
     * Envía un sensor y su valor a la función cloud "guardarMedidas"
     *
     * @param sensor Nombre del sensor
     * @param valor  Valor del sensor
     */
    public void enviarDatosAFuncion(String sensor, int valor) {
        Map<String, Object> datos = new HashMap<>();
        datos.put("sensor", sensor);
        datos.put("valor", valor);

        functions
                .getHttpsCallable("guardarMedidas")
                .call(datos)
                .addOnSuccessListener((HttpsCallableResult result) -> {
                    Log.d(TAG, "Guardado en la nube: " + result.getData());
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error enviando datos a la nube: " + e.getMessage());
                });
    }

}

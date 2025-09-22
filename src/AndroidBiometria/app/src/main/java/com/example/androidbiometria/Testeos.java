package com.example.androidbiometria;

import android.util.Log;

public class Testeos {

    private static final String TAG = "test";

    /**
     * Test simple para verificar que Firebase está inicializado.
     */
    public static void testFirebase(EnviarDatosDeIBeacon enviarDatos) {
        if (enviarDatos != null) {
            Log.d(TAG, "✅ Firebase inicializado correctamente y objeto EnviarDatosDeIBeacon listo");
        } else {
            Log.e(TAG, "❌ Error: EnviarDatosDeIBeacon es null");
        }
    }

    /**
     * Test opcional para validar dispositivo detectado.
     */
    public static boolean testFiltrarDispositivo(String nombreDetectado) {
        String dispositivoBuscado = "LE_WH-1000XM5";

        Log.d(TAG, "🔍 Probando filtro de dispositivo...");
        Log.d(TAG, "Esperando: " + dispositivoBuscado);
        Log.d(TAG, "Detectado: " + nombreDetectado);

        boolean coincidencia = dispositivoBuscado.equals(nombreDetectado);

        if (coincidencia) {
            Log.d(TAG, "✅ Test correcto: se detectó el dispositivo esperado (" + dispositivoBuscado + ")");
        } else {
            Log.e(TAG, "❌ Test fallido: no coincide con el esperado");
        }

        return coincidencia;
    }

    /**
     * Método para enviar a Firebase desde el testeo.
     */
    public static void testEnviarAFirebase(String nombreDetectado, EnviarDatosDeIBeacon enviarDatos) {
        if (enviarDatos != null && nombreDetectado != null) {
            enviarDatos.enviarNombreDeEmisora(nombreDetectado);
            Log.d(TAG, "✅ Test correcto: Nombre de emisora enviado a Firebase");
        } else {
            Log.e(TAG, "❌ No se puede enviar a Firebase, objeto o nombre null");
        }
    }
}

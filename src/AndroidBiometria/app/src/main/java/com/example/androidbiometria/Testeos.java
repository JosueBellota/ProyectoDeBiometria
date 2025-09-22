package com.example.androidbiometria;

import android.util.Log;

public class Testeos {

    private static final String TAG = "test";

    // Test básico para envío de emisora
    public static void testearEnvioEmisora(EnviarDatosDeIBeacon enviarDatos) {
        String nombrePrueba = "emisora";
        enviarDatos.enviarNombreDeEmisora(nombrePrueba);
        if ("emisora".equals(nombrePrueba)) {
            Log.d(TAG, "✅ Test correcto: nombre emisora = " + nombrePrueba);
        } else {
            Log.e(TAG, "❌ Test fallido: nombre emisora no coincide");
        }
    }

    // Test para validar dispositivo detectado
    public static void testearFiltroDispositivo(String nombreDetectado) {
        String dispositivoBuscado = "LE_WH-1000XM5";

        Log.d(TAG, "🔍 Probando filtro de dispositivo...");
        Log.d(TAG, "Esperando: " + dispositivoBuscado);
        Log.d(TAG, "Detectado: " + nombreDetectado);

        if (dispositivoBuscado.equals(nombreDetectado)) {
            Log.d(TAG, "✅ Test correcto: se detectó el dispositivo esperado (" + dispositivoBuscado + ")");
        } else {
            Log.e(TAG, "❌ Test fallido: no coincide con el esperado");
        }
    }
}

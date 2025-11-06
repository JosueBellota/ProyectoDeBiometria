package com.example.androidbiometria;

import android.util.Log;
import okhttp3.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;

/**
 * -----------------------------------------------------------------------------
 * Clase LogicaFake
 * Responsable: Josue Bellota Ichaso
 * -----------------------------------------------------------------------------
 * Envía mediciones y maneja la creación automática de nodos si el usuario no tiene uno.
 * -----------------------------------------------------------------------------
 */
public class LogicaFake {

    private String nombre;
    private String direccion;
    private int rssi;
    private String bytesHex;
    private String prefijo;
    private String advFlags;
    private String advHeader;
    private String companyID;
    private int iBeaconType;
    private int iBeaconLength;
    private String uuidHex;
    private String uuidString;
    private int major;
    private int minor;
    private int txPower;

    private static Integer valorCO2Pendiente = null;
    private static Integer valorTempPendiente = null;
    private static long tiempoInicioLectura = 0;
    private static final long TIMEOUT_MS = 3000;

    // Firebase Functions
    private static final String URL_MANEJAR_POST =
            "https://us-central1-proyectodebiometria.cloudfunctions.net/ManejarPOST";

    // Servidor REST base
    private static final String BASE_URL =
            "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

    private OkHttpClient client = new OkHttpClient();

    // ID de usuario y nodo actual (para evitar crear múltiples)
    private String idUsuario;
    private String idNodo;

    public LogicaFake(String nombre, String direccion, int rssi, String bytesHex,
                      String prefijo, String advFlags, String advHeader,
                      String companyID, int iBeaconType, int iBeaconLength,
                      String uuidHex, String uuidString, int major, int minor, int txPower,
                      String idUsuario) {

        this.nombre = nombre;
        this.direccion = direccion;
        this.rssi = rssi;
        this.bytesHex = bytesHex;
        this.prefijo = prefijo;
        this.advFlags = advFlags;
        this.advHeader = advHeader;
        this.companyID = companyID;
        this.iBeaconType = iBeaconType;
        this.iBeaconLength = iBeaconLength;
        this.uuidHex = uuidHex;
        this.uuidString = uuidString;
        this.major = major;
        this.minor = minor;
        this.txPower = txPower;
        this.idUsuario = idUsuario;
    }

    //obtenerNodo

    

    public void guardarMedida() {

        if (idNodo == null) {
            Log.e(">>>>>>", "No hay idNodo asociado. Se intenta crear o recuperar...");
            return;
        }

        // 1) Determinar qué tipo de dato llegó según el Major
        if (major >= 2800 && major <= 2899) { // CO2
            valorCO2Pendiente = minor;
            Log.d(">>>>>>", "Detectado CO2: " + minor);

        } else if (major >= 3000 && major <= 3099) { // Temperatura
            valorTempPendiente = minor;
            Log.d(">>>>>>", "Detectada TEMP: " + minor);
        } else {
            Log.d(">>>>>>", "Beacon ignorado. Major no corresponde a CO2/Temp.");
            return;
        }

        // 2) Si es la primera medida de la pareja, guardamos el tiempo
        if (tiempoInicioLectura == 0) tiempoInicioLectura = System.currentTimeMillis();

        long tiempoTranscurrido = System.currentTimeMillis() - tiempoInicioLectura;

        // 3) Si ya tenemos ambas o venció el tiempo -> enviar
        if (valorCO2Pendiente != null && valorTempPendiente != null || tiempoTranscurrido >= TIMEOUT_MS) {

            Integer co2 = valorCO2Pendiente != null ? valorCO2Pendiente : -1;
            Integer temp = valorTempPendiente != null ? valorTempPendiente : -1;

            Log.d(">>>>>>", "Enviando medición al servidor → CO2=" + co2 + " Temp=" + temp);

            try {
                JSONObject json = new JSONObject();
                json.put("idNodo", idNodo);

                JSONObject medidas = new JSONObject();
                medidas.put("co2", co2);
                medidas.put("temperatura", temp);
                json.put("medidas", medidas);

                RequestBody body = RequestBody.create(
                        json.toString(),
                        MediaType.parse("application/json; charset=utf-8")
                );

                Request request = new Request.Builder()
                        .url(BASE_URL + "/mediciones")
                        .post(body)
                        .build();

                client.newCall(request).enqueue(new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        Log.e(">>>>>>", "Error al enviar mediciones: " + e.getMessage(), e);
                    }

                    @Override
                    public void onResponse(Call call, Response response) throws IOException {
                        if (!response.isSuccessful()) {
                            Log.e(">>>>>>", "Error servidor: " + response.body().string());
                        } else {
                            Log.d(">>>>>>", "Mediciones enviadas OK → " + response.body().string());
                        }
                    }
                });

            } catch (Exception e) {
                Log.e(">>>>>>", "Error construyendo JSON: " + e.getMessage(), e);
            }

            // 4) Limpiar buffer para la siguiente pareja
            valorCO2Pendiente = null;
            valorTempPendiente = null;
            tiempoInicioLectura = 0;
        }
    }
}

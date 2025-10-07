package com.example.androidbiometria;

import android.util.Log;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

/**
 * -----------------------------------------------------------------------------
 * Fichero: LogicaFake.java
 * Responsable: Josue Bellota Ichaso
 * -----------------------------------------------------------------------------
 * Clase para construir y enviar mediciones a Firebase Functions.
 * Ahora usa la nueva función: ManejarPOST
 * -----------------------------------------------------------------------------
 */
public class LogicaFake {

    // ----------------------------------------------------------
    // Atributos principales
    // ----------------------------------------------------------
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

    // ----------------------------------------------------------
    // URL actualizada del servicio en Firebase
    // ----------------------------------------------------------
    // 🔹 Cambia "proyectodebiometria" por tu ID real si es distinto.
    private static final String URL_MANEJAR_POST =
            "https://us-central1-proyectodebiometria.cloudfunctions.net/ManejarPOST";

    // ----------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------
    public LogicaFake(String nombre, String direccion, int rssi, String bytesHex,
                      String prefijo, String advFlags, String advHeader,
                      String companyID, int iBeaconType, int iBeaconLength,
                      String uuidHex, String uuidString, int major, int minor, int txPower) {
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
    }

    // ----------------------------------------------------------
    // Método toString()
    // ----------------------------------------------------------
    @Override
    public String toString() {
        return "TramaIBeaconConvertido{" +
                "nombre='" + nombre + '\'' +
                ", direccion='" + direccion + '\'' +
                ", rssi=" + rssi +
                ", bytesHex='" + bytesHex + '\'' +
                ", prefijo='" + prefijo + '\'' +
                ", advFlags='" + advFlags + '\'' +
                ", advHeader='" + advHeader + '\'' +
                ", companyID='" + companyID + '\'' +
                ", iBeaconType=" + iBeaconType +
                ", iBeaconLength=" + iBeaconLength +
                ", uuidHex='" + uuidHex + '\'' +
                ", uuidString='" + uuidString + '\'' +
                ", major=" + major +
                ", minor=" + minor +
                ", txPower=" + txPower +
                '}';
    }

    // ----------------------------------------------------------
    // Método guardarMedida()
    // ----------------------------------------------------------
    // Envía un JSON:
    //   { "sensor": "CO2", "valor": minor }
    // a la función Firebase "ManejarPOST" (POST HTTP)
    // ----------------------------------------------------------
    public void guardarMedida() {

        OkHttpClient client = new OkHttpClient();
        String sensor = "CO2"; // sensor fijo

        Log.d(">>>>>>", "Enviando medida con minor: " + this.minor);

        try {
            JSONObject json = new JSONObject();
            json.put("valor", this.minor);
            json.put("sensor", sensor);

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(URL_MANEJAR_POST)
                    .post(body)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(">>>>>>", "Error al enviar medida: " + e.getMessage(), e);
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (!response.isSuccessful()) {
                        Log.e(">>>>>>", "Error al enviar medida: " + response.body().string());
                    } else {
                        Log.d(">>>>>>", "Medida enviada correctamente: " + response.body().string());
                    }
                }
            });

        } catch (Exception e) {
            Log.e(">>>>>>", "Excepción al construir/enviar medida: " + e.getMessage(), e);
        }
    }
}

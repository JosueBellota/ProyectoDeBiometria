package com.example.androidbiometria;

import android.util.Log;

import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;


// -----------------------------------------------------------------------------------
//
// Fichero:TramaIBea.java
// Responsable: Josue Bellota Ichaso
//
// ----------------------------------------------------------
// Clase TramaIBeaconConvertido
// ----------------------------------------------------------
// Esta clase representa la información convertida de una trama
// publicitaria iBeacon detectada por un dispositivo Android.
//
// Contiene los campos que describen el beacon (nombre, dirección,
// UUID, major, minor, etc.), así como un método para enviar
// medidas a un servicio en Firebase.
// ----------------------------------------------------------
public class LogicaFake {

    // ----------------------------------------------------------
    // Atributos principales
    // ----------------------------------------------------------
    private String nombre;        // texto (nombre del dispositivo)
    private String direccion;     // texto (dirección MAC del beacon)
    private int rssi;             // número entero (intensidad de señal recibida)
    private String bytesHex;      // texto (datos brutos en formato hexadecimal)
    private String prefijo;       // texto (parte inicial de la trama)
    private String advFlags;      // texto (flags de la trama publicitaria)
    private String advHeader;     // texto (cabecera de la trama)
    private String companyID;     // texto (identificador de la compañía emisora)
    private int iBeaconType;      // número entero (tipo de iBeacon)
    private int iBeaconLength;    // número entero (longitud de los datos)
    private String uuidHex;       // texto (UUID en hexadecimal)
    private String uuidString;    // texto (UUID en formato estándar con guiones)
    private int major;            // número entero (campo Major del iBeacon)
    private int minor;            // número entero (campo Minor del iBeacon)
    private int txPower;          // número entero (potencia de transmisión)

    // URL del servicio en Firebase (constante)
    private static final String URL_GUARDAR_MEDICION =
            "https://us-central1-proyectodebiometria.cloudfunctions.net/guardarMedida";

    // ----------------------------------------------------------
    // Constructor
    // ----------------------------------------------------------
    // Parámetros de entrada:
    //   - nombre, direccion, rssi, bytesHex, prefijo, advFlags,
    //     advHeader, companyID, iBeaconType, iBeaconLength,
    //     uuidHex, uuidString, major, minor, txPower
    // -->
    // TramaIBeaconConvertido() --> inicializa todos los atributos
    // de la clase con los valores recibidos
    // -->
    // objeto TramaIBeaconConvertido
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
    // sin parámetros (de entrada)
    // -->
    // toString() --> devuelve una cadena de texto con todos los
    // campos de la clase formateados
    // -->
    // String (texto)
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
    // sin parámetros (de entrada)
    // -->
    // guardarMedida() --> construye un objeto JSON con:
    //      "valor": minor  (se usa el campo minor como dato medido)
    //      "sensor": "CO2" (sensor fijo)
    //   y lo envía mediante POST a la URL de Firebase.
    //   Usa la librería OkHttpClient de forma asíncrona.
    //
    // En caso de éxito -> log "Medida enviada correctamente"
    // En caso de error -> log con mensaje de error
    // -->
    // void
    // ----------------------------------------------------------
    public void guardarMedida() {

        OkHttpClient client = new OkHttpClient();
        String sensor = "CO2"; // sensor fijo

        Log.d(">>>>>>", "Enviando medida con minor: " + this.minor);

        try {
            JSONObject json = new JSONObject();
            json.put("valor", this.minor);  // usamos el minor como valor
            json.put("sensor", sensor);

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(URL_GUARDAR_MEDICION)
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

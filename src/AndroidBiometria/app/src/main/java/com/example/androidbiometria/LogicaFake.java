package com.example.androidbiometria;

import android.util.Log;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

public class LogicaFake {

    private static final String BASE_URL =
            "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

    private OkHttpClient client = new OkHttpClient();

    // -------------------------------------------------------------------------
    // NUEVAS VARIABLES PARA GUARDAR TODA LA INFORMACIÓN DEL BEACON
    // -------------------------------------------------------------------------
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
    private int txPower;

    // -------------------------------------------------------------------------
    // VARIABLES YA EXISTENTES PARA LÓGICA DE NODOS Y MEDIDAS
    // -------------------------------------------------------------------------
    private String idUsuario;
    private String nombreNodo;
    private String idNodo;
    private int major;
    private int minor;

    private static Integer valorCO2Pendiente = null;
    private static Integer valorTempPendiente = null;
    private static long tiempoInicioLectura = 0;
    private static final long TIMEOUT_MS = 3000;

    // -------------------------------------------------------------------------
    // CONSTRUCTOR ACTUALIZADO
    // -------------------------------------------------------------------------
    public LogicaFake(String nombre, String direccion, int rssi, String bytesHex,
                      String prefijo, String advFlags, String advHeader,
                      String companyID, int iBeaconType, int iBeaconLength,
                      String uuidHex, String uuidString, int major, int minor, int txPower,
                      String idUsuario, String nombreNodo) {

        // Nuevos datos del beacon almacenados
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
        this.txPower = txPower;

        // Datos previos necesarios para funcionamiento
        this.major = major;
        this.minor = minor;
        this.idUsuario = idUsuario;
        this.nombreNodo = nombreNodo;
    }

    // ---------------------- (TODO EL RESTO DEL CÓDIGO SE MANTIENE IGUAL) ----------------------
    // obtenerNodo(), guardarMedida(), enviarMediciones(), etc... NO SE MODIFICAN
    // ------------------------------------------------------------------------------------------

    public void obtenerNodo(String nombreNodo) {
        this.nombreNodo = nombreNodo;

        Request request = new Request.Builder()
                .url(BASE_URL + "/nodos/propietario/" + idUsuario)
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override public void onFailure(Call call, IOException e) {
                Log.e(">>>>>>", "Error al obtener nodos: " + e.getMessage());
            }

            @Override public void onResponse(Call call, Response response) throws IOException {
                try {
                    String jsonStr = response.body().string();
                    if (!response.isSuccessful()) {
                        Log.e(">>>>>>", "Error respuesta: " + jsonStr);
                        return;
                    }

                    if (jsonStr.contains("\"" + nombreNodo + "\"")) {
                        Log.d(">>>>>>", "Nodo encontrado: " + nombreNodo);
                        return;
                    }

                    Log.d(">>>>>>", "Nodo no existe. Creando nodo: " + nombreNodo);

                    JSONObject json = new JSONObject();
                    json.put("nombre", nombreNodo);
                    json.put("propietarioId", idUsuario);

                    RequestBody body = RequestBody.create(
                            json.toString(),
                            MediaType.parse("application/json; charset=utf-8")
                    );

                    Request reqCreate = new Request.Builder()
                            .url(BASE_URL + "/nodos")
                            .post(body)
                            .build();

                    client.newCall(reqCreate).enqueue(new Callback() {
                        @Override public void onFailure(Call call, IOException e) {
                            Log.e(">>>>>>", "Error creando nodo: " + e.getMessage());
                        }

                        @Override public void onResponse(Call call, Response response) {
                            Log.d(">>>>>>", "Nodo creado OK: " + nombreNodo);
                        }
                    });

                } catch (Exception ex) {
                    Log.e(">>>>>>", "Error parseando nodos: ", ex);
                }
            }
        });
    }

    public void guardarMedida() {
        if (major >= 2800 && major <= 2899) {
            valorCO2Pendiente = minor;
            Log.d(">>>>>>", "CO₂ recibido: " + minor);
        }
        else if (major >= 3000 && major <= 3099) {
            valorTempPendiente = minor;
            Log.d(">>>>>>", "Temp recibida: " + minor);
        }
        else {
            return;
        }

        if (tiempoInicioLectura == 0)
            tiempoInicioLectura = System.currentTimeMillis();

        long tiempoTranscurrido = System.currentTimeMillis() - tiempoInicioLectura;

        if ((valorCO2Pendiente != null && valorTempPendiente != null) ||
                tiempoTranscurrido >= TIMEOUT_MS) {

            int co2 = valorCO2Pendiente != null ? valorCO2Pendiente : -1;
            int temp = valorTempPendiente != null ? valorTempPendiente : -1;

            enviarMediciones(co2, temp);

            valorCO2Pendiente = null;
            valorTempPendiente = null;
            tiempoInicioLectura = 0;
        }
    }

    private void enviarMediciones(int co2, int temp) {
        try {
            JSONObject json = new JSONObject();
            json.put("nombreNodo", nombreNodo);
            json.put("propietarioId", idUsuario);

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
                @Override public void onFailure(Call call, IOException e) {
                    Log.e(">>>>>>", "Error enviando:", e);
                }

                @Override public void onResponse(Call call, Response response) throws IOException {
                    Log.d(">>>>>>", "Servidor respondió: " + response.body().string());
                }
            });

        } catch (Exception e) {
            Log.e(">>>>>>", "Error JSON:", e);
        }
    }

    public void borrarMediciones(String uid, okhttp3.Callback callback) {
        RequestBody body = RequestBody.create(null, new byte[0]);
        Request request = new Request.Builder()
                .url(BASE_URL + "/borrarMediciones")
                .post(body)
                .build();
        client.newCall(request).enqueue(callback);
    }

    public void actualizarDistancia(String idUsuario, int distancia, okhttp3.Callback callback) {
        try {
            JSONObject json = new JSONObject();
            json.put("distancia", distancia);

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(BASE_URL + "/usuarios/" + idUsuario)
                    .put(body)
                    .build();
            client.newCall(request).enqueue(callback);
        } catch (Exception e) {
            Log.e(">>>>>>", "Error JSON:", e);
        }
    }
}

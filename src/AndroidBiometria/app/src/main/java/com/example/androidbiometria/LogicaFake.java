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

    // ----------------------------------------------------------
    // 🧱 Método crearNodoSiNoExiste()
    // ----------------------------------------------------------
    public void crearNodoSiNoExiste() {
        if (idUsuario == null) {
            Log.e(">>>>>>", "Error: idUsuario es nulo. No se puede crear/verificar nodo.");
            return;
        }

        // 1️⃣ Verificar si el usuario ya tiene nodos
        Request request = new Request.Builder()
                .url(BASE_URL + "/nodos/propietario/" + idUsuario)
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(">>>>>>", "Error al verificar nodos del usuario: " + e.getMessage(), e);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    Log.e(">>>>>>", "Error al obtener nodos: " + response.body().string());
                    return;
                }

                try {
                    String body = response.body().string();
                    JSONArray nodos = new JSONArray(body);

                    if (nodos.length() > 0) {
                        idNodo = nodos.getJSONObject(0).optString("idNodo");
                        Log.d(">>>>>>", "Usuario ya tiene nodo: " + idNodo);
                    } else {
                        Log.d(">>>>>>", "Usuario sin nodo, creando uno nuevo...");
                        crearNodo();
                    }
                } catch (Exception e) {
                    Log.e(">>>>>>", "Error al procesar respuesta de nodos: " + e.getMessage(), e);
                }
            }
        });
    }

    // ----------------------------------------------------------
    // 🧩 Método auxiliar para crear un nodo
    // ----------------------------------------------------------
    private void crearNodo() {
        try {
            JSONObject nuevoNodo = new JSONObject();
            nuevoNodo.put("nombre", "NodoAuto");
            nuevoNodo.put("propietarioId", idUsuario);

            JSONObject ubicacion = new JSONObject();
            ubicacion.put("lat", 0);
            ubicacion.put("lng", 0);
            nuevoNodo.put("ubicacion", ubicacion);

            RequestBody body = RequestBody.create(
                    nuevoNodo.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(BASE_URL + "/nodos")
                    .post(body)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(">>>>>>", "Error al crear nodo: " + e.getMessage(), e);
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (!response.isSuccessful()) {
                        Log.e(">>>>>>", "Error al crear nodo: " + response.body().string());
                    } else {
                        try {
                            JSONObject res = new JSONObject(response.body().string());
                            idNodo = res.optString("idNodo");
                            Log.d(">>>>>>", "Nodo creado exitosamente con id: " + idNodo);
                        } catch (Exception e) {
                            Log.e(">>>>>>", "Error procesando respuesta de creación: " + e.getMessage(), e);
                        }
                    }
                }
            });

        } catch (Exception e) {
            Log.e(">>>>>>", "Excepción al crear nodo: " + e.getMessage(), e);
        }
    }

    // ----------------------------------------------------------
    // 🚀 Método guardarMedida() (mantiene la lógica original)
    // ----------------------------------------------------------
    public void guardarMedida() {
        OkHttpClient client = new OkHttpClient();
        String sensor = "CO2";

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

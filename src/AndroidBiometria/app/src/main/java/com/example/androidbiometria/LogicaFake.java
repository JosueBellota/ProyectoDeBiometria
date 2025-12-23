package com.example.androidbiometria;

import android.util.Log;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @file LogicaFake.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Clase que encapsula la lógica de negocio relacionada con los nodos sensores.
 *
 * Esta clase simula parte de la lógica (de ahí el nombre "Fake") y actúa como intermediario
 * entre la recepción de datos BLE y el backend REST. Gestiona la interpretación de
 * tramas iBeacon, la detección de sensores (CO2, Temperatura) y el envío periódico
 * de mediciones al servidor.
 */
public class LogicaFake {
    private static final String BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
    private OkHttpClient client = new OkHttpClient();

    // -------------------------------------------------------------------------
    // NUEVAS VARIABLES PARA LA LÓGICA DE TIMEOUT Y DETECCIÓN MÚLTIPLE
    // -------------------------------------------------------------------------
    private static final long TIMEOUT_DETECCION_MS = 2000; // 2 segundos por sensor
    private static final long COOLDOWN_ENVIO_MS = 30000; // 30 segundos entre envíos

    // Mapa para trackear los últimos tiempos de detección por major/minor
    private static final Map<String, Long> ultimaDeteccionPorSensor = new ConcurrentHashMap<>();
    private static final Map<String, Integer> valoresPendientes = new ConcurrentHashMap<>();
    private static long ultimoEnvioExitoso = 0;

    // Variables para trackear el estado de los sensores
    private static boolean co2DetectadoRecientemente = false;
    private static boolean tempDetectadoRecientemente = false;

    // -------------------------------------------------------------------------
    // VARIABLES EXISTENTES
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
    private String idUsuario;
    private String nombreNodo;
    private String idNodo;
    private int major;
    private int minor;

    /**
     * @brief Constructor de la clase LogicaFake.
     *
     * Inicializa un objeto con todos los datos extraídos de una trama iBeacon.
     *
     * @param nombre Nombre del dispositivo BLE.
     * @param direccion Dirección MAC del dispositivo.
     * @param rssi Potencia de la señal recibida.
     * @param bytesHex Trama en crudo (hex).
     * @param prefijo Prefijo de la trama.
     * @param advFlags Flags de publicidad.
     * @param advHeader Cabecera de anuncio.
     * @param companyID ID de la compañía.
     * @param iBeaconType Tipo de iBeacon.
     * @param iBeaconLength Longitud del iBeacon.
     * @param uuidHex UUID en formato hex.
     * @param uuidString UUID como String.
     * @param major Valor Major.
     * @param minor Valor Minor (usado como valor de medición).
     * @param txPower Potencia de transmisión.
     * @param idUsuario UID del usuario actual.
     * @param nombreNodo Nombre lógico del nodo.
     */
    public LogicaFake(String nombre, String direccion, int rssi, String bytesHex, String prefijo,
                      String advFlags, String advHeader, String companyID, int iBeaconType,
                      int iBeaconLength, String uuidHex, String uuidString, int major, int minor,
                      int txPower, String idUsuario, String nombreNodo) {
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
        this.major = major;
        this.minor = minor;
        this.idUsuario = idUsuario;
        this.nombreNodo = nombreNodo;
    }

    /**
     * @brief Procesa la detección de un sensor aplicando lógica de timeout y cooldown.
     *
     * Almacena temporalmente los valores recibidos (CO2 o Temperatura según el Major)
     * y, si se han recibido ambos recientemente y ha pasado el tiempo de enfriamiento,
     * envía las mediciones al servidor.
     */
    public void procesarDeteccionConTimeout() {
        long tiempoActual = System.currentTimeMillis();
        String claveSensor = major + ":" + minor;

        // Actualizar última detección de este sensor
        ultimaDeteccionPorSensor.put(claveSensor, tiempoActual);

        // Determinar tipo de sensor y actualizar estado
        if (major >= 2800 && major <= 2999) {
            valoresPendientes.put("co2", minor);
            co2DetectadoRecientemente = true;
            Log.d(">>>>>>", "CO₂ detectado: " + minor + " (Major: " + major + ")");
        } else if (major >= 3000 && major <= 4099) {
            valoresPendientes.put("temp", minor);
            tempDetectadoRecientemente = true;
            Log.d(">>>>>>", "Temp detectada: " + minor + " (Major: " + major + ")");
        }

        // Verificar si ambos sensores fueron detectados dentro del timeout
        boolean ambosDetectados = co2DetectadoRecientemente && tempDetectadoRecientemente;
        long tiempoDesdeUltimoEnvio = tiempoActual - ultimoEnvioExitoso;

        if (ambosDetectados && tiempoDesdeUltimoEnvio >= COOLDOWN_ENVIO_MS) {
            // Ambos detectados y ha pasado el cooldown → enviar
            Integer co2 = valoresPendientes.get("co2");
            Integer temp = valoresPendientes.get("temp");

            if (co2 != null && temp != null) {
                enviarMediciones(co2, temp);
                ultimoEnvioExitoso = tiempoActual;
                Log.d(">>>>>>", "✅ Enviando mediciones - CO₂: " + co2 + ", Temp: " + temp);

                // Resetear estados después del envío exitoso
                co2DetectadoRecientemente = false;
                tempDetectadoRecientemente = false;
            }
        }
    }

    /**
     * @brief Método público para invocar el procesamiento de la medida.
     */
    public void guardarMedida() {
        // En lugar de la lógica anterior, usamos la nueva lógica con timeout
        procesarDeteccionConTimeout();
    }

    /**
     * @brief Verifica si el nodo existe en el backend y lo crea si no es así.
     * @param nombreNodo Nombre del nodo a verificar/crear.
     */
    public void obtenerNodo(String nombreNodo) {
        this.nombreNodo = nombreNodo;
        Request request = new Request.Builder()
                .url(BASE_URL + "/nodos/propietario/" + idUsuario)
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(">>>>>>", "Error al obtener nodos: " + e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
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
                        @Override
                        public void onFailure(Call call, IOException e) {
                            Log.e(">>>>>>", "Error creando nodo: " + e.getMessage());
                        }

                        @Override
                        public void onResponse(Call call, Response response) {
                            Log.d(">>>>>>", "Nodo creado OK: " + nombreNodo);
                        }
                    });
                } catch (Exception ex) {
                    Log.e(">>>>>>", "Error parseando nodos: ", ex);
                }
            }
        });
    }

    /**
     * @brief Envía las mediciones de CO2 y temperatura al backend.
     * @param co2 Valor de CO2.
     * @param temp Valor de temperatura (NO2).
     */
    private void enviarMediciones(int co2, int temp) {
        try {
            JSONObject json = new JSONObject();
            json.put("nombreNodo", this.nombreNodo);
            json.put("propietarioId", this.idUsuario);

            // Obtener ubicación real del DistanciaManager
            android.location.Location ubicacion = DistanciaManager.getUltimaUbicacionConocida();
            double lat = (ubicacion != null) ? ubicacion.getLatitude() : 0.0;
            double lon = (ubicacion != null) ? ubicacion.getLongitude() : 0.0;

            json.put("latitud", lat);
            json.put("longitud", lon);

            org.json.JSONArray lecturas = new org.json.JSONArray();

            JSONObject co2Lectura = new JSONObject();
            co2Lectura.put("tipo", "CO");
            co2Lectura.put("valor", co2);
            lecturas.put(co2Lectura);

            JSONObject tempLectura = new JSONObject();
            tempLectura.put("tipo", "NO2");
            tempLectura.put("valor", temp);
            lecturas.put(tempLectura);

            json.put("lecturas", lecturas);

            RequestBody body = RequestBody.create(
                    json.toString(),
                    MediaType.parse("application/json; charset=utf-8")
            );

            Request request = new Request.Builder()
                    .url(BASE_URL + "/lecturas") // <-- Endpoint actualizado
                    .post(body)
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    Log.e(">>>>>>", "Error enviando lecturas:", e);
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (!response.isSuccessful()) {
                        Log.e(">>>>>>", "Error del servidor al guardar lecturas: " + response.body().string());
                    } else {
                        Log.d(">>>>>>", "Servidor respondió a /lecturas: " + response.body().string());
                    }
                }
            });
        } catch (Exception e) {
            Log.e(">>>>>>", "Error creando JSON de lecturas:", e);
        }
    }

    /**
     * @brief Solicita el borrado de mediciones al backend.
     * @param uid UID del usuario.
     * @param callback Callback para manejar la respuesta.
     */
    public void borrarMediciones(String uid, okhttp3.Callback callback) {
        RequestBody body = RequestBody.create(null, new byte[0]);
        Request request = new Request.Builder()
                .url(BASE_URL + "/borrarMediciones")
                .post(body)
                .build();
        client.newCall(request).enqueue(callback);
    }

    /**
     * @brief Actualiza la distancia acumulada del usuario en el backend.
     * @param idUsuario UID del usuario.
     * @param distancia Nueva distancia (o incremento).
     * @param callback Callback para manejar la respuesta.
     */
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

package com.example.androidbiometria;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Looper;
import android.util.Log;
import android.widget.TextView;

import androidx.core.app.ActivityCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class DistanciaManager {

    private final Context context;
    private final TextView textoDistancia;
    private final FusedLocationProviderClient fusedLocation;
    private Location ultimaPosicion = null;
    private float distanciaTotal = 0f;
    private boolean tracking = false;
    private String propietarioId;
    private String nombreNodo;

    public DistanciaManager(Context ctx, TextView tv) {
        this.context = ctx;
        this.textoDistancia = tv;
        fusedLocation = LocationServices.getFusedLocationProviderClient(ctx);
    }

    // ----------------------------------------------------------------------
    // Iniciar el tracking
    // ----------------------------------------------------------------------
    public void iniciar(String propietarioId, String nombreNodo) {
        if (tracking) {
            Log.d(">>>>", "⚠️ Tracking ya está activo");
            return;
        }

        if (propietarioId == null || nombreNodo == null) {
            Log.e(">>>>", "❌ PropietarioId o nombreNodo son nulos");
            return;
        }

        this.propietarioId = propietarioId;
        this.nombreNodo = nombreNodo;
        tracking = true;
        distanciaTotal = 0f; // Resetear distancia al iniciar

        Log.d(">>>>", "🚀 Iniciando tracking para: " + nombreNodo);

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            Log.e(">>>>", "❌ No tiene permiso de ubicación");
            tracking = false;
            return;
        }

        try {
            // Petición de ubicación cada 5s
            LocationRequest request = LocationRequest.create()
                    .setInterval(5000)
                    .setFastestInterval(4000)
                    .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

            fusedLocation.requestLocationUpdates(request, callback, Looper.getMainLooper());
            Log.d(">>>>", "✅ Location updates iniciados correctamente");

        } catch (SecurityException e) {
            Log.e(">>>>", "❌ Error de seguridad al solicitar ubicación: " + e.getMessage());
            tracking = false;
        } catch (Exception e) {
            Log.e(">>>>", "❌ Error inesperado al iniciar tracking: " + e.getMessage());
            tracking = false;
        }
    }

    // ----------------------------------------------------------------------
    // Detener seguimiento
    // ----------------------------------------------------------------------
    public void detener() {
        if (tracking) {
            tracking = false;
            try {
                fusedLocation.removeLocationUpdates(callback);
                Log.d(">>>>", "🛑 Tracking detenido");
            } catch (Exception e) {
                Log.e(">>>>", "❌ Error al detener tracking: " + e.getMessage());
            }
        }
    }

    // ----------------------------------------------------------------------
    // Callback de ubicación
    // ----------------------------------------------------------------------
    private LocationCallback callback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult result) {
            if (!tracking) return;

            if (result == null) {
                Log.d(">>>>", "📍 LocationResult es nulo");
                return;
            }

            for (Location loc : result.getLocations()) {
                procesarNuevaPosicion(loc);
            }
        }
    };

    // ----------------------------------------------------------------------
    // PROCESAR CADA NUEVA POSICIÓN
    // ----------------------------------------------------------------------
    private void procesarNuevaPosicion(Location loc) {
        if (loc == null) {
            Log.d(">>>>", "📍 Location es nula");
            return;
        }

        Log.d(">>>>", "📍 Nueva ubicación: " + loc.getLatitude() + ", " + loc.getLongitude() + " - Precisión: " + loc.getAccuracy() + "m");

        if (ultimaPosicion != null) {
            float metros = ultimaPosicion.distanceTo(loc);
            // Solo contar distancias significativas (más de 2 metros y con buena precisión)
            if (metros > 2.0f && loc.getAccuracy() < 20.0f) {
                distanciaTotal += metros;
                Log.d(">>>>", "📏 Distancia añadida: " + metros + "m - Total: " + distanciaTotal + "m");
            } else {
                Log.d(">>>>", "⏭️ Distancia ignorada: " + metros + "m (precisión: " + loc.getAccuracy() + "m)");
            }
        } else {
            Log.d(">>>>", "📍 Primera ubicación recibida");
        }

        ultimaPosicion = loc;

        // Mostrar en interfaz
        if (textoDistancia != null) {
            textoDistancia.post(() -> {
                textoDistancia.setText("Distancia: " + (int) distanciaTotal + " m");
            });
        }

        // Enviar al servidor cada 10 metros o más
        if (distanciaTotal >= 10) {
            enviarDistanciaServidor((int) distanciaTotal);
        }
    }

    // ----------------------------------------------------------------------
    // Enviar distancia al servidor
    // ----------------------------------------------------------------------
    private void enviarDistanciaServidor(int distancia) {
        Log.d(">>>>", "🌐 Enviando distancia al servidor: " + distancia + "m");

        new Thread(() -> {
            try {
                URL url = new URL("https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST/usuarios/" + propietarioId);

                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("PUT");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                JSONObject body = new JSONObject();
                body.put("distancia", distancia);

                String bodyString = body.toString();
                Log.d(">>>>", "📦 Enviando JSON: " + bodyString);

                OutputStream os = conn.getOutputStream();
                os.write(bodyString.getBytes());
                os.flush();
                os.close();

                int responseCode = conn.getResponseCode();
                Log.d(">>>>", "📡 Respuesta del servidor: " + responseCode);

                if (responseCode == 200) {
                    Log.d(">>>>", "✅ Distancia enviada correctamente");
                } else {
                    Log.e(">>>>", "❌ Error en respuesta del servidor: " + responseCode);
                }

                conn.disconnect();

            } catch (Exception e) {
                Log.e(">>>>", "❌ Error enviando distancia: " + e.getMessage());
            }
        }).start();
    }

    // ----------------------------------------------------------------------
    // Método para verificar estado
    // ----------------------------------------------------------------------
    public boolean isTracking() {
        return tracking;
    }
}
package com.example.androidbiometria;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Looper;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class DistanciaManager {

    private final Context context;
    private final TextView textoDistancia;
    private final FusedLocationProviderClient fusedLocation;
    private final MovementDetector movementDetector;

    private float distanciaTotal = 0f;
    private float distanciaEnviadaAlServidor = 0f;
    private boolean tracking = false;
    private String propietarioId;
    private String nombreNodo;

    private final List<Location> locationBatch = new ArrayList<>();
    private ScheduledExecutorService executorService;
    private Location lastSignificantLocation = null;

    public DistanciaManager(Context ctx, TextView tv) {
        this.context = ctx;
        this.textoDistancia = tv;
        this.fusedLocation = LocationServices.getFusedLocationProviderClient(ctx);
        this.movementDetector = new MovementDetector(ctx);
    }

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
        resetearDistancia(); // Reset everything on start
        movementDetector.start();

        Log.d(">>>>", "🚀 Iniciando tracking para: " + nombreNodo);

        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.e(">>>>", "❌ No tiene permiso de ubicación");
            tracking = false;
            return;
        }

        try {
            LocationRequest request = LocationRequest.create()
                    .setInterval(1000) // Recoger ubicación cada segundo
                    .setFastestInterval(1000)
                    .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);

            fusedLocation.requestLocationUpdates(request, callback, Looper.getMainLooper());
            Log.d(">>>>", "✅ Location updates iniciados correctamente");

            executorService = Executors.newSingleThreadScheduledExecutor();
            executorService.scheduleAtFixedRate(this::processLocationBatch, 3, 3, TimeUnit.SECONDS); // Update every 3 seconds
            Log.d(">>>>", "✅ Procesamiento de lotes de ubicaciones iniciado (cada 3s)");

        } catch (SecurityException e) {
            Log.e(">>>>", "❌ Error de seguridad al solicitar ubicación: " + e.getMessage());
            tracking = false;
        } catch (Exception e) {
            Log.e(">>>>", "❌ Error inesperado al iniciar tracking: " + e.getMessage());
            tracking = false;
        }
    }

    public void detener() {
        if (tracking) {
            tracking = false;
            movementDetector.stop();
            try {
                // Enviar la última distancia acumulada antes de detener
                if(distanciaTotal > distanciaEnviadaAlServidor) {
                    enviarDistanciaServidor((int) distanciaTotal);
                }
                fusedLocation.removeLocationUpdates(callback);
                if (executorService != null && !executorService.isShutdown()) {
                    executorService.shutdown();
                }
                Log.d(">>>>", "🛑 Tracking detenido");
            } catch (Exception e) {
                Log.e(">>>>", "❌ Error al detener tracking: " + e.getMessage());
            }
        }
    }

    private final LocationCallback callback = new LocationCallback() {
        @Override
        public void onLocationResult(LocationResult result) {
            if (!tracking || result == null) return;
            synchronized (locationBatch) {
                locationBatch.addAll(result.getLocations());
            }
        }
    };

    private void processLocationBatch() {
        if (!movementDetector.isMoving()) {
            // Log.d(">>>>", "🚶‍➡️ No hay movimiento detectado, ignorando lote de GPS.");
            synchronized (locationBatch) {
                locationBatch.clear();
            }
            // Enviar la distancia actual si ha cambiado y no se ha enviado
             if(distanciaTotal > distanciaEnviadaAlServidor) {
                enviarDistanciaServidor((int) distanciaTotal);
                distanciaEnviadaAlServidor = distanciaTotal;
            }
            return;
        }
        
        List<Location> batchToProcess;
        synchronized (locationBatch) {
            if (locationBatch.isEmpty()) {
                return;
            }
            batchToProcess = new ArrayList<>(locationBatch);
            locationBatch.clear();
        }

        if (!batchToProcess.isEmpty()) {
            Location lastReceivedLoc = batchToProcess.get(batchToProcess.size() - 1);
            float currentAccuracy = lastReceivedLoc.getAccuracy();
            textoDistancia.post(() ->
                Toast.makeText(context, "Precisión: " + (int) currentAccuracy + "m", Toast.LENGTH_SHORT).show()
            );
        }

        List<Location> accurateLocations = new ArrayList<>();
        for (Location loc : batchToProcess) {
            if (loc.getAccuracy() < 8.0f) { // Umbral de precisión de 8 metros
                accurateLocations.add(loc);
            }
        }

        if (accurateLocations.isEmpty()) {
            if(!batchToProcess.isEmpty()){
                Location lastKnown = batchToProcess.get(batchToProcess.size() - 1);
                updateUIText("Esperando Precisión (" + (int) lastKnown.getAccuracy() + "m)");
                Log.d(">>>>", "📍 Lote sin ubicaciones precisas. Última precisión: " + lastKnown.getAccuracy());
            }
            return;
        }

        Collections.sort(accurateLocations, (l1, l2) -> Long.compare(l1.getTime(), l2.getTime()));

        if (lastSignificantLocation == null) {
            lastSignificantLocation = accurateLocations.get(accurateLocations.size() - 1);
            Log.d(">>>>", "📍 Primera ubicación significativa obtenida. Precisión: " + lastSignificantLocation.getAccuracy() + "m");
            return;
        }

        for (Location currentLocation : accurateLocations) {
            float timeDiff = (currentLocation.getTime() - lastSignificantLocation.getTime()) / 1000.0f;
            if (timeDiff <= 0.5) continue; 

            float distance = lastSignificantLocation.distanceTo(currentLocation);
            float speed = distance / timeDiff;

            if (speed < 10.0f && distance > 3.0f) {
                distanciaTotal += distance;
                lastSignificantLocation = currentLocation;
                 Log.d(">>>>", "📏 Distancia añadida: " + distance + "m @ " + speed + "m/s. Total: " + distanciaTotal + "m");
            } else {
                Log.d(">>>>", "⏭️ Movimiento ignorado. Velocidad: " + speed + " m/s, Distancia: " + distance + "m");
            }
        }

        updateUIText("Distancia: " + (int) distanciaTotal + " m");

        // Enviar al servidor si la distancia ha cambiado
        if (distanciaTotal > distanciaEnviadaAlServidor) {
            enviarDistanciaServidor((int) distanciaTotal);
            distanciaEnviadaAlServidor = distanciaTotal;
        }
    }

    private void updateUIText(final String text) {
        if (textoDistancia != null) {
            textoDistancia.post(() -> textoDistancia.setText(text));
        }
    }
    
    public void resetearDistancia() {
        distanciaTotal = 0f;
        distanciaEnviadaAlServidor = 0f;
        lastSignificantLocation = null;
        synchronized(locationBatch) {
            locationBatch.clear();
        }
        updateUIText("Distancia: 0 m");
        Log.d(">>>>", "🔄 Distancia reseteada a 0");
    
        // Notificar al servidor que la distancia se ha reseteado
        if (propietarioId != null) {
            enviarDistanciaServidor(0);
        }
    }
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
                OutputStream os = conn.getOutputStream();
                os.write(body.toString().getBytes());
                os.flush();
                os.close();
                int responseCode = conn.getResponseCode();
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

    public boolean isTracking() {
        return tracking;
    }
}
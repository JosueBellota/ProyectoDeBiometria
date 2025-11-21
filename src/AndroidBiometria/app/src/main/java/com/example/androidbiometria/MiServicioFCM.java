package com.example.androidbiometria;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.util.Log;
import android.Manifest;


import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;


import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MiServicioFCM extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        String mensaje = remoteMessage.getData().get("mensaje");
        String colorTexto = remoteMessage.getData().get("color");

        Log.d("FCM", "Mensaje recibido: " + mensaje + " | Color: " + colorTexto);

        // --- Generar Notificación Local ---
        int color = Color.RED;

        // Crear el canal (solo una vez) para Android 8.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel canal = new NotificationChannel(
                    "canal_alertas",            // ID del canal
                    "Alertas",                  // Nombre visible del canal
                    NotificationManager.IMPORTANCE_HIGH
            );
            canal.setDescription("Canal de notificaciones de alertas");
            canal.enableLights(true);
            canal.setLightColor(color);
            canal.enableVibration(true);
            NotificationManager gestor = getSystemService(NotificationManager.class);
            if (gestor != null) gestor.createNotificationChannel(canal);
        }

        // Construir la notificación
        NotificationCompat.Builder noti = new NotificationCompat.Builder(this, "canal_alertas")
                .setSmallIcon(android.R.drawable.stat_sys_warning)
                .setContentTitle("Alerta")
                .setContentText(mensaje)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(mensaje))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setColor(color)
                .setColorized(true)
                .setAutoCancel(true);

        // Verificar permiso POST_NOTIFICATIONS
        if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            Log.w(">>>>>>", "Sin permiso POST_NOTIFICATIONS en Android 13+ para el servicio FCM");
            return;
        }


        NotificationManagerCompat.from(this).notify(123, noti.build());

        // Sonido al aparecer la notificación
        new Thread(() -> {
            ToneGenerator tg = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            for (int i = 0; i < 3; i++) {
                tg.startTone(ToneGenerator.TONE_PROP_BEEP, 200);
                try { Thread.sleep(250); } catch (InterruptedException ignored) {}
            }
            tg.release();
        }).start();

        Log.d(">>>>>>", "Notificación generada desde FCM: " + mensaje);
    }
}

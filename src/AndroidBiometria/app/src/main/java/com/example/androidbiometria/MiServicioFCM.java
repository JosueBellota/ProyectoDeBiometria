package com.example.androidbiometria;

import android.content.Intent;
import android.util.Log;


import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MiServicioFCM extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        String mensaje = remoteMessage.getData().get("mensaje");
        String color = remoteMessage.getData().get("color");

        Log.d("FCM", "Mensaje recibido: " + mensaje + " | Color: " + color);

        // Llamar a MainActivity para mostrar la notificación
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("mensaje", mensaje);
        intent.putExtra("color", color);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
    }
}

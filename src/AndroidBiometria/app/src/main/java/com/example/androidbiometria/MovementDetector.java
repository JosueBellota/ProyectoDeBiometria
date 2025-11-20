package com.example.androidbiometria;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.util.Log;

public class MovementDetector implements SensorEventListener {

    private final SensorManager sensorManager;
    private final Sensor accelerometer;

    private static final float MOVE_THRESHOLD = 0.5f; // m/s^2
    private boolean isMoving = false;
    private long lastCheckTime = 0;

    private final float[] gravity = new float[3];
    private final float[] linear_acceleration = new float[3];

    public MovementDetector(Context context) {
        sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
    }

    public void start() {
        if (accelerometer != null) {
            sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_NORMAL);
            Log.d(">>>>", "✅ MovementDetector iniciado");
        } else {
            Log.e(">>>>", "❌ Acelerómetro no disponible");
        }
    }

    public void stop() {
        sensorManager.unregisterListener(this);
        Log.d(">>>>", "🛑 MovementDetector detenido");
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        // Alpha for low-pass filter to isolate gravity
        final float alpha = 0.8f;

        // Isolate gravity with a low-pass filter.
        gravity[0] = alpha * gravity[0] + (1 - alpha) * event.values[0];
        gravity[1] = alpha * gravity[1] + (1 - alpha) * event.values[1];
        gravity[2] = alpha * gravity[2] + (1 - alpha) * event.values[2];

        // Remove gravity to get linear acceleration.
        linear_acceleration[0] = event.values[0] - gravity[0];
        linear_acceleration[1] = event.values[1] - gravity[1];
        linear_acceleration[2] = event.values[2] - gravity[2];

        // Check for movement only periodically to avoid being too sensitive
        long currentTime = System.currentTimeMillis();
        if ((currentTime - lastCheckTime) > 500) { // Check every 500ms
            float accelerationMagnitude = (float) Math.sqrt(
                    linear_acceleration[0] * linear_acceleration[0] +
                    linear_acceleration[1] * linear_acceleration[1] +
                    linear_acceleration[2] * linear_acceleration[2]
            );

            isMoving = accelerationMagnitude > MOVE_THRESHOLD;
            lastCheckTime = currentTime;
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        // Not needed for this use case
    }

    public boolean isMoving() {
        return isMoving;
    }
}

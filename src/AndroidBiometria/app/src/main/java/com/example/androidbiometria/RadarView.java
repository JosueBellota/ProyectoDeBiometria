package com.example.androidbiometria;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.View;

/**
 * @file RadarView.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Vista personalizada que simula un radar para indicar la proximidad.
 *
 * Dibuja tres zonas concéntricas (anillos) y las ilumina con diferentes colores
 * según la distancia detectada (zona actual).
 */
public class RadarView extends View {

    // 0 = Cerca (<1m), 1 = Media (1-3m), 2 = Lejos (>3m), -1 = Inactivo
    private int currentZone = -1;

    private Paint paintFill;
    private Paint paintStroke;

    /**
     * @brief Constructor programático.
     * @param context Contexto de la aplicación.
     */
    public RadarView(Context context) {
        super(context);
        init();
    }

    /**
     * @brief Constructor XML.
     * @param context Contexto de la aplicación.
     * @param attrs Atributos XML.
     */
    public RadarView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    /**
     * @brief Inicializa los pinceles para el dibujo.
     */
    private void init() {
        paintFill = new Paint();
        paintFill.setStyle(Paint.Style.FILL);
        paintFill.setAntiAlias(true);

        paintStroke = new Paint();
        paintStroke.setStyle(Paint.Style.STROKE);
        paintStroke.setStrokeWidth(5);
        paintStroke.setColor(Color.LTGRAY); // Color base de los anillos inactivos
        paintStroke.setAntiAlias(true);
    }

    /**
     * @brief Establece la zona actual y fuerza el redibujado.
     * @param zone Zona a iluminar (0: Cerca, 1: Media, 2: Lejos, -1: Ninguna).
     */
    public void setZone(int zone) {
        this.currentZone = zone;
        invalidate(); // Redibujar
    }

    /**
     * @brief Dibuja el radar y los anillos en el canvas.
     * @param canvas Canvas donde se dibuja.
     */
    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int width = getWidth();
        int height = getHeight();
        int centerX = width / 2;
        int centerY = height / 2;
        int maxRadius = Math.min(width, height) / 2 - 10; // Margen

        // Radios para los 3 anillos
        int r3 = maxRadius;           // Lejos
        int r2 = (int) (maxRadius * 0.66); // Media
        int r1 = (int) (maxRadius * 0.33); // Cerca

        // --- DIBUJAR BASE (CONTORNOS) ---
        canvas.drawCircle(centerX, centerY, r3, paintStroke);
        canvas.drawCircle(centerX, centerY, r2, paintStroke);
        canvas.drawCircle(centerX, centerY, r1, paintStroke);

        // --- COLOREAR SEGÚN ZONA ---
        if (currentZone == 0) {
            // ZONA CERCA: Círculo central VERDE
            paintFill.setColor(Color.GREEN);
            canvas.drawCircle(centerX, centerY, r1, paintFill);
        } else if (currentZone == 1) {
            // ZONA MEDIA: Anillo medio NARANJA
            paintFill.setColor(Color.rgb(255, 165, 0)); // Orange
            // Dibujamos círculo mediano lleno y "borramos" el centro pintando encima?
            // Mejor dibujamos un donut usando Stroke muy grueso o simplemente el círculo mediano
            // Para simplificar visualmente: Pintamos el círculo mediano de naranja
            canvas.drawCircle(centerX, centerY, r2, paintFill);
            // Opcional: Si quieres que el centro se mantenga gris/blanco, habría que pintar el r1 de blanco encima.
            // Pero "rellenar" hasta el nivel actual suele ser intuitivo.
            // Si el requisito es "anillo", pintaremos r2 y luego r1 en blanco/fondo?
            // Vamos a hacerlo acumulativo (estilo sonar) o exclusivo?
            // El usuario dijo "primer, segundo y tercer anillo de diferente color".
            // Vamos a pintar el anillo correspondiente.
        } else if (currentZone == 2) {
            // ZONA LEJOS: Anillo exterior ROJO
            paintFill.setColor(Color.RED);
            canvas.drawCircle(centerX, centerY, r3, paintFill);
        }

        // Si queremos efecto "donut" estricto (solo el anillo se ilumina):
        if (currentZone == 2) {
            // Borrar el interior del anillo 3 (pintando con el fondo o color inactivo)
            paintFill.setColor(Color.WHITE); // Asumiendo fondo blanco
            canvas.drawCircle(centerX, centerY, r2, paintFill);
            // Redibujar contorno perdido
            canvas.drawCircle(centerX, centerY, r2, paintStroke);
        }
        if (currentZone == 1) {
            // Borrar el interior del anillo 2
            paintFill.setColor(Color.WHITE);
            canvas.drawCircle(centerX, centerY, r1, paintFill);
            // Redibujar contorno perdido
            canvas.drawCircle(centerX, centerY, r1, paintStroke);
        }
    }
}

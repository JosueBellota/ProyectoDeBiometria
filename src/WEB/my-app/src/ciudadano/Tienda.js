// src/ciudadano/Tienda.js
import React from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import "./css/ciudadano.css";

export default function Tienda() {
  return (
    <>
      {/* Header del ciudadano registrado */}
      <HeaderRegistrado />

      <div className="tienda-container">
        <h1 className="tienda-title">Tienda</h1>

        <p className="tienda-subtitle">
          Usa tus monedas para desbloquear mejoras y funciones especiales.
        </p>

        <div className="tienda-grid">
          <article className="tienda-item">
            <h3>Icono Premium</h3>
            <p>Personaliza tu perfil con un icono exclusivo.</p>
            <button className="tienda-btn">Comprar (50 monedas)</button>
          </article>

          <article className="tienda-item">
            <h3>Reporte Avanzado</h3>
            <p>Accede a estadísticas detalladas de tus mediciones.</p>
            <button className="tienda-btn">Comprar (100 monedas)</button>
          </article>

          <article className="tienda-item">
            <h3>Mapa Temático</h3>
            <p>Desbloquea nuevos estilos visuales en el mapa.</p>
            <button className="tienda-btn">Comprar (75 monedas)</button>
          </article>
        </div>
      </div>
    </>
  );
}

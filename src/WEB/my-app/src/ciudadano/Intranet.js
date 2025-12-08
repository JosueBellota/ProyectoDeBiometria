// --------------------------------------------------------------------------
// Fichero: Informacion.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la información para el ciudadano.
// --------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import "../css/main.css";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import InterpolationLayer from "./InterpolationLayer";
import data from './FeaturesFaq.json';

// Static 4x4 grid of readings in Gandia
const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;
const offset = 0.00225; // Approximately 0.25 km

const mockLecturas = [];
let idCounter = 0;

for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 4; col++) {
    const latitud = gandiaCenterLat + (row - 1.5) * offset; // Center the grid
    const longitud = gandiaCenterLng + (col - 1.5) * offset; // Center the grid

    let medida;
    if (row < 2 && col < 2) {
      medida = 80 + Math.random() * 10; // Red corner (top-left 2x2)
    } else if (row >= 2 && col >= 2) {
      medida = 10 + Math.random() * 10; // Green corner (bottom-right 2x2)
    } else {
      medida = 40 + Math.random() * 10; // Yellow middle (remaining points)
    }

    // Generate a random date and time within the last 24 hours for demonstration
    const randomDate = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const fecha = randomDate.toLocaleString(); // Format as local date and time string

    mockLecturas.push({
      id: idCounter++,
      latitud: latitud,
      longitud: longitud,
      medida: medida,
      fecha: fecha,
      tipoSensor: "CO2",
    });
  }
}


const getColor = (medida) => {
  if (medida <= 30) return "green";
  if (medida <= 60) return "yellow";
  return "red";
};

const DynamicRadiusCircleMarkers = ({ lecturas }) => {
  const [zoomLevel, setZoomLevel] = useState(13); // Initial zoom level

  const mapEvents = useMapEvents({
    zoomend: () => {
      setZoomLevel(mapEvents.getZoom());
    },
  });

  const getRadius = (zoom) => {
    if (zoom < 12) return 2;
    if (zoom < 14) return 4;
    if (zoom < 16) return 8;
    return 12;
  };

  return (
    <>
      {lecturas.map(lectura => (
        <CircleMarker
          key={lectura.id}
          center={[lectura.latitud, lectura.longitud]}
          radius={getRadius(zoomLevel)}
          pathOptions={{ color: getColor(lectura.medida), fillColor: getColor(lectura.medida), fillOpacity: 0.8 }}
        >
          <Popup>
            CO2: {lectura.medida.toFixed(2)} <br />
            Valor: {lectura.medida.toFixed(2)} <br />
            Tiempo: {lectura.fecha}
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};


function Intranet() {
  const [featureIndex, setFeatureIndex] = useState(0);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const [mapView, setMapView] = useState('points'); // 'points' or 'interpolation'
  const gandiaPosition = [38.96667, -0.18333];

  const siguienteFeature = () => {
    setFeatureIndex((prev) => (prev + 1) % data.features.length);
  };

  const anteriorFeature = () => {
    setFeatureIndex((prev) => (prev - 1 + data.features.length) % data.features.length);
  };

  const toggleFaq = (index) => {
    setFaqAbierta((prev) => (prev === index ? null : index));
  };

  const toggleMapView = () => {
    setMapView(mapView === 'points' ? 'interpolation' : 'points');
  };

  return (
    <div className="home-page">
      <HeaderRegistrado />

      <main className="home-content">
        {/* Hero */}
        <section className="home-hero">
          <h1 className="home-hero-title">Tu ruta, tu aire, tu impacto.</h1>
          <button onClick={toggleMapView}>
            {mapView === 'points' ? "Mostrar Mapa de Interpolación" : "Mostrar Puntos"}
          </button>
          <MapContainer center={gandiaPosition} zoom={13} className="home-main-map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {mapView === 'points' ? (
              <DynamicRadiusCircleMarkers lecturas={mockLecturas} />
            ) : (
              <InterpolationLayer lecturas={mockLecturas} />
            )}
          </MapContainer>
        </section>

        {/* Cómo funciona nuestro servicio */}
        <section className="home-how">
          <h2 className="home-how-title">¿Cómo funciona nuestro servicio?</h2>

          {/* Versión escritorio: tres tarjetas */}
          <div className="home-features-desktop">
            {data.features.map((f) => (
              <article key={f.id} className="home-feature-card">
                <img src={f.img} alt={f.alt} className="home-feature-image" />
                <h3 className="home-feature-title">{f.titulo}</h3>
                <p className="home-feature-text">{f.texto}</p>
              </article>
            ))}
          </div>

          {/* Versión móvil: slider con flechas */}
          <div className="home-features-mobile">
            <button
              type="button"
              className="home-feature-arrow"
              onClick={anteriorFeature}
              aria-label="Anterior"
            >
              
            </button>

            <article className="home-feature-card mobile">
              <img
                src={data.features[featureIndex].img}
                alt={data.features[featureIndex].alt}
                className="home-feature-image"
              />
              <h3 className="home-feature-title">
                {data.features[featureIndex].titulo}
              </h3>
              <p className="home-feature-text">
                {data.features[featureIndex].texto}
              </p>
            </article>

            <button
              type="button"
              className="home-feature-arrow"
              onClick={siguienteFeature}
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </section>

        {/* FAQ */}
        <section className="home-faq-section">
          <h2 className="home-faq-title">FAQ</h2>

          <div className="home-faq-list">
            {data.faqs.map((item, index) => (
              <div
                key={index}
                className={`faq-item ${faqAbierta === index ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{item.pregunta}</span>
                  <span className="faq-toggle-icon">⌄</span>
                </button>
                {faqAbierta === index && (
                  <div className="faq-answer">
                    <p>{item.respuesta}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contacto */}
        <section className="home-contact">
          <p>contacto@mail.com</p>
        </section>

        <footer className="home-footer">
          <span>GTI 2025©</span>
        </footer>
      </main>
    </div>
  );
}

export default Intranet;

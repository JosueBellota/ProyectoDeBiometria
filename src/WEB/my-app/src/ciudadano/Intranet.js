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

const features = [
  {
    id: 0,
    titulo: "Recorrido y trazado personal",
    texto:
      "Visualiza las rutas que recorres y cómo varían las condiciones ambientales a lo largo del camino. Transforma tus pasos en datos útiles para mejorar la ciudad.",
    img: "/recorrido.png",
    alt: "Mapa con un recorrido marcado"
  },
  {
    id: 1,
    titulo: "Información meteorológica en el mapa",
    texto:
      "Lleva tu nodo y observa en tiempo real la temperatura, el aire o el CO₂ de tu entorno. Contribuye a un mapa colectivo que muestra cómo respira la ciudad.",
    img: "/informacion.png",
    alt: "Mapa con información meteorológica"
  },
  {
    id: 2,
    titulo: "Gráficas y análisis de datos",
    texto:
      "Consulta gráficos con las mediciones de tu nodo. Detecta patrones, compara zonas y comprende mejor el ambiente que te rodea.",
    img: "/grafica.png",
    alt: "Gráficas de datos ambientales"
  }
];

const faqs = [
  {
    pregunta: "1. ¿Qué es un nodo y para qué sirve?",
    respuesta:
      "Un nodo es un pequeño dispositivo portátil que mide diferentes parámetros ambientales como temperatura, humedad o concentración de CO₂. Sirve para recoger datos mientras te desplazas por la ciudad."
  },
  {
    pregunta: "2. ¿Quién puede solicitar un nodo?",
    respuesta:
      "Cualquier ciudadano interesado, así como centros educativos, asociaciones o administraciones locales que quieran participar en la monitorización del aire."
  },
  {
    pregunta: "3. ¿Necesito tener conocimientos técnicos para usarlo?",
    respuesta:
      "No. El nodo está pensado para ser sencillo: solo tienes que llevarlo contigo encendido. La aplicación se encarga de procesar y mostrar los datos."
  },
  {
    pregunta: "4. ¿Qué información puedo ver en la aplicación?",
    respuesta:
      "Podrás ver tus recorridos, las mediciones asociadas a cada tramo, mapas de calor y gráficos que resumen el comportamiento de las variables ambientales."
  },
  {
    pregunta: "5. ¿Qué diferencia hay entre usuarios registrados y no registrados?",
    respuesta:
      "Los usuarios registrados pueden vincular un nodo, guardar su historial de rutas, descargar datos y personalizar alertas. Los no registrados solo pueden explorar mapas y estadísticas generales."
  },
  {
    pregunta: "6. ¿Qué pasa con mis datos personales?",
    respuesta:
      "Solo almacenamos los datos imprescindibles para el funcionamiento del servicio. Las rutas se anonimizan y puedes solicitar la eliminación de tu cuenta y tus datos en cualquier momento."
  },
  {
    pregunta: "7. ¿Es necesario registrarse para ver los datos?",
    respuesta:
      "No. Puedes consultar mapas y estadísticas públicas sin registrarte. El registro solo es necesario si quieres asociar un nodo y guardar tu información personal de uso."
  }
];

// Static 4x4 grid of readings in Gandia
const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;
const offset = 0.00225; // Approximately 0.25 km

const mockLecturas = [];
let idCounter = 0;

for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 4; col++) {
    const lat = gandiaCenterLat + (row - 1.5) * offset; // Center the grid
    const lng = gandiaCenterLng + (col - 1.5) * offset; // Center the grid

    let valor;
    if (row < 2 && col < 2) {
      valor = 80 + Math.random() * 10; // Red corner (top-left 2x2)
    } else if (row >= 2 && col >= 2) {
      valor = 10 + Math.random() * 10; // Green corner (bottom-right 2x2)
    } else {
      valor = 40 + Math.random() * 10; // Yellow middle (remaining points)
    }

    // Generate a random date and time within the last 24 hours for demonstration
    const randomDate = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
    const fecha = randomDate.toLocaleString(); // Format as local date and time string

    mockLecturas.push({
      id: idCounter++,
      lat: lat,
      lng: lng,
      valor: valor,
      fecha: fecha,
    });
  }
}


const getColor = (valor) => {
  if (valor <= 30) return "green";
  if (valor <= 60) return "yellow";
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
          center={[lectura.lat, lectura.lng]}
          radius={getRadius(zoomLevel)}
          pathOptions={{ color: getColor(lectura.valor), fillColor: getColor(lectura.valor), fillOpacity: 0.8 }}
        >
          <Popup>
            Valor: {lectura.valor.toFixed(2)} <br />
            Fecha: {lectura.fecha}
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};


function Intranet() {
  const [featureIndex, setFeatureIndex] = useState(0);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const gandiaPosition = [38.96667, -0.18333];

  const siguienteFeature = () => {
    setFeatureIndex((prev) => (prev + 1) % features.length);
  };

  const anteriorFeature = () => {
    setFeatureIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const toggleFaq = (index) => {
    setFaqAbierta((prev) => (prev === index ? null : index));
  };

  return (
    <div className="home-page">
      <HeaderRegistrado />

      <main className="home-content">
        {/* Hero */}
        <section className="home-hero">
          <h1 className="home-hero-title">Tu ruta, tu aire, tu impacto.</h1>
          <MapContainer center={gandiaPosition} zoom={13} className="home-main-map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <DynamicRadiusCircleMarkers lecturas={mockLecturas} />
          </MapContainer>
        </section>

        {/* Cómo funciona nuestro servicio */}
        <section className="home-how">
          <h2 className="home-how-title">¿Cómo funciona nuestro servicio?</h2>

          {/* Versión escritorio: tres tarjetas */}
          <div className="home-features-desktop">
            {features.map((f) => (
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
              ‹
            </button>

            <article className="home-feature-card mobile">
              <img
                src={features[featureIndex].img}
                alt={features[featureIndex].alt}
                className="home-feature-image"
              />
              <h3 className="home-feature-title">
                {features[featureIndex].titulo}
              </h3>
              <p className="home-feature-text">
                {features[featureIndex].texto}
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
            {faqs.map((item, index) => (
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

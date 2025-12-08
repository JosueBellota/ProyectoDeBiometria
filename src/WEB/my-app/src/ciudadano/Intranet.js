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

const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;
const offset = 0.00225; // Approximately 0.25 km
let idCounter = 0;

const generateReadings = (type, count, options) => {
    const readings = [];
    let range;
    // Values are generated to be around the color change thresholds
    switch (type) {
        case 'CO2':
            range = { green: 400, yellow: 700, red: 1100 };
            break;
        case 'NO2':
            range = { green: 80, yellow: 150, red: 220 };
            break;
        case 'O3':
            range = { green: 100, yellow: 150, red: 190 };
            break;
        default:
            range = { green: 0, yellow: 0, red: 0 };
    }

    const side = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
        let lat, lng;
        const row = Math.floor(i / side);
        const col = i % side;

        lat = gandiaCenterLat + (row - side / 2) * offset * 0.5 + options.latOffset;
        lng = gandiaCenterLng + (col - side / 2) * offset * 0.5 + options.lngOffset;


        let medida;
        const third = count / 3;
        if (i < third) {
            medida = range.green + (Math.random() - 0.5) * 50;
        } else if (i < 2 * third) {
            medida = range.yellow + (Math.random() - 0.5) * 50;
        } else {
            medida = range.red + (Math.random() - 0.5) * 50;
        }
        medida = Math.max(0, Math.round(medida));

        const randomDate = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
        const fecha = randomDate.toLocaleString();

        readings.push({
            id: idCounter++,
            latitud: lat,
            longitud: lng,
            medida: medida,
            fecha: fecha,
            tipoSensor: type,
        });
    }

    const extraPoints = 10;
    const awayOffset = offset * 4; // 1km

    for (let i = 0; i < extraPoints; i++) {
        let lat, lng;
        const angle = (i / extraPoints) * 2 * Math.PI;
        lat = gandiaCenterLat + options.latOffset + Math.cos(angle) * awayOffset;
        lng = gandiaCenterLng + options.lngOffset + Math.sin(angle) * awayOffset;

        let medida = range.green + (Math.random() - 0.5) * 20; // mostly green
        medida = Math.max(0, Math.round(medida));

        const randomDate = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
        const fecha = randomDate.toLocaleString();

        readings.push({
            id: idCounter++,
            latitud: lat,
            longitud: lng,
            medida: medida,
            fecha: fecha,
            tipoSensor: type,
        });
    }


    return readings;
};

const mockLecturas = [
    ...generateReadings('CO2', 30, { latOffset: 0, lngOffset: 0 }),
    ...generateReadings('NO2', 30, { latOffset: offset * 0.3, lngOffset: offset * 0.3 }),
    ...generateReadings('O3', 30, { latOffset: -offset * 0.3, lngOffset: -offset * 0.3 }),
];


const colorScales = {
    'CO2': (medida) => {
        if (medida < 450) return 'green';
        if (medida <= 1000) return 'yellow';
        return 'red';
    },
    'NO2': (medida) => {
        if (medida < 100) return 'green';
        if (medida <= 200) return 'yellow';
        return 'red';
    },
    'O3': (medida) => {
        if (medida < 120) return 'green';
        if (medida <= 180) return 'yellow';
        return 'red';
    }
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

  const getColor = (medida, tipoSensor) => {
      if (colorScales[tipoSensor]) {
          return colorScales[tipoSensor](medida);
      }
      return 'gray';
  }

  return (
    <>
      {lecturas.map(lectura => (
        <CircleMarker
          key={lectura.id}
          center={[lectura.latitud, lectura.longitud]}
          radius={getRadius(zoomLevel)}
          pathOptions={{
              color: getColor(lectura.medida, lectura.tipoSensor),
              fillColor: getColor(lectura.medida, lectura.tipoSensor),
              fillOpacity: 0.8
          }}
        >
          <Popup>
            {lectura.tipoSensor}: {lectura.medida.toFixed(2)} <br />
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
  const [selectedSensors, setSelectedSensors] = useState(['CO2', 'NO2', 'O3']);
  const gandiaPosition = [38.96667, -0.18333];

  const handleSensorChange = (sensor) => {
    setSelectedSensors(prev =>
        prev.includes(sensor)
            ? prev.filter(s => s !== sensor)
            : [...prev, sensor]
    );
  };

  const filteredLecturas = mockLecturas.filter(l => selectedSensors.includes(l.tipoSensor));

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
    if (mapView === 'points' && selectedSensors.length > 1) {
      alert("solo puede seleccionar una lectura a la vez");
      return;
    }
    setMapView(mapView === 'points' ? 'interpolation' : 'points');
  };

  return (
    <div className="home-page">
      <HeaderRegistrado />

      <main className="home-content">
        {/* Hero */}
        <section className="home-hero">
          <h1 className="home-hero-title">Tu ruta, tu aire, tu impacto.</h1>
          <div>
            <label><input type="checkbox" checked={selectedSensors.includes('CO2')} onChange={() => handleSensorChange('CO2')} /> CO2</label>
            <label><input type="checkbox" checked={selectedSensors.includes('NO2')} onChange={() => handleSensorChange('NO2')} /> NO2</label>
            <label><input type="checkbox" checked={selectedSensors.includes('O3')} onChange={() => handleSensorChange('O3')} /> O3</label>
          </div>
          <button onClick={toggleMapView}>
            {mapView === 'points' ? "Mostrar Mapa de Interpolación" : "Mostrar Lecturas"}
          </button>
          <MapContainer center={gandiaPosition} zoom={13} className="home-main-map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {mapView === 'points' ? (
              <DynamicRadiusCircleMarkers lecturas={filteredLecturas} />
            ) : (
              <InterpolationLayer lecturas={filteredLecturas} colorScale={colorScales[selectedSensors[0]]}/>
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

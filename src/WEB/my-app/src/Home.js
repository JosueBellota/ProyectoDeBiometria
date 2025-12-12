// --------------------------------------------------------------------------
// Fichero: Home.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la página de inicio de la aplicación para usuarios no registrados.
// Muestra el mapa con lecturas del día actual y un radio fijo de 20km.
// --------------------------------------------------------------------------

import React, { useState, useEffect, useMemo } from "react";
import HeaderNoRegistrado from "./templates/HeaderNoRegistrado";
import "./css/main.css";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import InterpolationLayer from "./ciudadano/InterpolationLayer";
import data from './ciudadano/FeaturesFaq.json'; // Ajustar ruta si es necesario
import { obtenerLecturas } from "./logicaFake/logicaFake";

const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;

const colorScales = {
    'calidad': (medida) => {
        if (medida === 1) return 'green'; // Bueno
        if (medida === 2) return 'yellow'; // Aceptable
        return 'red'; // Malo
    },
    'co': (medida) => {
        if (medida < 450) return 'green';
        if (medida <= 1000) return 'yellow';
        return 'red';
    },
    'no2': (medida) => {
        if (medida < 100) return 'green';
        if (medida <= 200) return 'yellow';
        return 'red';
    },
    'o3': (medida) => {
        if (medida < 120) return 'green';
        if (medida <= 180) return 'yellow';
        return 'red';
    }
};

const getSeverityLevel = (tipoSensor, medida) => {
    const scale = colorScales[tipoSensor];
    if (!scale) return 0; // Sin severidad

    const color = scale(medida);
    if (color === 'green') return 1; // Bueno
    if (color === 'yellow') return 2; // Aceptable
    if (color === 'red') return 3; // Malo
    return 0;
};

const units = {
    'co': 'mg/m³',
    'no2': 'µg/m³',
    'o3': 'µg/m³',
    'calidad': ''
};

const DynamicRadiusCircleMarkers = ({ lecturas }) => {
  const [zoomLevel, setZoomLevel] = useState(13);

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

  const getDisplayUnit = (tipoSensor) => {
      return units[tipoSensor] || '';
  }

  const getDisplaySensorName = (tipoSensor) => {
      if (tipoSensor === 'co') return 'CO';
      if (tipoSensor === 'no2') return 'NO2';
      if (tipoSensor === 'o3') return 'O3';
      return tipoSensor.toUpperCase();
  }

  return (
    <>
      {lecturas.map(lectura => (
        <CircleMarker
          key={`${lectura.id}-${lectura.timestamp._seconds}-${lectura.latitud}-${lectura.longitud}`}
          center={[lectura.latitud, lectura.longitud]}
          radius={getRadius(zoomLevel)}
          pathOptions={{
              color: getColor(lectura.valor, lectura.tipo_sensor.toLowerCase()),
              fillColor: getColor(lectura.valor, lectura.tipo_sensor.toLowerCase()),
              fillOpacity: 0.8
          }}
        >
          <Popup>
            {getDisplaySensorName(lectura.tipo_sensor.toLowerCase())}: {lectura.valor.toFixed(2)} {getDisplayUnit(lectura.tipo_sensor.toLowerCase())} <br />
            Tiempo: {new Date(lectura.timestamp._seconds * 1000).toLocaleString()}
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};


const legendData = {
    'calidad': {
        title: 'Calidad del Aire General',
        green: 'Recomendable',
        yellow: 'Aceptable',
        red: 'Peligroso',
    },
    'co': {
        title: 'Monóxido de Carbono (CO)',
        green: 'Recomendable (< 450 mg/m³)',
        yellow: 'Máximo Permitido (450 - 1000 mg/m³)',
        red: 'Peligroso (> 1000 mg/m³)',
    },
    'no2': {
        title: 'Dióxido de Nitrógeno (NO2)',
        green: 'Recomendable (< 100 µg/m³)',
        yellow: 'Máximo Permitido (100 - 200 µg/m³)',
        red: 'Peligroso (> 200 µg/m³)',
    },
    'o3': {
        title: 'Ozono (O3)',
        green: 'Recomendable (< 120 µg/m³)',
        yellow: 'Máximo Permitido (120 - 180 µg/m³)',
        red: 'Peligroso (> 180 µg/m³)',
    }
};

const Legend = ({ sensor }) => {
    const data = legendData[sensor];
    if (!data) return null;

    return (
        <div className="info-legend">
            <h4>{data.title}</h4>
            <p><span style={{backgroundColor: 'rgba(0, 128, 0, 0.3)', width: '20px', height: '20px', display: 'inline-block', marginRight: '10px'}}></span>{data.green}</p>
            <p><span style={{backgroundColor: 'rgba(255, 255, 0, 0.3)', width: '20px', height: '20px', display: 'inline-block', marginRight: '10px'}}></span>{data.yellow}</p>
            <p><span style={{backgroundColor: 'rgba(255, 0, 0, 0.3)', width: '20px', height: '20px', display: 'inline-block', marginRight: '10px'}}></span>{data.red}</p>
        </div>
    );
};


function Home() {
  const [featureIndex, setFeatureIndex] = useState(0);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const [mapView, setMapView] = useState('interpolation');
  const [selectedSensor, setSelectedSensor] = useState('calidad');
  
  const [allLecturas, setAllLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuración fija para usuarios no registrados
  const hoy = new Date();
  const inicioDia = new Date();
  inicioDia.setHours(0,0,0,0);
  const finDia = new Date();
  finDia.setHours(23,59,59,999);
  
  const radioFijo = 20000; // 20 km

  const airQualityPoints = useMemo(() => {
    if (selectedSensor !== 'calidad') return [];

    const pointsByLocation = {};

    allLecturas.forEach(lectura => {
        const key = `${lectura.latitud},${lectura.longitud}`;
        const severity = getSeverityLevel(lectura.tipo_sensor.toLowerCase(), lectura.valor);

        if (severity > (pointsByLocation[key]?.valor || 0)) {
            pointsByLocation[key] = {
                ...lectura,
                valor: severity, 
            };
        }
    });

    return Object.values(pointsByLocation);
  }, [allLecturas, selectedSensor]);

  const cargarLecturas = async () => {
    setLoading(true);
    setError(null);
    const opciones = {
        latitud: gandiaCenterLat,
        longitud: gandiaCenterLng,
        radio: radioFijo,
        fechaInicio: inicioDia,
        fechaFin: finDia,
        tiposensor: selectedSensor === 'calidad' ? '' : selectedSensor, 
    };
    
    try {
        const res = await obtenerLecturas(opciones);
        if (res.error) {
            console.error("❌ Error al obtener lecturas:", res.error);
            setError(res.error);
            setAllLecturas([]); 
        } else {
            setAllLecturas(res);
        }
    } catch (err) {
        console.error("❌ Error inesperado:", err.message);
        setError(err.message);
        setAllLecturas([]); 
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    cargarLecturas();
  }, [selectedSensor]); 

  const handleSensorChange = (event) => {
    setSelectedSensor(event.target.value);
  };

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
  
  const lecturasParaMapa = selectedSensor === 'calidad' ? airQualityPoints : allLecturas;


  return (
    <div className="home-page">
      <HeaderNoRegistrado />

      <main className="home-content">
        {/* Hero */}
        <section className="home-hero">
          <h1 className="home-hero-title">CLOUDMETRIC</h1>
          <p className="home-hero-subtitle">Tu ruta, tu aire, tu impacto.</p>
          
          <div className="mb-3" style={{maxWidth: '300px', margin: '0 auto'}}>
            <select className="form-select" onChange={handleSensorChange} value={selectedSensor}>
                <option value="calidad">Calidad del Aire</option>
                <option value="co">CO</option>
                <option value="no2">NO2</option>
                <option value="o3">O3</option>
            </select>
          </div>
           
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          
          <button onClick={toggleMapView} className="btn btn-outline-secondary mb-2">
            {mapView === 'points' ? "Mostrar Mapa de Interpolación" : "Mostrar Lecturas"}
          </button>
          
          <MapContainer center={[gandiaCenterLat, gandiaCenterLng]} zoom={13} className="home-main-map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {loading ? <p className="text-center mt-5">Cargando datos en tiempo real...</p> : (
                mapView === 'points' ? (
                <DynamicRadiusCircleMarkers lecturas={allLecturas} />
                ) : (
                <InterpolationLayer
                    lecturas={lecturasParaMapa}
                    colorScale={colorScales[selectedSensor]}
                    isAirQualityView={selectedSensor === 'calidad'}
                    sensorName={legendData[selectedSensor]?.title || selectedSensor}
                    unit={units[selectedSensor]}
                />
                )
            )}
             {mapView === 'interpolation' && <Legend sensor={selectedSensor} />}
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
          <p>contacto@mail.com</p>        </section>

        <footer className="home-footer">
          <span>GTI 2025©</span>
        </footer>
      </main>
    </div>
  );
}

export default Home;

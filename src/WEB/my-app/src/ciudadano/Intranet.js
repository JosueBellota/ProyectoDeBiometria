import React, { useState, useEffect } from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import "../css/main.css";
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import InterpolationLayer from "./InterpolationLayer";
import data from './FeaturesFaq.json';
import { obtenerLecturas } from "./../logicaFake/logicaFake";

const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;

const colorScales = {
    'co2': (medida) => {
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
            {lectura.tipo_sensor.toUpperCase()}: {lectura.valor.toFixed(2)} <br />
            Tiempo: {new Date(lectura.timestamp._seconds * 1000).toLocaleString()}
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};


const legendData = {
    'co2': {
        title: 'Dióxido de Carbono (CO2)',
        green: 'Verde: Concentración menor a 450',
        yellow: 'Amarillo: Concentración de 450 a 1000',
        red: 'Rojo: Concentración mayor a 1000',
    },
    'no2': {
        title: 'Dióxido de Nitrógeno (NO2)',
        green: 'Verde: Concentración menor a 100',
        yellow: 'Amarillo: Concentración de 100 a 200',
        red: 'Rojo: Concentración mayor a 200',
    },
    'o3': {
        title: 'Ozono (O3)',
        green: 'Verde: Concentración menor a 120',
        yellow: 'Amarillo: Concentración de 120 a 180',
        red: 'Rojo: Concentración mayor a 180',
    }
};

const Legend = ({ sensor }) => {
    console.log("Sensor for legend: ", sensor);
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


function Intranet() {
  const [featureIndex, setFeatureIndex] = useState(0);
  const [faqAbierta, setFaqAbierta] = useState(null);
  const [mapView, setMapView] = useState('points');
  const [selectedSensor, setSelectedSensor] = useState('');
  const gandiaPosition = [38.96667, -0.18333];
  
  const [allLecturas, setAllLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // New state for error handling

  const hoy = new Date();
  const semanaPasada = new Date();
  semanaPasada.setDate(hoy.getDate() - 7);

  const [fechaInicio, setFechaInicio] = useState(semanaPasada.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);
  const [radio, setRadio] = useState(5000);

  const handleFiltrar = async () => {
    console.log("Botón 'Aplicar filtros' clickeado");
    setLoading(true);
    setError(null); // Clear any previous errors
    const opciones = {
        latitud: gandiaCenterLat,
        longitud: gandiaCenterLng,
        radio: radio,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tiposensor: selectedSensor,
    };
    console.log("Opciones de filtrado:", opciones);
    try {
        const res = await obtenerLecturas(opciones);
        console.log("Respuesta de obtenerLecturas:", res);
        if (res.error) {
            console.error("❌ Error al obtener lecturas en la fase de filtrado:", res.error);
            setError(res.error);
            setAllLecturas([]); 
        } else {
            console.log("Lecturas actualizadas:", res);
            setAllLecturas(res);
        }
    } catch (err) {
        console.error("❌ Error inesperado durante el filtrado de lecturas:", err.message);
        setError(err.message);
        setAllLecturas([]); 
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    // handleFiltrar();
  }, []); // Carga inicial de datos

  const handleSensorChange = (event) => {
    setSelectedSensor(event.target.value);
    setMapView('points');
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

  return (
    <div className="home-page">
      <HeaderRegistrado />

      <main className="home-content">
        {/* Hero */}
        <section className="home-hero">
          <h1 className="home-hero-title">Tu ruta, tu aire, tu impacto.</h1>
          <div>
            <select onChange={handleSensorChange} value={selectedSensor}>
                <option value="">Selecciona un sensor</option>
                <option value="co2">CO2</option>
                <option value="no2">NO2</option>
                <option value="o3">O3</option>
            </select>
          </div>
           <div className="row gx-2 gy-3 align-items-end">
                <div className="col-md-3">
                    <label className="form-label small">Fecha Inicio</label>
                    <input type="date" className="form-control" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                </div>
                <div className="col-md-3">
                    <label className="form-label small">Fecha Fin</label>
                    <input type="date" className="form-control" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                </div>
                <div className="col-md-2">
                    <label className="form-label small">Radio: <strong>{(radio / 1000).toFixed(1)} km</strong></label>
                    <input type="range" className="form-range" min="500" max="50000" step="500" value={radio} onChange={e => setRadio(parseInt(e.target.value, 10))} />
                </div>
            </div>
            <button onClick={handleFiltrar}>Aplicar filtros</button>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          <button onClick={toggleMapView} disabled={!selectedSensor}>
            {mapView === 'points' ? "Mostrar Mapa de Interpolación" : "Mostrar Lecturas"}
          </button>
          <MapContainer center={gandiaPosition} zoom={13} className="home-main-map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {loading ? <p>Cargando...</p> : (
                mapView === 'points' ? (
                <DynamicRadiusCircleMarkers lecturas={allLecturas} />
                ) : (
                <InterpolationLayer lecturas={allLecturas} colorScale={colorScales[selectedSensor]}/>
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

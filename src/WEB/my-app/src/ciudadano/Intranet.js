import React, { useState, useEffect, useMemo } from "react";
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
        green: 'Verde: Recomendable',
        yellow: 'Amarillo: Máximo Permitido',
        red: 'Rojo: Peligroso',
    },
    'co': {
        title: 'Monóxido de Carbono (CO)',
        green: 'Verde: Recomendable (< 450 mg/m³)',
        yellow: 'Amarillo: Máximo Permitido (450 - 1000 mg/m³)',
        red: 'Rojo: Peligroso (> 1000 mg/m³)',
    },
    'no2': {
        title: 'Dióxido de Nitrógeno (NO2)',
        green: 'Verde: Recomendable (< 100 µg/m³)',
        yellow: 'Amarillo: Máximo Permitido (100 - 200 µg/m³)',
        red: 'Rojo: Peligroso (> 200 µg/m³)',
    },
    'o3': {
        title: 'Ozono (O3)',
        green: 'Verde: Recomendable (< 120 µg/m³)',
        yellow: 'Amarillo: Máximo Permitido (120 - 180 µg/m³)',
        red: 'Rojo: Peligroso (> 180 µg/m³)',
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
  const [mapView, setMapView] = useState('interpolation'); 
  const gandiaPosition = [38.96667, -0.18333];
  
  // --- ESTADO CON PERSISTENCIA (LOCALSTORAGE) ---
  const [selectedSensor, setSelectedSensor] = useState(() => localStorage.getItem('selectedSensor') || 'calidad');

  const hoy = new Date();
  const semanaPasada = new Date();
  semanaPasada.setDate(hoy.getDate() - 7);

  const [fechaInicio, setFechaInicio] = useState(() => localStorage.getItem('fechaInicio') || semanaPasada.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(() => localStorage.getItem('fechaFin') || hoy.toISOString().split('T')[0]);
  const [radio, setRadio] = useState(() => {
      const saved = localStorage.getItem('radio');
      return saved ? parseInt(saved, 10) : 5000;
  });

  // Lecturas cacheadas
  const [allLecturas, setAllLecturas] = useState(() => {
      const saved = localStorage.getItem('cachedLecturas');
      if (saved) {
          console.log("✅ Lecturas cargadas desde localStorage.");
          return JSON.parse(saved);
      }
      console.log("❌ No hay lecturas en localStorage, se realizará una consulta inicial a la API.");
      return [];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guardar configuración en localStorage al cambiar
  useEffect(() => {
    localStorage.setItem('fechaInicio', fechaInicio);
    localStorage.setItem('fechaFin', fechaFin);
    localStorage.setItem('radio', radio);
    localStorage.setItem('selectedSensor', selectedSensor);
  }, [fechaInicio, fechaFin, radio, selectedSensor]);


  // --- LÓGICA DE FILTRADO Y MAPA ---

  // Filtramos las lecturas que tenemos en memoria según el sensor seleccionado
  // Esto evita llamar a la API cuando cambiamos de pestaña
  const lecturasFiltradas = useMemo(() => {
      if (selectedSensor === 'calidad') return allLecturas;
      // Filtro en cliente
      return allLecturas.filter(l => l.tipo_sensor.toLowerCase() === selectedSensor.toLowerCase());
  }, [allLecturas, selectedSensor]);

  const airQualityPoints = useMemo(() => {
    if (selectedSensor !== 'calidad') return [];

    const pointsByLocation = {};

    allLecturas.forEach(lectura => {
        const key = `${lectura.latitud},${lectura.longitud}`;
        const severity = getSeverityLevel(lectura.tipo_sensor.toLowerCase(), lectura.valor);

        if (severity > (pointsByLocation[key]?.valor || 0)) {
            pointsByLocation[key] = {
                ...lectura,
                valor: severity, // Aquí 'valor' es el nivel de severidad
            };
        }
    });

    return Object.values(pointsByLocation);
  }, [allLecturas, selectedSensor]);

  const handleFiltrar = async () => {
    console.log("Botón 'Aplicar filtros' clickeado - Realizando consulta a la API.");
    setLoading(true);
    setError(null);
    const opciones = {
        latitud: gandiaCenterLat,
        longitud: gandiaCenterLng,
        radio: radio,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        tiposensor: '' // OPTIMIZACIÓN: Pedimos TODOS los sensores para filtrar localmente
    };
    console.log("Opciones de filtrado (API):", opciones);
    try {
        const res = await obtenerLecturas(opciones);
        console.log("Respuesta API:", res);
        if (res.error) {
            console.error("❌ Error al obtener lecturas:", res.error);
            setError(res.error);
            // No borramos allLecturas si hay error, mantenemos caché vieja o vacía
        } else {
            console.log("Lecturas actualizadas y guardadas en memoria.");
            setAllLecturas(res);
            localStorage.setItem('cachedLecturas', JSON.stringify(res));
        }
    } catch (err) {
        console.error("❌ Error inesperado:", err.message);
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  // Carga inicial: Solo si no hay datos en caché
  useEffect(() => {
      if (allLecturas.length === 0) {
          handleFiltrar();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSensorChange = (event) => {
    setSelectedSensor(event.target.value);
    // YA NO LLAMAMOS A handleFiltrar(). El cambio es instantáneo vía lecturasFiltradas.
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
  
  const lecturasParaMapa = selectedSensor === 'calidad' ? airQualityPoints : lecturasFiltradas;


  return (
    <div className="home-page">
      <HeaderRegistrado />

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
                 <div className="col-md-2 d-flex align-items-end">
                    <button onClick={handleFiltrar} className="btn btn-primary w-100">Aplicar filtros</button>
                </div>
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          <button onClick={toggleMapView} className="btn btn-outline-secondary mb-2">
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
          <div className="mt-3 text-center">
            <button 
                className="btn btn-secondary" 
                onClick={async () => {
                    const confirm = window.confirm("¿Ejecutar script de 20 nodos? Esto añadirá datos de prueba.");
                    if (!confirm) return;

                    console.log("🚀 Iniciando prueba de 20 nodos...");
                    const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
                    const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2";
                    const CENTER_LAT = 39.00500;
                    const CENTER_LNG = -0.16500;
                    const NUM_NODOS = 20;
                    const DISTANCIA_ENTRE_PUNTOS_KM = 0.25;
                    const perimetroTotal = NUM_NODOS * DISTANCIA_ENTRE_PUNTOS_KM;
                    const radiusKm = perimetroTotal / (2 * Math.PI);
                    const DEG_PER_KM = 0.009;
                    const RADIUS_DEG = radiusKm * DEG_PER_KM;

                    for (let i = 1; i <= NUM_NODOS; i++) {
                        const nodoId = `nodo_${i}`;
                        const angle = ((i - 1) / NUM_NODOS) * 2 * Math.PI;
                        const lat = CENTER_LAT + RADIUS_DEG * Math.cos(angle);
                        const lng = CENTER_LNG + RADIUS_DEG * Math.sin(angle);

                        let valorCO2;
                        if (i <= 7) valorCO2 = 1200 + Math.random() * 200;
                        else if (i <= 13) valorCO2 = 600 + Math.random() * 200;
                        else valorCO2 = 1100 + Math.random() * 200;
                        
                        valorCO2 = Math.round(valorCO2);

                        // Crear Nodo
                        try {
                            await fetch(`${BASE_URL}/nodos`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ nombre: nodoId, propietarioId: PROPIETARIO_ID }),
                            });
                        } catch (e) { console.error("Error creando nodo", e); }

                        // Enviar Lectura 1
                        try {
                            await fetch(`${BASE_URL}/lecturas`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    nombreNodo: nodoId,
                                    propietarioId: PROPIETARIO_ID,
                                    lecturas: [{ tipo: 'CO', valor: valorCO2 }],
                                    latitud: lat,
                                    longitud: lng,
                                }),
                            });
                        } catch (e) { console.error("Error enviando lectura 1", e); }

                        // Enviar Lectura 2
                        try {
                            await fetch(`${BASE_URL}/lecturas`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    nombreNodo: nodoId,
                                    propietarioId: PROPIETARIO_ID,
                                    lecturas: [{ tipo: 'CO', valor: valorCO2 + (Math.random() * 20 - 10) }],
                                    latitud: lat + 0.0001,
                                    longitud: lng + 0.0001,
                                }),
                            });
                        } catch (e) { console.error("Error enviando lectura 2", e); }

                        console.log(`Nodo ${nodoId} procesado.`);
                    }
                    alert("✅ Prueba de 20 nodos finalizada. Recargando mapa...");
                    handleFiltrar();
                }}
            >
                🧪 Prueba de Mapas (Añadir 20 Nodos)
            </button>
            <button 
                className="btn btn-danger ms-2" 
                onClick={async () => {
                    const confirm = window.confirm("¿Estás seguro de que quieres eliminar los 20 nodos de prueba y sus lecturas? Esta acción no se puede deshacer.");
                    if (!confirm) return;

                    console.log("🚀 Eliminando 20 nodos de prueba...");
                    const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
                    const NUM_NODOS = 20;

                    for (let i = 1; i <= NUM_NODOS; i++) {
                        const nodoId = `nodo_${i}`;
                        
                        // Eliminar Nodo (enviando nombre y propietario en el body)
                        try {
                            const response = await fetch(`${BASE_URL}/nodos`, {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                    nombreNodo: nodoId, 
                                    propietarioId: "mcJtObhq2iOpCnm6AT6xbFB8zYT2" 
                                }),
                            });
                            
                            if (response.ok) {
                                console.log(`Nodo ${nodoId} eliminado.`);
                            } else {
                                console.error(`Error eliminando nodo ${nodoId}: ${response.statusText}`);
                            }

                        } catch (e) { console.error(`Excepción eliminando nodo ${nodoId}`, e); }
                    }
                    alert("🗑️ Nodos de prueba eliminados. Recargando mapa...");
                    handleFiltrar();
                }}
            >
                🗑️ Eliminar Nodos de Prueba
            </button>
            <button 
                className="btn btn-info ms-2" 
                onClick={async () => {
                    const confirm = window.confirm("¿Crear 20 lecturas en forma de cuadrado (Nodo 0)?");
                    if (!confirm) return;

                    console.log("🚀 Iniciando prueba cuadrado (Nodo 0)...");
                    const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
                    const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2";
                    const NODO_ID = "nodo0";
                    
                    // Coordenadas Gandía Playa
                    const START_LAT = 39.006;
                    const START_LNG = -0.165;
                    const STEP = 0.001; // ~100 metros

                    // Crear Nodo 0
                    try {
                        await fetch(`${BASE_URL}/nodos`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ nombre: NODO_ID, propietarioId: PROPIETARIO_ID }),
                        });
                    } catch (e) { console.error("Error creando nodo 0", e); }

                    // 5x4 Grid = 20 puntos
                    let count = 0;
                    for (let latIdx = 0; latIdx < 5; latIdx++) {
                        for (let lngIdx = 0; lngIdx < 4; lngIdx++) {
                            const lat = START_LAT + (latIdx * STEP);
                            const lng = START_LNG + (lngIdx * STEP);
                            
                            // Valor aleatorio
                            const valorCO = 300 + Math.random() * 500; 

                            try {
                                await fetch(`${BASE_URL}/lecturas`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        nombreNodo: NODO_ID,
                                        propietarioId: PROPIETARIO_ID,
                                        lecturas: [{ tipo: 'CO', valor: valorCO }],
                                        latitud: lat,
                                        longitud: lng,
                                    }),
                                });
                                count++;
                                console.log(`Lectura ${count}/20 enviada para ${NODO_ID}`);
                            } catch (e) { console.error("Error enviando lectura", e); }
                        }
                    }
                    alert("✅ Prueba Cuadrado (20 lecturas) finalizada. Recargando mapa...");
                    handleFiltrar();
                }}
            >
                🟦 Prueba Cuadrado (Nodo 0)
            </button>
            <button 
                className="btn btn-warning ms-2" 
                onClick={async () => {
                    const confirm = window.confirm("¿Eliminar Nodo 0 y sus lecturas?");
                    if (!confirm) return;

                    console.log("🚀 Eliminando Nodo 0...");
                    const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
                    const NODO_ID = "nodo0";
                    const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2";

                    try {
                        const response = await fetch(`${BASE_URL}/nodos`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                                nombreNodo: NODO_ID, 
                                propietarioId: PROPIETARIO_ID 
                            }),
                        });
                        
                        if (response.ok) {
                            console.log(`Nodo ${NODO_ID} eliminado.`);
                            alert(`🗑️ Nodo ${NODO_ID} eliminado correctamente.`);
                        } else {
                            console.error(`Error eliminando nodo ${NODO_ID}: ${response.statusText}`);
                            alert(`❌ Error al eliminar Nodo ${NODO_ID}.`);
                        }

                    } catch (e) { 
                        console.error(`Excepción eliminando nodo ${NODO_ID}`, e);
                        alert(`❌ Excepción al eliminar Nodo ${NODO_ID}.`);
                    }
                    handleFiltrar();
                }}
            >
                🗑️ Eliminar Nodo 0
            </button>
          </div>
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

export default Intranet;

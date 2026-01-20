import React, { useState, useEffect, useMemo } from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import "../css/main.css";
import { MapContainer, TileLayer, Popup, useMapEvents, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import InterpolationLayer from "./InterpolationLayer";
import AirQualityExposure from "./AirQualityExposure";
import data from './FeaturesFaq.json';
import { obtenerLecturas } from "./../logicaFake/logicaFake";
import { renderToStaticMarkup } from 'react-dom/server';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SensorsIcon from '@mui/icons-material/Sensors';

const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;

const officialStations = [
    {
        id: 'estacion-gandia',
        nombre: 'Estación Gandía - Parc Alquería Nova',
        lat: 38.968129,
        lng: -0.193242,
        url: 'http://www.agroambient.gva.es/es/web/calidad-ambiental/datos-on-line'
    }
];

const officialStationIcon = L.divIcon({
    html: renderToStaticMarkup(
        <div style={{ 
            backgroundColor: 'white', 
            width: '40px', 
            height: '40px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px solid white', // Borde blanco igual que el fondo
            boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
            zIndex: 1000
        }}>
            <AccountBalanceIcon style={{ 
                color: '#007bff', 
                fontSize: '24px'
            }} />
        </div>
    ),
    className: '', 
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const StationPopup = ({ station }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simular petición a API oficial
        const timer = setTimeout(() => {
            setData({
                so2: (Math.random() * 4 + 1).toFixed(1),      // 1-5
                no2: (Math.random() * 15 + 5).toFixed(1),     // 5-20
                o3: (Math.random() * 30 + 35).toFixed(1),     // 35-65
                co: (Math.random() * 0.3 + 0.1).toFixed(2),   // 0.1-0.4
                pm10: (Math.random() * 15 + 10).toFixed(1),   // 10-25
                pm25: (Math.random() * 8 + 3).toFixed(1),     // 3-11
                calidad: 'Buena',
                lastUpdate: new Date().toLocaleTimeString()
            });
            setLoading(false);
        }, 800); // Pequeño delay para realismo
        return () => clearTimeout(timer);
    }, []);

    if (loading) return <div style={{textAlign: 'center', padding: '10px'}}>🔄 Cargando datos oficiales...</div>;

    return (
        <div style={{minWidth: '200px'}}>
             <h5 style={{margin: '0 0 5px 0', fontSize: '1rem'}}>{station.nombre}</h5>
             <div style={{fontSize: '0.8rem', color: '#666', marginBottom: '8px'}}>Generalitat Valenciana • Red RVVCCA</div>
             
             <table className="table table-sm table-borderless" style={{fontSize: '0.9rem', marginBottom: '5px'}}>
                <tbody>
                    <tr>
                        <td style={{padding: '2px'}}><strong>SO₂</strong></td>
                        <td style={{padding: '2px', textAlign: 'right'}}>{data.so2} µg/m³</td>
                    </tr>
                    <tr>
                        <td style={{padding: '2px'}}><strong>NO₂</strong></td>
                        <td style={{padding: '2px', textAlign: 'right'}}>{data.no2} µg/m³</td>
                    </tr>
                    <tr>
                        <td style={{padding: '2px'}}><strong>O₃</strong></td>
                        <td style={{padding: '2px', textAlign: 'right'}}>{data.o3} µg/m³</td>
                    </tr>
                    <tr>
                        <td style={{padding: '2px'}}><strong>CO</strong></td>
                        <td style={{padding: '2px', textAlign: 'right'}}>{data.co} mg/m³</td>
                    </tr>
                    <tr>
                        <td style={{padding: '2px'}}><strong>PM10</strong></td>
                        <td style={{padding: '2px', textAlign: 'right'}}>{data.pm10} µg/m³</td>
                    </tr>
                    <tr>
                        <td style={{padding: '2px'}}><strong>PM2.5</strong></td>
                        <td style={{padding: '2px', textAlign: 'right'}}>{data.pm25} µg/m³</td>
                    </tr>
                </tbody>
             </table>
             
             <div style={{
                 backgroundColor: '#d1e7dd', 
                 color: '#0f5132', 
                 padding: '5px', 
                 borderRadius: '4px', 
                 textAlign: 'center',
                 fontWeight: 'bold',
                 marginBottom: '5px',
                 fontSize: '0.9rem'
             }}>
                 ICA: {data.calidad}
             </div>

             <div style={{fontSize: '0.75rem', color: '#999', textAlign: 'right', marginBottom: '5px'}}>
                 Actualizado: {data.lastUpdate}
             </div>

             <a href={station.url} target="_blank" rel="noopener noreferrer" style={{fontSize: '0.85rem', display: 'block', textAlign: 'center'}}>
                 Ver histórico web oficial ↗
             </a>
        </div>
    );
};

const colorScales = {
    'calidad': (medida) => {
        if (medida === 1) return 'green'; // Bueno
        if (medida === 2) return 'yellow'; // Aceptable
        return 'red'; // Malo
    },
    'co': (medida) => {
        if (medida <= 7) return 'green';
        if (medida <= 10) return 'yellow';
        return 'red';
    },
    'no2': (medida) => {
        if (medida <= 90) return 'green';
        if (medida <= 120) return 'yellow';
        return 'red';
    },
    'o3': (medida) => {
        if (medida <= 100) return 'green';
        if (medida <= 130) return 'yellow';
        return 'red';
    }
};

const sensorLimits = {
    'co': { low: 0, med: 7, high: 10 },
    'no2': { low: 0, med: 90, high: 120 },
    'o3': { low: 0, med: 100, high: 130 },
    'calidad': { low: 1, med: 2, high: 3 }
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


const DynamicSensorIcons = ({ lecturas }) => {
  const [zoomLevel, setZoomLevel] = useState(13);

  useMapEvents({
    zoomend: (e) => {
      setZoomLevel(e.target.getZoom());
    },
  });

  const getSize = (zoom) => {
    // Aumentamos ligeramente el tamaño base para que el contenedor se vea bien
    if (zoom < 12) return 20; 
    if (zoom < 14) return 25;
    if (zoom < 16) return 30;
    return 40;
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
      {lecturas.map((lectura, index) => {
        const size = getSize(zoomLevel);
        const bgColor = getColor(lectura.valor, lectura.tipo_sensor.toLowerCase());
        
        // Creamos un contenedor circular con el color de fondo
        const iconHtml = renderToStaticMarkup(
            <div style={{ 
                backgroundColor: bgColor, 
                width: size + 'px', 
                height: size + 'px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.8)', // Borde blanco suave para resaltar
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)' // Sombra para dar profundidad
            }}>
                <SensorsIcon style={{ 
                    color: 'white', 
                    fontSize: (size * 0.7) + 'px' // El icono es un 70% del contenedor
                }} />
            </div>
        );

        const icon = L.divIcon({
            html: iconHtml,
            className: '', // Sin clase extra
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });

        return (
            <Marker
            key={`${lectura.id || 'no_id'}-${index}`}
            position={[lectura.latitud, lectura.longitud]}
            icon={icon}
            >
            <Popup>
                {getDisplaySensorName(lectura.tipo_sensor.toLowerCase())}: {lectura.valor.toFixed(2)} {getDisplayUnit(lectura.tipo_sensor.toLowerCase())} <br />
                Tiempo: {new Date(lectura.timestamp._seconds * 1000).toLocaleString()}
            </Popup>
            </Marker>
        );
      })}
    </>
  );
};


const legendData = {
    'calidad': {
        title: 'Calidad del Aire General',
        green: 'Buena / Razonable',
        yellow: 'Regular',
        red: 'Desfavorable / Mala',
    },
    'co': {
        title: 'Monóxido de Carbono (CO)',
        green: 'Buena (≤ 7 mg/m³)',
        yellow: 'Regular (7 - 10 mg/m³)',
        red: 'Mala (> 10 mg/m³)',
    },
    'no2': {
        title: 'Dióxido de Nitrógeno (NO2)',
        green: 'Buena (≤ 90 µg/m³)',
        yellow: 'Regular (90 - 120 µg/m³)',
        red: 'Mala (> 120 µg/m³)',
    },
    'o3': {
        title: 'Ozono (O3)',
        green: 'Buena (≤ 100 µg/m³)',
        yellow: 'Regular (100 - 130 µg/m³)',
        red: 'Mala (> 130 µg/m³)',
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

  const [fechaInicio, setFechaInicio] = useState(semanaPasada.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);
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
    
    let inicio = new Date(fechaInicio);
    let fin = new Date(fechaFin);
    
    // Asegurar horas
    inicio.setHours(0,0,0,0);
    fin.setHours(23,59,59,999);

    const opciones = {
        latitud: gandiaCenterLat,
        longitud: gandiaCenterLng,
        radio: radio,
        fechaInicio: inicio,
        fechaFin: fin,
        tiposensor: '' 
    };
    
    console.log("Opciones de filtrado (API):", opciones);
    
    try {
        let res = await obtenerLecturas(opciones);
        
        // Lógica de "Smart Fallback" si no hay resultados en la búsqueda inicial
        // y estamos usando el rango por defecto (o similar, para no molestar al usuario si filtró explícitamente y dio 0)
        // Pero para simplificar, lo haremos si el resultado es vacío, intentamos buscar hacia atrás para proponer datos.
        if (!res.error && res.length === 0) {
             console.log("⚠️ No se encontraron lecturas en el rango seleccionado.");
             
             // Solo intentamos autocompletar si la fecha fin es HOY (comportamiento por defecto)
             const hoy = new Date();
             const esHoy = fin.getDate() === hoy.getDate() && fin.getMonth() === hoy.getMonth() && fin.getFullYear() === hoy.getFullYear();

             if (esHoy) {
                 console.log("🔄 Buscando historial reciente (últimos 30 días) para sugerir datos...");
                 const hace30Dias = new Date(fin);
                 hace30Dias.setDate(hace30Dias.getDate() - 30);
                 
                 const opcionesHistorial = {
                     ...opciones,
                     fechaInicio: hace30Dias,
                     fechaFin: fin
                 };
                 
                 const resHistorial = await obtenerLecturas(opcionesHistorial);
                 
                 if (!resHistorial.error && resHistorial.length > 0) {
                     // Encontrar la fecha más reciente con datos
                     const lecturasOrdenadas = resHistorial.sort((a, b) => b.timestamp._seconds - a.timestamp._seconds);
                     const ultimaLectura = lecturasOrdenadas[0];
                     const ultimaFecha = new Date(ultimaLectura.timestamp._seconds * 1000);
                     
                     console.log("✅ Datos encontrados recientes el:", ultimaFecha.toLocaleDateString());
                     
                     // Actualizar fechaInicio para reflejar el rango que tiene datos
                     // Rango: [Última lectura] -> [Hoy]
                     // Ajustamos el string para el input date
                     const nuevaFechaInicio = ultimaFecha.toISOString().split('T')[0];
                     
                     // Solo actualizamos si es diferente para evitar loops raros (aunque el user manda)
                     if (nuevaFechaInicio !== fechaInicio) {
                         setFechaInicio(nuevaFechaInicio);
                         // El usuario verá que la fecha cambia y aparecen los datos
                         // Filtramos el resultado para que coincida con el nuevo rango "teórico" de 30 días o mostramos todo lo encontrado
                         // Lo correcto es mostrar lo que hemos encontrado en el rango ampliado
                         // Pero como hemos cambiado fechaInicio, el rango visual ahora será 'nuevaFechaInicio' a 'fechaFin'
                         // Así que filtramos resHistorial para que cumpla >= nuevaFechaInicio
                         
                         const inicioNuevo = new Date(nuevaFechaInicio); inicioNuevo.setHours(0,0,0,0);
                         res = resHistorial.filter(l => {
                             const t = new Date(l.timestamp._seconds * 1000);
                             return t >= inicioNuevo;
                         });
                     }
                 }
             }
        }

        console.log("Respuesta API final:", res);
        
        if (res.error) {
            console.error("❌ Error al obtener lecturas:", res.error);
            setError(res.error);
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

  const handleSensorChange = (s) => {
    setSelectedSensor(s);
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
          <h1 className="home-hero-title">Mapa de Contaminantes</h1>
          <p className="home-hero-subtitle">Tu ruta, tu aire, tu impacto.</p>
          
          {/* NUEVA BARRA DE FILTROS HORIZONTAL */}
          <div className="filter-bar">
              {/* Grupo Sensor - Ahora como Desplegable para optimizar espacio */}
              <div className="filter-group">
                  <span className="filter-label">Filtrar por:</span>
                  <select 
                    className="form-select form-select-sm" 
                    style={{ width: 'auto', fontWeight: '600', borderRadius: '8px' }}
                    value={selectedSensor}
                    onChange={(e) => handleSensorChange(e.target.value)}
                  >
                      <option value="calidad">Calidad General</option>
                      <option value="co">CO (Monóxido)</option>
                      <option value="no2">NO2 (Nitrógeno)</option>
                      <option value="o3">O3 (Ozono)</option>
                  </select>
              </div>

              {/* Grupo Fechas */}
              <div className="filter-group">
                  <input 
                    type="date" 
                    className="compact-date" 
                    value={fechaInicio} 
                    onChange={e => setFechaInicio(e.target.value)} 
                    title="Fecha Inicio"
                  />
                  <span style={{color: '#999'}}>—</span>
                  <input 
                    type="date" 
                    className="compact-date" 
                    value={fechaFin} 
                    onChange={e => setFechaFin(e.target.value)} 
                    title="Fecha Fin"
                  />
              </div>

              {/* Grupo Radio */}
              <div className="radius-control">
                  <span className="radius-label">Radio: {(radio / 1000).toFixed(1)} km</span>
                  <input 
                    type="range" 
                    className="compact-range" 
                    min="500" 
                    max="50000" 
                    step="500" 
                    value={radio} 
                    onChange={e => setRadio(parseInt(e.target.value, 10))} 
                  />
              </div>

              {/* Botones Acción */}
              <div className="action-group">
                   <button onClick={toggleMapView} className="btn-compact btn-toggle" title="Cambiar Vista Mapa">
                       {mapView === 'points' ? "🗺️ Mapa" : "📍 Puntos"}
                   </button>
                   <button onClick={handleFiltrar} className="btn-compact btn-apply">
                       Aplicar
                   </button>
              </div>
          </div>
          
            {error && <div className="alert alert-danger mt-3">{error}</div>}

          <MapContainer center={gandiaPosition} zoom={13} className="home-main-map">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {loading ? <p>Cargando...</p> : (
                mapView === 'points' ? (
                <DynamicSensorIcons lecturas={lecturasFiltradas} />
                ) : (
                <InterpolationLayer 
                    lecturas={lecturasParaMapa} 
                    colorScale={colorScales[selectedSensor]} 
                    isAirQualityView={selectedSensor === 'calidad'} 
                    sensorName={legendData[selectedSensor]?.title || selectedSensor}
                    unit={units[selectedSensor]}
                    limits={sensorLimits[selectedSensor]}
                />
                )
            )}
             {mapView === 'interpolation' && <Legend sensor={selectedSensor} />}
             
             {/* Estaciones Oficiales */}
             {officialStations.map(station => (
                 <Marker 
                    key={station.id} 
                    position={[station.lat, station.lng]} 
                    icon={officialStationIcon}
                    zIndexOffset={1000} // Prioridad visual alta
                 >
                     <Popup>
                         <StationPopup station={station} />
                     </Popup>
                 </Marker>
             ))}

          </MapContainer>

          <AirQualityExposure startDate={fechaInicio} endDate={fechaFin} readings={allLecturas} />

          <div className="mt-3 text-center">
             {/* Botones de pruebas eliminados para ciudadanos */}
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
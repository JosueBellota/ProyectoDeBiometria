// src/WEB/my-app/src/ciudadano/Intranet.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "./../logicaFake/auth";
import { obtenerNodosPorPropietario, obtenerLecturas } from "./../logicaFake/logicaFake";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import ReadingsTable from "./ReadingsTable";
import "./css/lecturas.css";

// Ubicación fija para la búsqueda general
const GANDIA_LOCATION = { lat: 38.96667, lon: -0.18333 };

// Componente para ver SÓLO las lecturas de los nodos del usuario
function MyReadingsView({ usuario }) {
    const [misLecturas, setMisLecturas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [nodeIdToNameMap, setNodeIdToNameMap] = useState(new Map());

    // Mismos filtros de fecha que en la búsqueda general
    const hoy = new Date();
    const semanaPasada = new Date();
    semanaPasada.setDate(hoy.getDate() - 7);

    const [fechaInicio, setFechaInicio] = useState(semanaPasada.toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);

    const cargarMisLecturas = async () => {
        if (!usuario) return;
        setCargando(true);
        setError(null);
        try {
            // 1. Obtener mis nodos
            const nodos = await obtenerNodosPorPropietario(usuario.uid);
            if (nodos.error) throw new Error(nodos.error);
            if (!nodos.length) {
                setMisLecturas([]);
                return;
            }

            // Crear mapa de ID -> Nombre
            const map = new Map(nodos.map(n => [n.id, n.nombre]));
            setNodeIdToNameMap(map);

            // 2. Para cada nodo, obtener sus lecturas históricas
            const promesasLecturas = nodos.map(async (nodo) => {
                const opciones = {
                    nombreNodo: nodo.nombre,
                    propietarioId: usuario.uid,
                    fechaInicio: new Date(fechaInicio),
                    fechaFin: new Date(fechaFin)
                };
                const lecturasNodo = await obtenerLecturas(opciones);
                return lecturasNodo.error ? [] : lecturasNodo;
            });

            const resultadosArray = await Promise.all(promesasLecturas);
            // Aplanar el array de arrays en uno solo
            const todasLasLecturas = resultadosArray.flat();
            
            // Ordenar por fecha descendente
            todasLasLecturas.sort((a, b) => {
                const timeA = a.timestamp?._seconds || 0;
                const timeB = b.timestamp?._seconds || 0;
                return timeB - timeA;
            });

            setMisLecturas(todasLasLecturas);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="mt-5">
             <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">MIS NODOS (Historial)</h5>
            </div>
            <div className="card p-3 bg-light">
                <div className="row g-3 align-items-end">
                    <div className="col-md-3">
                        <label className="form-label small">Fecha Inicio</label>
                        <input type="date" className="form-control" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label small">Fecha Fin</label>
                        <input type="date" className="form-control" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                         <button className="btn btn-success w-100" onClick={cargarMisLecturas} disabled={cargando}>
                            {cargando ? 'Cargando...' : 'Ver Historial de Mis Nodos'}
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            
            {!cargando && !error && misLecturas.length > 0 && (
                <div className="readings-container mt-3">
                    <ReadingsTable lecturas={misLecturas} showNodeColumn={true} nodeIdToNameMap={nodeIdToNameMap} />
                </div>
            )}
            
            {!cargando && !error && misLecturas.length === 0 && (
                <p className="text-muted mt-3">No hay lecturas para mostrar en este rango de fechas.</p>
            )}
        </div>
    );
}

// Componente para la vista de búsqueda general
function GeneralSearchView({ misNodos }) {
    const [resultados, setResultados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const hoy = new Date();
    const semanaPasada = new Date();
    semanaPasada.setDate(hoy.getDate() - 7);

    const [fechaInicio, setFechaInicio] = useState(semanaPasada.toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);
    const [radio, setRadio] = useState(5000);
    const [tiposensor, setTipoSensor] = useState('all'); // Estado para el filtro de sensor

    const nodeIdToNameMap = useMemo(() => {
        if (!misNodos) return new Map();
        return new Map(misNodos.map(nodo => [nodo.id_nodo, nodo.nombre]));
    }, [misNodos]);

    const buscarLecturas = async () => {
        setCargando(true);
        setError(null);
        try {
            const opciones = {
                latitud: GANDIA_LOCATION.lat,
                longitud: GANDIA_LOCATION.lon,
                radio: radio,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                tiposensor: tiposensor, // Pasar el tipo de sensor
            };
            const res = await obtenerLecturas(opciones);
            if (res.error) throw new Error(res.error);
            setResultados(res);
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };
    
    return (
        <div>
            <div>
                <h5 className="mb-0">LECTURAS DE SENSORES</h5>
            </div>
            <div>
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
                        <label className="form-label small">Tipo de Sensor</label>
                        <select className="form-select" value={tiposensor} onChange={e => setTipoSensor(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="co">CO</option>
                            <option value="no2">NO2</option>
                            <option value="o3">O3</option>
                        </select>
                    </div>
                    <div className="col-md-2">
                        <label className="form-label small">Radio: <strong>{(radio / 1000).toFixed(1)} km</strong></label>
                        <input type="range" className="form-range" min="500" max="50000" step="500" value={radio} onChange={e => setRadio(parseInt(e.target.value, 10))} />
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-primary w-100" onClick={buscarLecturas} disabled={cargando}>
                            {cargando ? '...' : 'Buscar'}
                        </button>
                    </div>
                </div>
                <hr/>
                {cargando && <p>Buscando...</p>}
                {error && <div className="alert alert-danger mt-3">{error}</div>}
                {!cargando && !error && (
                    <div className="readings-container">
                        <ReadingsTable lecturas={resultados} showNodeColumn={true} nodeIdToNameMap={nodeIdToNameMap} />
                    </div>
                )}
            </div>
        </div>
    );
}


function Lecturas() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [misNodos, setMisNodos] = useState([]);
    
    useEffect(() => {
        const user = obtenerUsuarioLogueado();
        if (!user) {
            navigate("/");
            return;
        }
        setUsuario(user);

        const cargarMisNodos = async () => {
            try {
                // NOTA: obtenerNodosPorPropietario devuelve los nodos del backend
                const nodos = await obtenerNodosPorPropietario(user.uid);
                if (nodos.error) throw new Error(nodos.error);
                setMisNodos(nodos);
            } catch (err) {
                console.error(err.message);
            }
        };

        cargarMisNodos();
    }, [navigate]);

    return (
        <>
            <HeaderRegistrado />
            <div className="home-page">
                <main className="container py-4">
                    <div className="row">
                        <div className="col-lg-12">
                            <GeneralSearchView misNodos={misNodos} />
                            <hr className="my-5" />
                            <MyReadingsView usuario={usuario} />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default Lecturas;
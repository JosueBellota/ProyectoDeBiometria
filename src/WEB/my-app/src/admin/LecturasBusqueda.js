// src/WEB/my-app/src/admin/LecturasBusqueda.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import { obtenerNodosAdmin, obtenerLecturas } from "../logicaFake/logicaFake";
import Menu from "./templates/Menu";
import ReadingsTable from "../ciudadano/ReadingsTable";
import "../ciudadano/css/lecturas.css"; // Reuse Citizen styles for consistency

// Ubicación fija para la búsqueda general (Centro Gandía)
const GANDIA_LOCATION = { lat: 38.96667, lon: -0.18333 };

// Componente para la vista de búsqueda general (Admin version)
function GeneralSearchView({ todosNodos }) {
    const [resultados, setResultados] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const hoy = new Date();
    const semanaPasada = new Date();
    semanaPasada.setDate(hoy.getDate() - 7);

    const [fechaInicio, setFechaInicio] = useState(semanaPasada.toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);
    const [radio, setRadio] = useState(5000);
    const [tiposensor, setTipoSensor] = useState('all');

    const nodeIdToNameMap = useMemo(() => {
        if (!todosNodos) return new Map();
        // El admin recibe una estructura diferente en obtenerNodosAdmin? 
        // Verificamos si es (id_nodo, nombre) o similar.
        // obtenerNodosAdmin devuelve [{ nodoId, nodoNombre, ... }] a veces adaptado.
        // Asumiremos que 'todosNodos' ya viene mapeado correctamente o es la lista raw.
        // En NodosAdmin.js se mapeaba r.nodoId y r.nodoNombre.
        return new Map(todosNodos.map(n => [n.nodoId || n.id_nodo || n.id, n.nodoNombre || n.nombre || 'Desconocido']));
    }, [todosNodos]);

    const buscarLecturas = async () => {
        setCargando(true);
        setError(null);
        
        let inicio = new Date(fechaInicio);
        let fin = new Date(fechaFin);
        // Asegurar horas
        inicio.setHours(0,0,0,0);
        fin.setHours(23,59,59,999);

        try {
            const opciones = {
                latitud: GANDIA_LOCATION.lat,
                longitud: GANDIA_LOCATION.lon,
                radio: radio,
                fechaInicio: inicio,
                fechaFin: fin,
                tiposensor: tiposensor, 
            };
            let res = await obtenerLecturas(opciones);
            if (res.error) throw new Error(res.error);
            
            // --- LOGICA SMART FALLBACK ---
            if (res.length === 0) {
                 const hoy = new Date();
                 // Si la fecha fin es hoy, intentamos buscar hacia atrás
                 const esHoy = fin.getDate() === hoy.getDate() && fin.getMonth() === hoy.getMonth() && fin.getFullYear() === hoy.getFullYear();
                 
                 if (esHoy) {
                     console.log("🔄 Buscando historial reciente (Admin)...");
                     const hace30Dias = new Date(fin);
                     hace30Dias.setDate(hace30Dias.getDate() - 30);
                     
                     const opcionesHistorial = {
                         ...opciones,
                         fechaInicio: hace30Dias,
                         fechaFin: fin
                     };
                     
                     const resHistorial = await obtenerLecturas(opcionesHistorial);
                     
                     if (!resHistorial.error && resHistorial.length > 0) {
                         // Encontrar la fecha más reciente
                         const lecturasOrdenadas = resHistorial.sort((a, b) => b.timestamp._seconds - a.timestamp._seconds);
                         const ultimaLectura = lecturasOrdenadas[0];
                         const ultimaFecha = new Date(ultimaLectura.timestamp._seconds * 1000);
                         
                         const nuevaFechaInicio = ultimaFecha.toISOString().split('T')[0];
                         
                         if (nuevaFechaInicio !== fechaInicio) {
                             setFechaInicio(nuevaFechaInicio);
                             
                             const inicioNuevo = new Date(nuevaFechaInicio); inicioNuevo.setHours(0,0,0,0);
                             res = resHistorial.filter(l => {
                                 const t = new Date(l.timestamp._seconds * 1000);
                                 return t >= inicioNuevo;
                             });
                         }
                     }
                 }
            }

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


function LecturasBusqueda() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [todosNodos, setTodosNodos] = useState([]);
    
    useEffect(() => {
        const user = obtenerUsuarioLogueado();
        if (!user) {
            navigate("/");
            return;
        }
        if (user.rol !== 'admin') {
            navigate("/");
            return;
        }
        setUsuario(user);

        const cargarNodosAdmin = async () => {
            try {
                // Obtenemos TODOS los nodos del sistema para mapear nombres en la tabla
                const nodos = await obtenerNodosAdmin();
                if (nodos.error) throw new Error(nodos.error);
                setTodosNodos(nodos);
            } catch (err) {
                console.error(err.message);
            }
        };

        cargarNodosAdmin();
    }, [navigate]);

    return (
        <>
            <div className="home-page">
                <Menu />
                <main className="container py-4">
                    <h1 className="home-hero-title">HISTORIAL DE LECTURAS</h1>
                    <div className="row">
                        <div className="col-lg-12">
                            <GeneralSearchView todosNodos={todosNodos} />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default LecturasBusqueda;

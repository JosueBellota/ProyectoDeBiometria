// src/WEB/my-app/src/ciudadano/Intranet.js
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "./../logicaFake/auth";
import { obtenerNodosPorPropietario, obtenerLecturas } from "./../logicaFake/logicaFake";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import ReadingsTable from "./ReadingsTable";
import "./css/ciudadano.css";

// Ubicación fija para la búsqueda general
const GANDIA_LOCATION = { lat: 38.96667, lon: -0.18333 };

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
                    <div className="col-md-4">
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
                    <div className="readings-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <ReadingsTable lecturas={resultados} showNodeColumn={true} nodeIdToNameMap={nodeIdToNameMap} />
                    </div>
                )}
            </div>
        </div>
    );
}


function Intranet() {
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
            <div className="home-page" style={{ /* Estilos de fondo */ }}>
                <main className="container py-4">
                    <div className="row">
                        <div className="col-lg-12">
                            <GeneralSearchView misNodos={misNodos} />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default Intranet;

// src/WEB/my-app/src/ciudadano/NodoSearchView.js
import React, { useState, useEffect, useCallback } from 'react';
import { obtenerLecturas } from './../logicaFake/logicaFake';
import ReadingsTable from './ReadingsTable';
import './css/ciudadano.css';

function NodoSearchView({ nodo }) {
  const [lecturas, setLecturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const hoy = new Date();
  const semanaPasada = new Date();
  semanaPasada.setDate(hoy.getDate() - 7);

  const [fechaInicio, setFechaInicio] = useState(semanaPasada.toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(hoy.toISOString().split('T')[0]);

  const cargarLecturas = useCallback(async () => {
    if (!nodo.id_nodo) return;

    setCargando(true);
    setError(null);
    try {
      const res = await obtenerLecturas({ 
          id_nodo: nodo.id_nodo, 
          fechaInicio: new Date(fechaInicio), 
          fechaFin: new Date(fechaFin)
      });
      if (res.error) throw new Error(res.error);
      setLecturas(res);
    } catch (err) {
      setError(err.message);
      setLecturas([]);
    } finally {
      setCargando(false);
    }
  }, [nodo.id_nodo, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarLecturas();
  }, [cargarLecturas]);

  return (
    <div>
        <h5>Lecturas para el nodo: {nodo.nombre || nodo.id_nodo}</h5>
        {nodo.latitud && 
            <small className="text-muted">
                Lat: {nodo.latitud.toFixed(4)}, Lon: {nodo.longitud.toFixed(4)}
            </small>
        }
      <div>
        <div className="row mb-3 gx-2 align-items-end">
          <div className="col-sm-4">
            <label htmlFor={`fechaInicio-${nodo.id_nodo}`} className="form-label small">Fecha Inicio</label>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              id={`fechaInicio-${nodo.id_nodo}`} 
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="col-sm-4">
            <label htmlFor={`fechaFin-${nodo.id_nodo}`} className="form-label small">Fecha Fin</label>
            <input 
              type="date" 
              className="form-control form-control-sm" 
              id={`fechaFin-${nodo.id_nodo}`}
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
            />
          </div>
          <div className="col-sm-4">
            <button 
              className="btn btn-primary btn-sm w-100" 
              onClick={cargarLecturas} 
              disabled={cargando}
            >
              {cargando ? 'Cargando...' : 'Filtrar'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">Error: {error}</div>}
        
        {!cargando && !error && (
            <div className="readings-container" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <ReadingsTable lecturas={lecturas} />
            </div>
        )}
      </div>
    </div>
  );
}

export default NodoSearchView;

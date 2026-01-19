import React, { useState, useEffect, useCallback } from "react";
import Menu from "./templates/Menu";
import { obtenerIncidencias, asignarIncidencia, resolverIncidencia, obtenerTodosLosUsuarios } from "../logicaFake/logicaFake";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import "./css/incidenciasAdmin.css";

// Componente para el modal de resolución
const ResolveModal = ({ incidencia, onClose, onResolve, adminId }) => {
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (!respuesta.trim()) {
      alert("Por favor, introduce una respuesta.");
      return;
    }
    setEnviando(true);
    await onResolve(incidencia.id, adminId, respuesta);
    setEnviando(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Resolver Incidencia: "{incidencia.titulo}"</h3>
        <textarea
          className="modal-textarea"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          placeholder="Escribe la solución o respuesta para el usuario..."
          disabled={enviando}
        />
        <div className="modal-actions">
          <button onClick={onClose} className="action-btn btn-cancel" disabled={enviando}>Cancelar</button>
          <button onClick={handleSubmit} className="action-btn btn-submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Marcar como Resuelta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function IncidenciasAdmin() {
  const [admin, setAdmin] = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("todas");
  const [modalInfo, setModalInfo] = useState({ visible: false, incidencia: null });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [incidenciasRes, usuariosRes] = await Promise.all([
        obtenerIncidencias(),
        obtenerTodosLosUsuarios()
      ]);

      if (incidenciasRes.error) throw new Error(incidenciasRes.error);
      if (usuariosRes.error) throw new Error(usuariosRes.error);
      
      const uMap = new Map();
      usuariosRes.forEach(u => uMap.set(u.id, u));

      setIncidencias(incidenciasRes);
      setUsuariosMap(uMap);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = obtenerUsuarioLogueado();
    setAdmin(user);
    cargarDatos();
  }, [cargarDatos]);

  const handleAssign = async (incidenciaId) => {
    if (!admin) return;
    await asignarIncidencia(incidenciaId, admin.uid);
    cargarDatos();
  };

  const handleResolve = async (incidenciaId, adminId, respuesta) => {
    await resolverIncidencia(incidenciaId, adminId, respuesta);
    cargarDatos();
  };

  const filteredIncidencias = incidencias.filter(inc => {
    if (filter === "todas") return true;
    return inc.estado === filter;
  });

  const getEstadoBadge = (estado) => {
    const classMap = {
      pendiente: "status-pendiente",
      en_proceso: "status-en_proceso",
      resuelta: "status-resuelta",
    };
    return <span className={`status-badge ${classMap[estado] || ""}`}>{estado.replace("_", " ")}</span>;
  };
  
  const formatDate = (fecha) => {
    if (!fecha) return "N/A";
    if (typeof fecha === "string" || typeof fecha === "number") {
      return new Date(fecha).toLocaleString();
    }
    if (fecha.seconds) {
      return new Date(fecha.seconds * 1000).toLocaleString();
    }
    if (fecha._seconds) { // A menudo, Firebase serializa a este formato
      return new Date(fecha._seconds * 1000).toLocaleString();
    }
    return "Fecha inválida";
  };

  const renderFiltros = () => (
    <div className="incidencias-filters">
        {["todas", "pendiente", "en_proceso", "resuelta"].map(f => (
            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
            </button>
        ))}
    </div>
  );

  return (
    <div className="home-page">
      <Menu />
      <main className="incidencias-admin-container">
        <h1 className="home-hero-title">GESTIÓN DE INCIDENCIAS</h1>

        {renderFiltros()}

        {loading && <p>Cargando incidencias...</p>}
        {error && <div className="alert error">{error}</div>}

        {!loading && !error && (
          <>
            {/* Vista de Tabla para Desktop */}
            <div className="incidencias-table-container">
              <table className="incidencias-table">
                <thead>
                  <tr>
                    <th>Asunto</th>
                    <th>Usuario</th>
                    <th>Fechas (Reporte/Resolución)</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidencias.map(inc => (
                    <tr key={inc.id}>
                      <td>{inc.titulo}</td>
                      <td>{usuariosMap.get(inc.usuarioId)?.nombre || "Desconocido"}</td>
                      <td>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span><strong>Reporte:</strong> {formatDate(inc.fecha)}</span>
                            {inc.estado === 'resuelta' && inc.fechaResolucion && (
                                <span><strong>Resuelta:</strong> {formatDate(inc.fechaResolucion)}</span>
                            )}
                        </div>
                      </td>
                      <td>{getEstadoBadge(inc.estado)}</td>
                      <td>
                        {inc.estado === 'pendiente' && (
                          <button onClick={() => handleAssign(inc.id)} className="action-btn btn-assign">
                            Asignarme
                          </button>
                        )}
                        {inc.estado === 'en_proceso' && inc.adminId === admin?.uid && (
                           <button onClick={() => setModalInfo({ visible: true, incidencia: inc })} className="action-btn btn-resolve">
                             Resolver
                           </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista de Tarjetas para Móvil */}
            {filteredIncidencias.map(inc => (
                <div key={inc.id} className={`mobile-card status-border-${inc.estado.replace("_", "-")}`}>
                    <div className="card-header">
                        <h5 className="card-title">{inc.titulo}</h5>
                        {getEstadoBadge(inc.estado)}
                    </div>
                    <div className="card-body">
                        <p className="card-desc"><strong>Reportado por:</strong> {usuariosMap.get(inc.usuarioId)?.nombre || "Desconocido"}</p>
                        <p className="card-desc"><strong>Reporte:</strong> {formatDate(inc.fecha)}</p>
                        {inc.estado === 'resuelta' && inc.fechaResolucion && (
                             <p className="card-desc"><strong>Resuelta:</strong> {formatDate(inc.fechaResolucion)}</p>
                        )}
                    </div>
                    <div className="card-footer">
                        {inc.estado === 'pendiente' && (
                            <button onClick={() => handleAssign(inc.id)} className="action-btn btn-assign">
                                Asignarme
                            </button>
                        )}
                        {inc.estado === 'en_proceso' && inc.adminId === admin?.uid && (
                           <button onClick={() => setModalInfo({ visible: true, incidencia: inc })} className="action-btn btn-resolve">
                             Resolver
                           </button>
                        )}
                    </div>
                </div>
            ))}
          </>
        )}
      </main>

      {modalInfo.visible && (
        <ResolveModal
          incidencia={modalInfo.incidencia}
          onClose={() => setModalInfo({ visible: false, incidencia: null })}
          onResolve={handleResolve}
          adminId={admin.uid}
        />
      )}
    </div>
  );
}

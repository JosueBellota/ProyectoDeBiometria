import React, { useState, useEffect } from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import { reportarIncidencia, obtenerIncidencias, obtenerUsuarioCompleto } from "../logicaFake/logicaFake";
import "../css/main.css"; // Reutilizamos estilos generales
import "./css/incidencias.css";

export default function Incidencias() {
  const [usuario, setUsuario] = useState(null);
  const [incidencias, setIncidencias] = useState([]);
  const [admins, setAdmins] = useState({}); // Para cachear nombres de admins
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeForm, setMensajeForm] = useState(null);

  useEffect(() => {
    const user = obtenerUsuarioLogueado();
    if (user) {
      setUsuario(user);
      cargarIncidencias(user.uid);
    }
  }, []);

  const cargarIncidencias = async (uid) => {
    setLoading(true);
    const res = await obtenerIncidencias({ usuarioId: uid });
    if (res.error) {
      setError(res.error);
    } else {
      setIncidencias(res);
      // Cargar los nombres de los admins para las incidencias resueltas
      const adminIds = [...new Set(res.filter(i => i.estado === 'resuelta' && i.adminId).map(i => i.adminId))];
      const adminPromises = adminIds.map(id => obtenerUsuarioCompleto(id));
      const adminResults = await Promise.all(adminPromises);
      
      const newAdmins = {};
      adminResults.forEach((admin, index) => {
        if (!admin.error) {
          newAdmins[adminIds[index]] = admin;
        }
      });
      setAdmins(prevAdmins => ({...prevAdmins, ...newAdmins}));
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) {
      setMensajeForm({ tipo: "error", texto: "Por favor, completa todos los campos." });
      return;
    }

    setEnviando(true);
    setMensajeForm(null);

    const res = await reportarIncidencia(usuario.uid, titulo, descripcion);

    if (res.error) {
      setMensajeForm({ tipo: "error", texto: res.error });
    } else {
      setMensajeForm({ tipo: "exito", texto: "Incidencia reportada correctamente." });
      setTitulo("");
      setDescripcion("");
      cargarIncidencias(usuario.uid); // Recargar lista
    }
    setEnviando(false);
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "pendiente":
        return <span className="incidencias-badge warning">Pendiente</span>;
      case "en_proceso":
        return <span className="incidencias-badge info">En Proceso</span>;
      case "resuelta":
        return <span className="incidencias-badge success">Resuelta</span>;
      default:
        return <span className="incidencias-badge secondary">{estado}</span>;
    }
  };

  const formatDate = (fecha) => {
    if (!fecha) return "Fecha desconocida";
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

  return (
    <div className="home-page">
      <HeaderRegistrado />
      
      <main className="incidencias-container">
        <h1 className="incidencias-title">Gestión de Incidencias</h1>

        <div className="incidencias-row">
          {/* Columna Izquierda: Formulario de Reporte */}
          <div className="incidencias-form-col">
            <div className="incidencias-card">
              <div className="incidencias-card-header">
                <h5>Reportar Nueva Incidencia</h5>
              </div>
              <div className="incidencias-card-body">
                <form onSubmit={handleSubmit}>
                  <div className="incidencias-form-group">
                    <label htmlFor="titulo" className="incidencias-label">Asunto</label>
                    <input 
                      type="text" 
                      className="incidencias-input" 
                      id="titulo" 
                      value={titulo} 
                      onChange={(e) => setTitulo(e.target.value)} 
                      placeholder="Ej: Farola fundida" 
                      disabled={enviando}
                    />
                  </div>
                  <div className="incidencias-form-group">
                    <label htmlFor="descripcion" className="incidencias-label">Descripción</label>
                    <textarea 
                      className="incidencias-input" 
                      id="descripcion" 
                      rows="4" 
                      value={descripcion} 
                      onChange={(e) => setDescripcion(e.target.value)} 
                      placeholder="Describe detalladamente el problema..."
                      disabled={enviando}
                    ></textarea>
                  </div>
                  
                  {mensajeForm && (
                    <div className={`incidencias-alert ${mensajeForm.tipo === 'error' ? 'error' : 'success'}`} role="alert">
                      {mensajeForm.texto}
                    </div>
                  )}

                  <button type="submit" className="incidencias-btn" disabled={enviando}>
                    {enviando ? "Enviando..." : "Enviar Reporte"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Lista de Incidencias */}
          <div className="incidencias-list-col">
            <div className="incidencias-card">
              <div className="incidencias-card-header secondary">
                <h5>Mis Incidencias</h5>
              </div>
              <div className="incidencias-card-body p-0">
                {loading ? (
                  <div className="text-center p-4">Cargando incidencias...</div>
                ) : error ? (
                  <div className="incidencias-alert error m-3">{error}</div>
                ) : incidencias.length === 0 ? (
                  <div className="text-center p-4 text-muted">No has reportado ninguna incidencia aún.</div>
                ) : (
                  <div className="incidencias-list">
                    {incidencias.map((incidencia) => (
                      <div key={incidencia.id} className="incidencias-list-item">
                        <div className="incidencias-item-header">
                          <h6 className="incidencias-item-title">{incidencia.titulo}</h6>
                          <div style={{textAlign: 'right'}}>
                            <small className="incidencias-item-date">
                                <strong>Reportado:</strong> {formatDate(incidencia.fecha)}
                            </small>
                            {incidencia.estado === 'resuelta' && incidencia.fechaResolucion && (
                                <small className="incidencias-item-date" style={{display: 'block'}}>
                                    <strong>Resuelta:</strong> {formatDate(incidencia.fechaResolucion)}
                                </small>
                            )}
                          </div>
                        </div>
                        <p className="incidencias-item-desc">{incidencia.descripcion}</p>
                        <div className="incidencias-item-footer">
                          {getEstadoBadge(incidencia.estado)}
                          {incidencia.respuesta && (
                            <div className="incidencias-respuesta">
                              <span><strong>Respuesta del admin:</strong> {incidencia.respuesta}</span>
                              {incidencia.estado === 'resuelta' && incidencia.adminId && admins[incidencia.adminId] && (
                                <span style={{display: 'block', marginTop: '5px'}}>
                                  <strong>Resuelto por:</strong> {admins[incidencia.adminId].nombre}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --------------------------------------------------------------------------
// Fichero: nodos.js
// Responsable: Willyrex
//
// Descripción:
// Panel de admin para ver nodos:
// - activo24h: si tiene lecturas en las últimas 24h
// - medicionesCorrectas: si NO todas las lecturas de las últimas 4h son erróneas
// --------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./templates/Menu";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import { obtenerNodosAdmin, obtenerLecturas } from "../logicaFake/logicaFake";

const MS_24H = 24 * 60 * 60 * 1000;
const MS_4H = 4 * 60 * 60 * 1000;

// ======================================================================
// Helpers de fecha
// ======================================================================

function toDateSafe(ts) {
  if (!ts) return null;

  if (typeof ts === "object" && typeof ts.toDate === "function") {
    const d = ts.toDate();
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof ts === "object" && (ts.seconds || ts._seconds)) {
    const s = ts.seconds ?? ts._seconds;
    const d = new Date(s * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof ts === "number") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof ts === "string") {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function isActiveByLastReading(ts) {
  const d = toDateSafe(ts);
  if (!d) return false;
  return Date.now() - d.getTime() <= MS_24H;
}

function fmt(v) {
  const d = toDateSafe(v);
  return d ? d.toLocaleString() : "Sin fecha";
}

// ======================================================================
// Calidad de mediciones
// ======================================================================

function normalizeSensorName(v) {
  return String(v || "").trim().toLowerCase();
}

function getSensorName(l) {
  return normalizeSensorName(l?.tipo_sensor ?? l?.sensor ?? l?.tipo);
}

function getSensorValue(l) {
  return Number(l?.valor ?? l?.value ?? l?.v);
}

function isReadingErronea(lectura) {
  const sensor = getSensorName(lectura);
  const v = getSensorValue(lectura);

  if (!Number.isFinite(v)) return true;
  if (v < 0) return true;

  // Regla CO (tu proyecto)
  if (sensor === "co") {
    return v > 200; // >200 ppm = erróneo
  }

  return false;
}

function getReadingTimeMs(l) {
  const d = toDateSafe(l?.timestamp ?? l?.tiempo ?? l?.time);
  return d ? d.getTime() : null;
}

/**
 * Regla FINAL:
 * - Si hay lecturas en las últimas 4h
 * - y TODAS son erróneas
 * => mediciones incorrectas
 */
function evaluarCalidadUltimas4h(lecturas) {
  if (!Array.isArray(lecturas) || lecturas.length === 0) {
    return { medicionesCorrectas: true, motivo: "Sin lecturas en 4h" };
  }

  const validas = lecturas
    .map(l => ({ l, t: getReadingTimeMs(l) }))
    .filter(x => x.t !== null);

  if (validas.length === 0) {
    return { medicionesCorrectas: true, motivo: "Lecturas sin timestamp" };
  }

  const todasErroneas = validas.every(x => isReadingErronea(x.l));

  if (todasErroneas) {
    return { medicionesCorrectas: false, motivo: "Erróneas en últimas 4h" };
  }

  return { medicionesCorrectas: true, motivo: "OK" };
}

// ======================================================================
// Componente
// ======================================================================

export default function NodosAdmin() {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  // Auth
  useEffect(() => {
    const user = obtenerUsuarioLogueado();
    if (!user) return navigate("/");
    if (user.rol !== "admin") {
      alert("Acceso solo para administradores");
      navigate("/");
    }
  }, [navigate]);

  // Carga datos
  useEffect(() => {
    let cancel = false;

    const cargar = async () => {
      setCargando(true);
      setError("");

      try {
        const nodos = await obtenerNodosAdmin();

        const base = (Array.isArray(nodos) ? nodos : []).map(r => {
          const last =
            r.lastReadingAt ??
            r.ultimaLectura ??
            r.timestampUltimaLectura ??
            r.tiempo ??
            null;

          return {
            uid: r.uid ?? r.propietarioId ?? "",
            nombreUsuario: r.nombreUsuario ?? r.nombre ?? "(Sin nombre)",
            correoUsuario: r.correoUsuario ?? r.correo ?? "(Sin correo)",
            nodoId: r.nodoId ?? r.id_nodo ?? r.id ?? "",
            nodoNombre: r.nodoNombre ?? r.nombreNodo ?? "(Sin nombre)",
            creadoEn: r.creadoEn ?? r.createdAt ?? null,
            lastReadingAt: last,
            activo24h: isActiveByLastReading(last),
            medicionesCorrectas: true,
            motivoCalidad: "Cargando…",
          };
        });

        const ahora = Date.now();
        const fechaInicio = new Date(ahora - MS_4H);
        const fechaFin = new Date(ahora);

        const enriched = await Promise.all(
          base.map(async row => {
            try {
              const lect = await obtenerLecturas({
                nombreNodo: row.nodoNombre,
                propietarioId: row.uid,
                fechaInicio,
                fechaFin,
              });

              const calidad = evaluarCalidadUltimas4h(lect || []);

              return {
                ...row,
                medicionesCorrectas: calidad.medicionesCorrectas,
                motivoCalidad: calidad.motivo,
              };
            } catch {
              return { ...row, motivoCalidad: "Error leyendo lecturas" };
            }
          })
        );

        if (!cancel) setRows(enriched);
      } catch (e) {
        if (!cancel) setError("Error cargando nodos");
      } finally {
        if (!cancel) setCargando(false);
      }
    };

    cargar();
    return () => (cancel = true);
  }, []);

  const totalUsuarios = useMemo(
    () => new Set(rows.map(r => r.uid).filter(Boolean)).size,
    [rows]
  );

  const activos24h = rows.filter(r => r.activo24h).length;
  const medidasMal = rows.filter(r => !r.medicionesCorrectas).length;

  return (
    <div className="container">
      <Menu />
      <h1>📡 Panel de Administración - Nodos</h1>

      {cargando ? (
        <p>Cargando nodos…</p>
      ) : error ? (
        <span className="error">❌ {error}</span>
      ) : (
        <>
          <p>
            Usuarios: <b>{totalUsuarios}</b> · Nodos: <b>{rows.length}</b> ·
            Activos (24h): <b>{activos24h}</b> ·
            Medidas mal (4h): <b>{medidasMal}</b>
          </p>

          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Nombre nodo</th>
                <th>ID nodo</th>
                <th>Activo (24h)</th>
                <th>Última lectura</th>
                <th>Creado</th>
                <th>Mediciones correctas</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.nodoId || i}>
                  <td>{i + 1}</td>
                  <td>{r.nombreUsuario}</td>
                  <td>{r.correoUsuario}</td>
                  <td>{r.nodoNombre}</td>
                  <td style={{ fontFamily: "monospace" }}>{r.nodoId}</td>
                  <td>{r.activo24h ? "🟢 Activo" : "⚪ Inactivo"}</td>
                  <td>{fmt(r.lastReadingAt)}</td>
                  <td>{fmt(r.creadoEn)}</td>
                  <td>{r.medicionesCorrectas ? "✅ Correctas" : "⚠️ Erróneas"}</td>
                  <td>{r.motivoCalidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

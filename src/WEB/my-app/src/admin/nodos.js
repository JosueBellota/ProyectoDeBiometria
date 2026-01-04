// --------------------------------------------------------------------------
// Fichero: nodos.js
// Responsable: Willyrex
//
// Descripción:
// Pantalla de admin para ver los nodos de cada usuario y si están activos
// (activo = tiene lecturas en las últimas 24 horas).
// --------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "./templates/Menu";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import { obtenerNodosAdmin } from "../logicaFake/logicaFake";

const MS_24H = 24 * 60 * 60 * 1000;

function toDateSafe(ts) {
  if (!ts) return null;

  // 1) Firestore Timestamp real
  if (typeof ts === "object" && typeof ts.toDate === "function") {
    const d = ts.toDate();
    return isNaN(d.getTime()) ? null : d;
  }

  // 2) Timestamp serializado: {seconds} / {_seconds}
  if (typeof ts === "object" && (ts.seconds || ts._seconds)) {
    const s = ts.seconds ?? ts._seconds;
    const d = new Date(s * 1000);
    return isNaN(d.getTime()) ? null : d;
  }

  // 3) number (ms)
  if (typeof ts === "number") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }

  // 4) string ISO o parseable por JS
  if (typeof ts === "string") {
    // intento normal
    let d = new Date(ts);
    if (!isNaN(d.getTime())) return d;

    // 5) string tipo "4/1/2026, 18:07:39" o "04/01/2026, 18:07:39"
    // interpretamos como D/M/YYYY
    const m = ts.match(
      /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?\s*$/
    );
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1; // 0-11
      const year = parseInt(m[3], 10);
      const hour = m[4] ? parseInt(m[4], 10) : 0;
      const min = m[5] ? parseInt(m[5], 10) : 0;
      const sec = m[6] ? parseInt(m[6], 10) : 0;

      d = new Date(year, month, day, hour, min, sec);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  // 6) fallback
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}


function isActiveByLastReading(lastReadingTimestamp) {
  const d = toDateSafe(lastReadingTimestamp);
  if (!d) return false;
  const diff = Math.abs(Date.now() - d.getTime());
  return diff <= MS_24H;
}


export default function NodosAdmin() {
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  // ✅ Verificar si el usuario está logueado y es admin
  useEffect(() => {
    const user = obtenerUsuarioLogueado();

    if (!user) {
      navigate("/");
      return;
    }

    if (user.rol !== "admin") {
      alert("⚠️ Acceso denegado. Solo los administradores pueden ingresar.");
      navigate("/");
      return;
    }
  }, [navigate]);

  // ✅ Cargar nodos desde el ServidorREST (NO Firestore directo)
  useEffect(() => {
    let cancel = false;

    const cargar = async () => {
      setCargando(true);
      setError("");

      try {
        const data = await obtenerNodosAdmin();

        const normalizado = (Array.isArray(data) ? data : []).map((r) => {
  const last =
    r.lastReadingAt ??
    r.ultimaLectura ??
    r.timestampUltimaLectura ??
    r.tiempo ??
    null;

  // ✅ SIEMPRE recalcular en frontend
  const activo = isActiveByLastReading(last);

  return {
    uid: r.uid ?? r.propietarioId ?? r.usuarioId ?? "",
    nombreUsuario: r.nombreUsuario ?? r.nombre ?? "(Sin nombre)",
    correoUsuario: r.correoUsuario ?? r.correo ?? "(Sin correo)",
    nodoId: r.nodoId ?? r.id_nodo ?? r.idNodo ?? r.id ?? "",
    nodoNombre:
      r.nodoNombre ??
      r.nombreNodo ??
      r.nombre_nodo ??
      r.nombre ??
      "(Sin nombre)",
    encendido: !!r.encendido,
    creadoEn: r.creadoEn ?? r.createdAt ?? null,
    lastReadingAt: last,
    activo24h: activo,
  };
});


        // Orden por usuario y nodo
        normalizado.sort((a, b) => {
          const ua = (a.nombreUsuario || "").toLowerCase();
          const ub = (b.nombreUsuario || "").toLowerCase();
          if (ua !== ub) return ua.localeCompare(ub);
          return (a.nodoNombre || "").toLowerCase().localeCompare((b.nodoNombre || "").toLowerCase());
        });

        if (!cancel) setRows(normalizado);
      } catch (e) {
        console.error(e);
        if (!cancel) setError(e?.message || "Error desconocido");
      } finally {
        if (!cancel) setCargando(false);
      }
    };

    cargar();

    return () => {
      cancel = true;
    };
  }, []);

  const totalUsuarios = useMemo(() => {
    const s = new Set(rows.map((r) => r.uid).filter(Boolean));
    return s.size;
  }, [rows]);

  const totalNodos = rows.length;
  const activos = rows.filter((r) => r.activo24h).length;

  const fmt = (v) => {
    const d = toDateSafe(v);
    return d ? d.toLocaleString() : "Sin fecha";
  };

  return (
    <div className="container">
      <Menu />
      <h1>📡 Panel de Administración - Nodos</h1>

      {cargando ? (
        <p>Cargando nodos...</p>
      ) : error ? (
        <span className="error">❌ {error}</span>
      ) : (
        <>
          <p style={{ marginTop: 8 }}>
            Usuarios: <b>{totalUsuarios}</b> · Nodos: <b>{totalNodos}</b> · Activos (24h): <b>{activos}</b>
          </p>

          {rows.length === 0 ? (
            <p>No hay nodos registrados.</p>
          ) : (
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Nombre nodo</th>
                  <th>ID nodo</th>
                  <th>Encendido</th>
                  <th>Activo (24h)</th>
                  <th>Última lectura</th>
                  <th>Creado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.nodoId || i}>
                    <td data-label="#">{i + 1}</td>
                    <td data-label="Usuario">{r.nombreUsuario}</td>
                    <td data-label="Correo">{r.correoUsuario}</td>
                    <td data-label="Nombre nodo">{r.nodoNombre}</td>
                    <td data-label="ID nodo" style={{ fontFamily: "monospace" }}>
                      {r.nodoId}
                    </td>
                    <td data-label="Encendido">{r.encendido ? "✅ Sí" : "❌ No"}</td>
                    <td data-label="Activo (24h)">{r.activo24h ? "🟢 Activo" : "⚪ Inactivo"}</td>
                    <td data-label="Última lectura">{fmt(r.lastReadingAt)}</td>
                    <td data-label="Creado">{fmt(r.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

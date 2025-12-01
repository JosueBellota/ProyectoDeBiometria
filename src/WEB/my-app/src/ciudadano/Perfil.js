// --------------------------------------------------------------------------
// Fichero: Perfil.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene el perfil del ciudadano.
// --------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerUsuarioLogueado,
  actualizarUsuario,
  reautenticarUsuario,
  actualizarPasswordConReautenticacion,
} from "../logicaFake/auth";
import { obtenerUsuarioCompleto } from "../logicaFake/logicaFake";
import { formatTime } from "../logicaFake/monedas";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import { useMonedas } from "../logicaFake/MonedasContext";

// --- Estilos CSS en línea para simplicidad ---
const styles = {
  pageContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  card: {
    flex: 1,
    minWidth: "350px",
    background: "var(--color-surface)",
    padding: "24px",
    borderRadius: "var(--radius-card)",
    border: "1px solid var(--color-border)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  inputGroup: { marginBottom: "16px" },
  label: { marginBottom: "4px", display: "block" },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid var(--color-border)",
    borderRadius: "6px",
    boxSizing: "border-box",
  },
  button: {
    padding: "12px 16px",
    backgroundColor: "var(--color-primary)",
    color: "white",
    border: "none",
    borderRadius: "var(--radius-button)",
    cursor: "pointer",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  timerContainer: {
    textAlign: "center",
  },
  timerText: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "var(--color-primary)",
    margin: "16px 0",
  },
  infoText: {
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#666",
  },
};
// --- Fin de Estilos ---

function Perfil() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    nuevaContraseña: "",
    repetirContraseña: "",
  });
  const [usuario, setUsuario] = useState(null);

  // --- Estados y lógica de monedas desde el Context ---
  const {
    tiempoActivo,
    puedeReclamar,
    tiempoRestanteCooldown,
    reclamarMoneda,
    TIEMPO_REQUERIDO_ACTIVIDAD,
  } = useMonedas();

  // --- Carga inicial del usuario ---
  const cargarUsuario = useCallback(async () => {
    const user = obtenerUsuarioLogueado();
    if (!user) {
      navigate("/login");
      return;
    }
    const datosCompletos = await obtenerUsuarioCompleto(user.uid);
    if (!datosCompletos.error) {
      setUsuario(datosCompletos);
      setPerfil((prev) => ({
        ...prev,
        nombre: datosCompletos.nombre,
        correo: datosCompletos.correo,
      }));
    }
  }, [navigate]);

  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPerfil({ ...perfil, [name]: value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!perfil.contraseña) {
      return alert(
        "Debes introducir tu contraseña actual para realizar cambios."
      );
    }
    if (
      perfil.nuevaContraseña &&
      perfil.nuevaContraseña !== perfil.repetirContraseña
    ) {
      return alert("Las nuevas contraseñas no coinciden.");
    }

    try {
      await reautenticarUsuario(perfil.contraseña);
      if (perfil.nuevaContraseña) {
        await actualizarPasswordConReautenticacion(
          perfil.contraseña,
          perfil.nuevaContraseña
        );
      }
      if (
        usuario &&
        (perfil.nombre !== usuario.nombre || perfil.correo !== usuario.correo)
      ) {
        await actualizarUsuario(usuario.uid, {
          nombre: perfil.nombre,
          correo: perfil.correo,
        });
      }
      alert("✅ Perfil actualizado correctamente.");
      cargarUsuario();
      navigate("/ciudadano/intranet");
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  return (
    <>
      <HeaderRegistrado />
      <div style={styles.pageContainer}>
        {/* --- Card de Perfil --- */}
        <div style={styles.card}>
          <h2>Perfil de Usuario</h2>
          <form onSubmit={handleProfileSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={perfil.nombre}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Correo:</label>
              <input
                type="email"
                name="correo"
                value={perfil.correo}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Contraseña Actual (obligatoria):
              </label>
              <input
                type="password"
                name="contraseña"
                value={perfil.contraseña}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nueva Contraseña:</label>
              <input
                type="password"
                name="nuevaContraseña"
                value={perfil.nuevaContraseña}
                onChange={handleChange}
                placeholder="Dejar en blanco para no cambiar"
                style={styles.input}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Repetir Nueva Contraseña:</label>
              <input
                type="password"
                name="repetirContraseña"
                value={perfil.repetirContraseña}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            <hr />

            <button type="submit" style={styles.button}>
              Actualizar Perfil
            </button>
          </form>
        </div>

        {/* --- Card de Monedas --- */}
        <div style={styles.card}>
          <h2>Gana Monedas</h2>
          <div style={styles.timerContainer}>
            {puedeReclamar ? (
              <>
                <h3>Tiempo de Actividad</h3>
                <p style={styles.timerText}>
                  {formatTime(tiempoActivo, false)} /{" "}
                  {formatTime(TIEMPO_REQUERIDO_ACTIVIDAD, false)}
                </p>
                <p style={styles.infoText}>
                  Mantente activo en la página para ganar una moneda.
                </p>
                <button
                  onClick={reclamarMoneda}
                  style={
                    tiempoActivo >= TIEMPO_REQUERIDO_ACTIVIDAD
                      ? styles.button
                      : { ...styles.button, ...styles.disabledButton }
                  }
                  disabled={tiempoActivo < TIEMPO_REQUERIDO_ACTIVIDAD}
                >
                  Reclamar 1 Moneda
                </button>
              </>
            ) : (
              <>
                <h3>Próxima Recompensa</h3>
                <p style={styles.timerText}>
                  {formatTime(tiempoRestanteCooldown)}
                </p>
                <p style={styles.infoText}>
                  Ya ganaste tu moneda diaria.
                </p>
                <button
                  style={{ ...styles.button, ...styles.disabledButton }}
                  disabled
                >
                  Esperando...
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Perfil;

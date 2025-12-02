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
import "./css/perfil.css";

const validarPassword = (password) => {
  const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regexPassword.test(password);
};

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
  const [mensaje, setMensaje] = useState("");


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
    setMensaje(""); // Limpiar mensajes previos

    if (!perfil.contraseña) {
      setMensaje("Debes introducir tu contraseña actual para realizar cambios.");
      return;
    }
    if (
      perfil.nuevaContraseña &&
      perfil.nuevaContraseña !== perfil.repetirContraseña
    ) {
      setMensaje("Las nuevas contraseñas no coinciden.");
      return;
    }

    if (perfil.nuevaContraseña && !validarPassword(perfil.nuevaContraseña)) {
      setMensaje(
        "La nueva contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número."
      );
      return;
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
      setMensaje("✅ Perfil actualizado correctamente.");
      cargarUsuario(); // Recargar datos
    } catch (error) {
      setMensaje(`❌ Error: ${error.message}`);
    }
  };

  return (
    <>
      <HeaderRegistrado />
      <div className="page-container">
        {/* --- Card de Perfil --- */}
        <div className="card">
          <h2>Perfil de Usuario</h2>
          {mensaje && (
            <div
              className={`mensaje ${
                mensaje.startsWith("✅") ? "exito" : "error"
              }`}
            >
              {mensaje}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="form">
            <div className="input-group">
              <label className="label">Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={perfil.nombre}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div className="input-group">
              <label className="label">Correo:</label>
              <input
                type="email"
                name="correo"
                value={perfil.correo}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div className="input-group">
              <label className="label">
                Contraseña Actual (obligatoria):
              </label>
              <input
                type="password"
                name="contraseña"
                value={perfil.contraseña}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div className="input-group">
              <label className="label">Nueva Contraseña:</label>
              <input
                type="password"
                name="nuevaContraseña"
                value={perfil.nuevaContraseña}
                onChange={handleChange}
                placeholder="Dejar en blanco para no cambiar"
                className="input"
              />
            </div>
            <div className="input-group">
              <label className="label">Repetir Nueva Contraseña:</label>
              <input
                type="password"
                name="repetirContraseña"
                value={perfil.repetirContraseña}
                onChange={handleChange}
                className="input"
              />
            </div>
            <hr />

            <button type="submit" className="button">
              Actualizar Perfil
            </button>
          </form>
        </div>

        {/* --- Card de Monedas --- */}
        <div className="card">
          <h2>Gana Monedas</h2>
          <div className="timer-container">
            {puedeReclamar ? (
              <>
                <p className="timer-text">
                  {formatTime(tiempoActivo, false)} /{" "}
                  {formatTime(TIEMPO_REQUERIDO_ACTIVIDAD, false)}
                </p>
                <p className="info-text">
                </p>
                <button
                  onClick={reclamarMoneda}
                  className={
                    tiempoActivo >= TIEMPO_REQUERIDO_ACTIVIDAD
                      ? "button"
                      : "button disabled-button"
                  }
                  disabled={tiempoActivo < TIEMPO_REQUERIDO_ACTIVIDAD}
                >
                  Reclamar 1 Moneda
                </button>
              </>
            ) : (
              <>
                <h3>Próxima Recompensa</h3>
                <p className="timer-text">
                  {formatTime(tiempoRestanteCooldown)}
                </p>
                <p className="info-text">
                  Ya ganaste tu moneda diaria.
                </p>
                <button
                  className="button disabled-button"
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

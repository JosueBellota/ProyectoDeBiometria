// --------------------------------------------------------------------------
// Fichero: Registro.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la página de registro de la aplicación.
// --------------------------------------------------------------------------

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarCiudadano } from "./logicaFake/auth";
import HeaderNoRegistrado from "./templates/HeaderNoRegistrado";

function Registro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [aceptaCondiciones, setAceptaCondiciones] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  const validarCorreo = (correo) => {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(correo);
  };

  const validarPassword = (password) => {
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regexPassword.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!aceptaCondiciones) {
      setError("Debes aceptar los términos y condiciones para registrarte.");
      return;
    }

    if (!validarCorreo(correo)) {
      setError("El correo no tiene un formato válido.");
      return;
    }

    if (!validarPassword(password)) {
      setError(
        "La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número."
      );
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const resultado = await registrarCiudadano(nombre, correo, password);

    if (resultado) {
      setExito("Registro completado. Se ha enviado un correo de verificación.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } else {
      setError("El correo ya está registrado o hubo un error en el registro.");
    }
  };

  return (
    <>
      <HeaderNoRegistrado />

      {/* Fondo completo igual que Login */}
      <div
        className="container"
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
          minHeight: "100vh",
          backgroundImage: "url(/Fondo.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "40px 16px",
          boxSizing: "border-box",
        }}
      >
        {/* Tarjeta central */}
        <div
          style={{
            maxWidth: "540px",
            margin: "0 auto",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "40px 80px",
            borderRadius: "20px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.18)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img src="/logo.svg" alt="Logo" style={{ height: "60px" }} />
          </div>
          <h1 style={{ textAlign: "center", marginBottom: "8px" }}>
            Registro de Ciudadano
          </h1>

          {exito && (
            <p
              style={{
                color: "green",
                marginTop: "4px",
                marginBottom: "12px",
                fontSize: "0.9rem",
              }}
            >
              {exito}
            </p>
          )}

          <p
            style={{
              textAlign: "center",
              marginBottom: "20px",
              fontSize: "0.95rem",
              color: "#555",
            }}
          >
            Crea tu cuenta para participar en el proyecto y registrar tus
            mediciones de calidad del aire.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                Correo
              </label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "4px",
                  fontWeight: "500",
                }}
              >
                Repetir contraseña
              </label>
              <input
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            
            <div style={{ marginBottom: "20px", display: "flex", alignItems: "center" }}>
              <input 
                type="checkbox" 
                id="condiciones"
                checked={aceptaCondiciones}
                onChange={(e) => setAceptaCondiciones(e.target.checked)}
                style={{ margin: "0 10px 0 0" }}
              />
              <label htmlFor="condiciones" style={{ fontSize: "0.9rem", color: "#555" }}>
                He leído y acepto los <Link to="/condiciones" target="_blank" rel="noopener noreferrer">Términos y Condiciones</Link>.
              </label>
            </div>

            {error && (
              <p
                style={{
                  color: "red",
                  marginTop: "4px",
                  marginBottom: "12px",
                  fontSize: "0.9rem",
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "999px",
                border: "none",
                backgroundColor: "#22604D",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Registrar
            </button>
          </form>
        </div>
        {/* Contacto */}
        <section className="home-contact">
          <p>contacto@mail.com</p>
        </section>

        <footer className="home-footer">
          <span>GTI 2025©</span>
        </footer>
      </div>
    </>
  );
}

export default Registro;


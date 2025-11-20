// src/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "./logicaFake/auth";
import { obtenerUsuarioCompleto } from "./logicaFake/logicaFake";
import HeaderNoRegistrado from "./templates/HeaderNoRegistrado";

function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log("🟦 Iniciando proceso de login...");
      const uid = await loginUsuario(correo, password);

      if (!uid) {
        setError("Correo o contraseña incorrectos");
        return;
      }

      console.log("🟩 UID obtenido del login:", uid);

      const usuarioCompleto = await obtenerUsuarioCompleto(uid);

      if (!usuarioCompleto || usuarioCompleto.error) {
        console.error("❌ Error obteniendo usuario completo:", usuarioCompleto);
        setError("Usuario no encontrado en el backend");
        return;
      }

      const usuarioFinal = {
        ...usuarioCompleto,
        uid,
        correo: usuarioCompleto.correo || correo,
      };

      localStorage.setItem("usuario", JSON.stringify(usuarioFinal));

      console.log(
        "✅ Usuario logueado:",
        usuarioFinal.nombre,
        "→ Rol:",
        usuarioFinal.rol
      );

      if (usuarioFinal.rol === "admin") navigate("/admin/intranet");
      else navigate("/ciudadano/intranet");
    } catch (error) {
      console.error("❌ Error en login:", error);
      setError("Error inesperado al iniciar sesión");
    }
  };

  return (
    <>
      <HeaderNoRegistrado />

      {/* Fondo a pantalla completa, igual que en CalidadAire */}
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
            maxWidth: "420px",
            margin: "0 auto",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "28px 22px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
          }}
        >
          <h1 style={{ textAlign: "center", marginBottom: "8px" }}>
            Iniciar sesión
          </h1>
          <p
            style={{
              textAlign: "center",
              marginBottom: "20px",
              fontSize: "0.95rem",
              color: "#555",
            }}
          >
            Accede con tu correo y contraseña para ver tus datos y recorridos.
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
                  boxSizing: "border-box",
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
                  boxSizing: "border-box",
                }}
              />
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
              Entrar
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

export default Login;

// src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Registro from "./Registro";
import IntranetCiudadano from "./ciudadano/Intranet";
import IntranetAdmin from "./admin/Intranet";
import Perfil from "./ciudadano/Perfil";
import Autologin from "./Autologin";
import Home from "./Home"; 
import CalidadAire from "./CalidadAire";
import Tienda from "./ciudadano/Tienda";   // 🟢 NUEVO
import { escucharSesion } from "./logicaFake/auth";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = escucharSesion(async (user) => {
      if (user) {
        console.log("👤 Usuario detectado desde Firebase:");
        console.log("📧 Correo:", user.correo);
        console.log("🧩 Rol detectado:", user.rol || "ciudadano (por defecto)");
        setUsuario(user);
      } else {
        setUsuario(null);
      }
      setCargando(false);
    });

    return () => unsubscribe();
  }, []);

  if (cargando) return <p>Cargando sesión...</p>;

  return (
    <Routes>
      <Route path="/autologin" element={<Autologin />} />

      {/* HOME por defecto */}
      <Route
        path="/"
        element={
          usuario ? (
            usuario.rol === "admin" ? (
              <Navigate to="/admin/intranet" />
            ) : (
              <Navigate to="/ciudadano/intranet" />
            )
          ) : (
            <Home />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          usuario ? (
            usuario.rol === "admin" ? (
              <Navigate to="/admin/intranet" />
            ) : (
              <Navigate to="/ciudadano/intranet" />
            )
          ) : (
            <Login />
          )
        }
      />

      {/* Registro */}
      <Route
        path="/registro"
        element={
          usuario ? (
            <Navigate to="/ciudadano/intranet" />
          ) : (
            <Registro />
          )
        }
      />

      {/* INTRANET CIUDADANO */}
      <Route
        path="/ciudadano/intranet"
        element={
          usuario ? (
            usuario.rol === "ciudadano" ? (
              <IntranetCiudadano />
            ) : (
              <Navigate to="/admin/intranet" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* TIENDA (solo usuarios ciudadanos logueados) */}
      <Route
        path="/tienda"
        element={
          usuario ? (
            usuario.rol === "ciudadano" ? (
              <Tienda />
            ) : (
              <Navigate to="/admin/intranet" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* INTRANET ADMIN */}
      <Route
        path="/admin/intranet"
        element={
          usuario ? (
            usuario.rol === "admin" ? (
              <IntranetAdmin />
            ) : (
              <Navigate to="/ciudadano/intranet" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* PERFIL */}
      <Route
        path="/perfil"
        element={usuario ? <Perfil /> : <Navigate to="/login" />}
      />

      {/* Calidad del aire */}
      <Route path="/calidad-aire" element={<CalidadAire />} />

      {/* RUTA POR DEFECTO */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

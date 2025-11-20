// src/App.js
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./Login";
import Registro from "./Registro";
import IntranetCiudadano from "./ciudadano/Intranet";
import IntranetAdmin from "./admin/Intranet";
import PerfilAdmin from "./admin/Perfil";
import Autologin from "./Autologin";
import Home from "./Home";
import CalidadAire from "./CalidadAire";
import CalidadAireCiudadano from "./ciudadano/CalidadAire";
import InformacionCiudadano from "./ciudadano/Informacion";

import Tienda from "./ciudadano/Tienda";
import PerfilCiudadano from "./ciudadano/Perfil";
import { escucharSesion } from "./logicaFake/auth";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = escucharSesion(async (user) => {
      if (user) {
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

      {/* Rutas públicas */}
      <Route path="/" element={!usuario ? <Home /> : (usuario.rol === "admin" ? <Navigate to="/admin/intranet" /> : <Navigate to="/ciudadano/intranet" />)} />
      <Route path="/login" element={!usuario ? <Login /> : (usuario.rol === "admin" ? <Navigate to="/admin/intranet" /> : <Navigate to="/ciudadano/intranet" />)} />
      <Route path="/registro" element={!usuario ? <Registro /> : <Navigate to="/ciudadano/intranet" />} />
      <Route path="/calidad-aire" element={<CalidadAire />} />

      {/* Rutas de ciudadano */}
      <Route path="/ciudadano/intranet" element={usuario && usuario.rol === "ciudadano" ? <IntranetCiudadano /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/calidad-aire" element={usuario && usuario.rol === "ciudadano" ? <CalidadAireCiudadano /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/informacion" element={usuario && usuario.rol === "ciudadano" ? <InformacionCiudadano/> : <Navigate to="/login" />} />
      <Route path="/ciudadano/tienda" element={usuario && usuario.rol === "ciudadano" ? <Tienda /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/perfil" element={usuario && usuario.rol === "ciudadano" ? <PerfilCiudadano /> : <Navigate to="/login" />} />

      {/* Rutas de administrador */}
      <Route path="/admin/intranet" element={usuario && usuario.rol === "admin" ? <IntranetAdmin /> : <Navigate to="/login" />} />
      <Route path="/admin/perfil" element={usuario && usuario.rol === "admin" ? <PerfilAdmin /> : <Navigate to="/login" />} />

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


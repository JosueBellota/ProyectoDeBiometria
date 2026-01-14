// --------------------------------------------------------------------------
// Fichero: App.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero es el componente principal de la aplicación React.
// Se encarga de gestionar el enrutamiento de la aplicación y de controlar
// el estado de la sesión del usuario para proteger las rutas.
// --------------------------------------------------------------------------

import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// --------------------------------------------------------------------------
// 📝 Vistas y Componentes
// --------------------------------------------------------------------------
import Login from "./Login";
import Registro from "./Registro";
import IntranetCiudadano from "./ciudadano/Intranet";
import IntranetAdmin from "./admin/Intranet";
import PerfilAdmin from "./admin/Perfil";
import Autologin from "./Autologin";
import Home from "./Home";
import CalidadAire from "./CalidadAire";
import InformacionCiudadano from "./ciudadano/Informacion";
import Lecturas from "./ciudadano/Lecturas";
import Tienda from "./ciudadano/Tienda";
import PerfilCiudadano from "./ciudadano/Perfil";
import Incidencias from "./ciudadano/Incidencias"; // <-- Importado
import { escucharSesion } from "./logicaFake/auth";
import VerificarEmail from "./VerificarEmail"; // <-- Importado
import Condiciones from "./Condiciones";
import Nodos from "./admin/nodos"; 
import IncidenciasAdmin from "./admin/Incidencias";

// --------------------------------------------------------------------------
// ✅ Componente Principal: App
// --------------------------------------------------------------------------
function App() {
  // --------------------------------------------------------------------------
  // ✨ Estado del Componente
  //
  // - usuario: Almacena la información del usuario logueado (o null si no hay sesión).
  // - cargando: Indica si se está verificando el estado de la sesión.
  // --------------------------------------------------------------------------
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // ✨ Efecto de Carga de Sesión
  //
  // Se ejecuta al montar el componente para suscribirse a los cambios
  // de estado de la sesión de Firebase.
  // --------------------------------------------------------------------------
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

  // Muestra un mensaje de carga mientras se verifica la sesión.
  if (cargando) return <p>Cargando sesión...</p>;

  // Si el usuario existe pero no ha verificado su email, muestra la pantalla de verificación
  if (usuario && !usuario.emailVerified) {
    return <VerificarEmail usuario={usuario} />;
  }

  // -----------------------------------------------------------------------------------
  // 🚀 Sistema de Enrutamiento (React Router)
  //
  // Define las rutas de la aplicación y las protege según el rol del usuario.
  // -----------------------------------------------------------------------------------
  return (
    <Routes>
      <Route path="/autologin" element={<Autologin />} />

      {/* ------------------ Rutas Públicas ------------------ */}
      <Route path="/" element={!usuario ? <Home /> : (usuario.rol === "admin" ? <Navigate to="/admin/intranet" /> : <Navigate to="/ciudadano/intranet" />)} />
      <Route path="/login" element={!usuario ? <Login /> : (usuario.rol === "admin" ? <Navigate to="/admin/intranet" /> : <Navigate to="/ciudadano/intranet" />)} />
      <Route path="/registro" element={!usuario ? <Registro /> : <Navigate to="/ciudadano/intranet" />} />
      <Route path="/condiciones" element={<Condiciones />} />
      <Route path="/calidad-aire" element={<CalidadAire />} />

      {/* ------------------ Rutas de Ciudadano ------------------ */}
      <Route path="/ciudadano/intranet" element={usuario && usuario.rol === "ciudadano" ? <IntranetCiudadano /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/incidencias" element={usuario && usuario.rol === "ciudadano" ? <Incidencias /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/lecturas" element={usuario && usuario.rol === "ciudadano" ? <Lecturas /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/informacion" element={usuario && usuario.rol === "ciudadano" ? <InformacionCiudadano/> : <Navigate to="/login" />} />
      <Route path="/ciudadano/tienda" element={usuario && usuario.rol === "ciudadano" ? <Tienda /> : <Navigate to="/login" />} />
      <Route path="/ciudadano/perfil" element={usuario && usuario.rol === "ciudadano" ? <PerfilCiudadano /> : <Navigate to="/login" />} />

      {/* ------------------ Rutas de Administrador ------------------ */}
      <Route path="/admin/intranet" element={usuario && usuario.rol === "admin" ? <IntranetAdmin /> : <Navigate to="/login" />} />
      <Route path="/admin/perfil" element={usuario && usuario.rol === "admin" ? <PerfilAdmin /> : <Navigate to="/login" />} />
      <Route
      path="/admin/nodos"
      element={usuario && usuario.rol === "admin" ? <Nodos /> : <Navigate to="/login" />}
      />
      <Route path="/admin/incidencias" element={usuario && usuario.rol === "admin" ? <IncidenciasAdmin /> : <Navigate to="/login" />} />


      {/* ------------------ Redirección por Defecto ------------------ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


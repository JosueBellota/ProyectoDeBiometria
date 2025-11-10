import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Registro from "./Registro";
import Intranet from "./ciudadano/Intranet";
import IntranetAdmin from "./admin/Intranet";
import Perfil from "./ciudadano/Perfil";
import { escucharSesion } from "./logicaFake/auth";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = escucharSesion((user) => {
      setUsuario(user);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  if (cargando) return <p>Cargando sesión...</p>;

  return (
    <Routes>
      <Route path="/" element={usuario ? <Navigate to="/ciudadano/intranet" /> : <Home />} />
      <Route path="/login" element={usuario ? <Navigate to="/ciudadano/intranet" /> : <Login />} />
      <Route path="/registro" element={usuario ? <Navigate to="/ciudadano/intranet" /> : <Registro />} />
      <Route path="/ciudadano/intranet" element={usuario ? <Intranet /> : <Navigate to="/login" />} />
      <Route path="/admin/intranet" element={usuario ? <IntranetAdmin /> : <Navigate to="/login" />} />
      <Route path="/perfil" element={usuario ? <Perfil /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

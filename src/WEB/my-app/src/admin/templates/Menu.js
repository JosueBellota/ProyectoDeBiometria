// --------------------------------------------------------------------------
// Fichero: Menu.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene el menú de navegación del administrador.
// --------------------------------------------------------------------------

import React from "react";
import { useNavigate } from "react-router-dom";
import { cerrarSesion } from "./../../logicaFake/auth";

function Menu() {
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <nav className="menu">
      <ul>
        <li>
          <button onClick={() => navigate("/intranet")}>Inicio</button>
        </li>
        <li>
          <button onClick={() => navigate("/perfil")}>Perfil</button>
        </li>
        <li>
          <button onClick={handleCerrarSesion}>Cerrar sesión</button>
        </li>
        <li>
          <button onClick={() => navigate("/admin/nodos")}>nodos</button>
        </li>
      </ul>
    </nav>
  );
}

export default Menu;

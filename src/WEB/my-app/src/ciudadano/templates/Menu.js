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
      </ul>
    </nav>
  );
}

export default Menu;

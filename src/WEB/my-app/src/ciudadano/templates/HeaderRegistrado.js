import React from "react";
import "../css/main.css";
import { Link } from "react-router-dom";

export default function HeaderNoRegistrado() {
  return (
    <header className="headerNR">
      <div className="headerNR-left">
        <img src="/logo.svg" alt="Logo" className="headerNR-logo" />
      </div>

      <nav className="headerNR-nav">
        <Link to="/info">INFORMACIÓN</Link>
        <Link to="/incidencias">INCIDENCIAS</Link>
        <Link to="/login">INICIA SESIÓN</Link>
      </nav>

      <div className="headerNR-right">
        <Link to="/register" className="headerNR-btn">
          REGÍSTRATE
        </Link>
      </div>
    </header>
  );
}

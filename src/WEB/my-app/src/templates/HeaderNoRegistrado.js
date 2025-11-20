import React from "react";
import "../css/main.css";
import { Link } from "react-router-dom";

export default function HeaderNoRegistrado() {
  return (
    <header className="headerNR">
      <div className="headerNR-left">
        <Link to="/">
          <img src="/logo.svg" alt="Logo" className="headerNR-logo" />
        </Link>
      </div>

      <div className="headerNR-right">
        <nav className="headerNR-nav">
          <Link to="/info">INFORMACIÓN</Link>
          <Link to="/incidencias">INCIDENCIAS</Link>
          <Link to="/login">INICIA SESIÓN</Link>
        </nav>

        <Link to="/registro" className="headerNR-btn">
          REGÍSTRATE
        </Link>
      </div>
    </header>
  );
}

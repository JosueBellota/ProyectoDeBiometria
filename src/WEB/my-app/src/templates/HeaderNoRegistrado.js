// --------------------------------------------------------------------------
// Fichero: HeaderNoRegistrado.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene el header para los usuarios no registrados.
// --------------------------------------------------------------------------

import React, { useState } from "react";
import "../css/main.css";
import { Link } from "react-router-dom";

export default function HeaderNoRegistrado() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => setMenuAbierto((prev) => !prev);
  const closeMenu = () => setMenuAbierto(false);

  return (
    <header className="headerNR">
      <div className="headerNR-left">
        <Link to="/" onClick={closeMenu}>
          <img src="/logo.svg" alt="Logo" className="headerNR-logo headerNR-logo-mobile" />
          <img src="/Logo_texto.png" alt="Logo con texto" className="headerNR-logo headerNR-logo-desktop" />
        </Link>
      </div>

      {/* Botón hamburguesa (solo móvil) */}
      <button
        className={`headerNR-burger ${menuAbierto ? "open" : ""}`}
        onClick={toggleMenu}
        aria-label="Abrir menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menú normal + botón registro */}
      <div className={`headerNR-right ${menuAbierto ? "open" : ""}`}>
        <nav className="headerNR-nav">
          <Link to="/info" onClick={closeMenu}>
            INFORMACIÓN
          </Link>
          <Link to="/calidad-aire" onClick={closeMenu}>
            CONTAMINANTES
          </Link>
          <Link to="/login" onClick={closeMenu}>
            INICIA SESIÓN
          </Link>
        </nav>

        <Link to="/registro" className="headerNR-btn" onClick={closeMenu}>
          REGÍSTRATE
        </Link>
      </div>
    </header>
  );
}

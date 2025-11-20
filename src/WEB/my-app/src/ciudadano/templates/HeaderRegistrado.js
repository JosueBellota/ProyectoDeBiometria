import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../css/ciudadano.css";   // <-- CSS correcto

export default function HeaderRegistrado({ monedas = 0 }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => setMenuAbierto(!menuAbierto);
  const closeMenu = () => setMenuAbierto(false);

  return (
    <header className="headerR">
      {/* LOGO → INTRANET */}
      <div className="headerR-left">
        <Link to="/ciudadano/intranet" onClick={closeMenu}>
          <img src="/logo.svg" alt="Logo" className="headerR-logo" />
        </Link>
      </div>

      {/* BURGER (móvil) */}
      <button
        className={`headerR-burger ${menuAbierto ? "open" : ""}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* MENÚ DERECHO */}
      <div className={`headerR-right ${menuAbierto ? "open" : ""}`}>
        <nav className="headerR-nav">
          <Link to="/informacion" onClick={closeMenu}>INFORMACIÓN</Link>
          <Link to="/incidencias" onClick={closeMenu}>INCIDENCIAS</Link>
          <Link to="/mapa" onClick={closeMenu}>MAPA</Link>
          <Link to="/graficas" onClick={closeMenu}>GRÁFICAS</Link>
          <Link to="/recorrido" onClick={closeMenu}>RECORRIDO</Link>
        </nav>

        {/* MONEDAS → TIENDA */}
        <Link to="/tienda" className="headerR-coins" onClick={closeMenu}>
          <span className="headerR-coins-amount">{monedas}</span>
          <img src="/moneda.png" alt="Moneda" className="headerR-moneda-img" />
        </Link>

        {/* PERFIL */}
        <Link to="/perfil" className="headerR-profile-link" onClick={closeMenu}>
          <div className="headerR-user-icon">👤</div>
        </Link>
      </div>
    </header>
  );
}

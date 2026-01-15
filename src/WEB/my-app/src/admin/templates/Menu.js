// --------------------------------------------------------------------------
// Fichero: Menu.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene el menú de navegación del administrador (estilo HeaderRegistrado).
// --------------------------------------------------------------------------

import React, { useState, useEffect } from "react";
import "../../css/main.css";
import { Link, useNavigate } from "react-router-dom";
import { cerrarSesion, obtenerUsuarioLogueado } from "../../logicaFake/auth";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { obtenerUsuarioCompleto } from "../../logicaFake/logicaFake";

export default function Menu() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuAbierto((prev) => !prev);
  const closeMenu = () => setMenuAbierto(false);

  useEffect(() => {
    const cargarUsuario = async () => {
      const user = obtenerUsuarioLogueado();
      if (user) {
        try {
          // Intentar cargar nombre del usuario si es posible
          // Si no, mostrar "Admin"
          const datosCompletos = await obtenerUsuarioCompleto(user.uid);
          if (!datosCompletos.error) {
            setUsuario(datosCompletos);
          }
        } catch (error) {
          console.error("Error al cargar datos de usuario:", error);
        }
      }
    };
    cargarUsuario();
  }, []);

  const handleLogout = () => {
    cerrarSesion();
    closeMenu();
    navigate("/");
  };

  return (
    <header className="header-registrado">
      <div className="header-registrado-left">
        <Link to="/admin/intranet" onClick={closeMenu}>
          {/* Reutilizamos el logo si existe en public */}
          <img src="/logo.svg" alt="Logo" className="header-registrado-logo header-registrado-logo-mobile" />
          <img src="/Logo_texto.png" alt="Logo con texto" className="header-registrado-logo header-registrado-logo-desktop" />
        </Link>
      </div>

      <button
        className={`header-registrado-burger ${menuAbierto ? "open" : ""}`}
        onClick={toggleMenu}
        aria-label="Abrir menú"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`header-registrado-right ${menuAbierto ? "open" : ""}`}>
        <nav className="header-registrado-nav">
          <Link to="/admin/intranet" onClick={closeMenu}>
            USUARIOS
          </Link>
          
          <Link to="/admin/nodos" onClick={closeMenu}>
            NODOS
          </Link>

          <Link to="/admin/lecturas" onClick={closeMenu}>
            MAPA
          </Link>

          <Link to="/admin/historial-lecturas" onClick={closeMenu}>
            LECTURAS
          </Link>

          <Link to="/admin/incidencias" onClick={closeMenu}>
            INCIDENCIAS
          </Link>

          <button onClick={handleLogout} aria-label="Cerrar sesión">
            CERRAR SESIÓN
          </button>
        </nav>

        <Link
          to="/admin/perfil"
          onClick={closeMenu}
          className="header-registrado-perfil-link"
        >
          <AccountCircle sx={{ fontSize: 48, color: "white" }} />
          <span className="perfil-nombre">
            {usuario ? usuario.nombre : "Admin"}
          </span>
        </Link>
      </div>
    </header>
  );
}
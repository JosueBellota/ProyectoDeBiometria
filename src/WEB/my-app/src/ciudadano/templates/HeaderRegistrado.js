import React, { useState, useEffect } from "react";
import "../../css/main.css";
import { Link, useNavigate } from "react-router-dom";
import { obtenerUsuarioCompleto } from "../../logicaFake/logicaFake";
import { cerrarSesion, obtenerUsuarioLogueado } from "../../logicaFake/auth";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MonetizationOn from "@mui/icons-material/MonetizationOn";

export default function HeaderRegistrado() {
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
        <Link to="/ciudadano/intranet" onClick={closeMenu}>
          <img src="/logo.svg" alt="Logo" className="header-registrado-logo" />
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
          <Link to="/ciudadano/intranet" onClick={closeMenu}>
            INTRANET
          </Link>
          
          <Link to="/ciudadano/Informacion" onClick={closeMenu}>
            INFORMACIÓN
          </Link>
          <Link to="/ciudadano/calidad-aire" onClick={closeMenu}>
            CONTAMINANTES
          </Link>

          <button onClick={handleLogout} aria-label="Cerrar sesión">
            CERRAR SESIÓN
          </button>
          <Link
            to="/ciudadano/tienda"
            onClick={closeMenu}
            className="header-registrado-monedas-link"
            aria-label={`Ir a la tienda. Tienes ${usuario?.monedas ?? 0} monedas`}
          >
            <MonetizationOn sx={{ fontSize: 24 }} />
            <span>{usuario?.monedas ?? 0}</span>
          </Link>
        </nav>

        <Link
          to="/ciudadano/perfil"
          onClick={closeMenu}
          className="header-registrado-perfil-link"
        >
          <AccountCircle sx={{ fontSize: 48, color: "white" }} />
          <span className="perfil-nombre">
            {usuario ? usuario.nombre : "..."}
          </span>
        </Link>
      </div>
    </header>
  );
}

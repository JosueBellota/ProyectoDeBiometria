import React from "react";
import { useNavigate } from "react-router-dom";
import { cerrarSesion } from "./../../logicaFake/auth";
import { Box, Button } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

function Menu({ nombreUsuario }) {
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    cerrarSesion();
    navigate("/");
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '10px', backgroundColor: '#f5f5f5' }}>
      <Button onClick={() => navigate("/intranet")}>Inicio</Button>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Button onClick={() => navigate("/perfil")} startIcon={<PersonIcon />}>
          Perfil
        </Button>
        <span style={{ fontSize: '0.8rem' }}>{nombreUsuario || "Usuario"}</span>
      </Box>
      <Button onClick={handleCerrarSesion}>Cerrar sesión</Button>
    </Box>
  );
}

export default Menu;

import React from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>Bienvenido a Proyecto de Biometría</h1>
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/login")}>Iniciar Sesión</button>
        <button onClick={() => navigate("/registro")} style={{ marginLeft: "10px" }}>
          Registrarse
        </button>
      </div>
    </div>
  );
}

export default Home;

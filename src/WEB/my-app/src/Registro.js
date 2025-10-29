import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarCiudadano } from "./logicaFake/auth";

function Registro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultado = await registrarCiudadano(nombre, correo, password);

    if (resultado && resultado.uidFirebase) {
      console.log("IDs:", resultado); 
      navigate("/intranet");
    } else {
      setError("Error al registrar usuario");
    }
  };


  return (
    <div className="container">
      <h1>Registro de Ciudadano</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} required />
        </div>
        <div>
          <label>Correo:</label>
          <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default Registro;

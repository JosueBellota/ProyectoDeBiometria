import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "./logicaFake/auth";

function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uid = await loginUsuario(correo, password);
    if (uid) navigate("/intranet");
    else setError("Correo o contraseña incorrectos");
  };

  return (
    <div className="container">
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo:</label>
          <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;

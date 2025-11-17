import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registrarCiudadano } from "./logicaFake/auth";

function Registro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");   // ⬅️ NUEVO
  const [error, setError] = useState(null);

  const validarCorreo = (correo) => {
    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regexCorreo.test(correo);
  };

  const validarPassword = (password) => {
    // mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número
    const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regexPassword.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validarCorreo(correo)) {
      setError("El correo no tiene un formato válido.");
      return;
    }

    if (!validarPassword(password)) {
      setError("La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula y un número.");
      return;
    }

    // ⛔ Validar que las contraseñas coincidan
    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const resultado = await registrarCiudadano(nombre, correo, password);

    if (resultado) {
      alert("Registro completado. Se ha enviado un correo de verificación.");
      navigate("/intranet");
    } else {
      setError("El correo ya está registrado o hubo un error en el registro.");
    }
  };

  return (
    <div className="container">
      <h1>Registro de Ciudadano</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Correo:</label>
          <input
            type="email"
            value={correo}
            onChange={e => setCorreo(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Repetir contraseña:</label>
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default Registro;

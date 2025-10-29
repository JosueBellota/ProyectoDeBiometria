import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado, actualizarUsuario } from "../logicaFake/auth";
import Menu from "./templates/Menu";

function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
  });

  useEffect(() => {
    const user = obtenerUsuarioLogueado();
    if (!user) {
      navigate("/login");
    } else {
      setUsuario({
        nombre: user.nombre || "",
        correo: user.correo || "",
        contraseña: "",
      });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario({ ...usuario, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const usuarioLocal = obtenerUsuarioLogueado();
      if (!usuarioLocal) {
        alert("Error: no hay usuario logueado.");
        navigate("/login");
        return;
      }

      // ✅ Preparar los nuevos datos
      const nuevosDatos = {};
      if (usuario.nombre) nuevosDatos.nombre = usuario.nombre;
      if (usuario.correo) nuevosDatos.correo = usuario.correo;
      if (usuario.contraseña) nuevosDatos.password = usuario.contraseña;

      // ✅ Llamar a la función centralizada en auth.js
      await actualizarUsuario(usuarioLocal.uid, nuevosDatos);

      alert("✅ Datos actualizados correctamente.");
    } catch (error) {
      console.error("❌ Error al actualizar:", error);
      alert("❌ No se pudo actualizar el perfil.");
    }
  };

  return (
    <div className="container">
      <Menu />
      <h1>Perfil del Usuario</h1>
      <form onSubmit={handleSubmit} className="perfil-form">
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            name="nombre"
            value={usuario.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Correo:</label>
          <input
            type="email"
            name="correo"
            value={usuario.correo}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            name="contraseña"
            value={usuario.contraseña}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Actualizar</button>
      </form>
    </div>
  );
}

export default Perfil;

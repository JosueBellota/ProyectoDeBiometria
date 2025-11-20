import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  obtenerUsuarioLogueado,
  actualizarUsuario,
  reautenticarUsuario,
  actualizarPasswordConReautenticacion,
} from "../logicaFake/auth";
import HeaderRegistrado from "./templates/HeaderRegistrado";

function Perfil() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    nuevaContraseña: "",
    repetirContraseña: "",
  });
  const [usuarioOriginal, setUsuarioOriginal] = useState(null);

  useEffect(() => {
    const user = obtenerUsuarioLogueado();
    if (!user) {
      navigate("/login");
    } else {
      setUsuario({
        nombre: user.nombre || "",
        correo: user.correo || "",
        contraseña: "",
        nuevaContraseña: "",
        repetirContraseña: "",
      });
      setUsuarioOriginal(user);
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario({ ...usuario, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuario.contraseña) {
      alert("Debes introducir tu contraseña actual para realizar cambios.");
      return;
    }

    if (usuario.nuevaContraseña !== usuario.repetirContraseña) {
      alert("Las nuevas contraseñas no coinciden.");
      return;
    }

    try {
      const usuarioLocal = obtenerUsuarioLogueado();
      if (!usuarioLocal) {
        alert("Error: no hay usuario logueado.");
        navigate("/login");
        return;
      }

      let somethingChanged = false;

      // 1. Manejar el cambio de contraseña
      if (usuario.nuevaContraseña) {
        somethingChanged = true;
        await actualizarPasswordConReautenticacion(
          usuario.contraseña,
          usuario.nuevaContraseña
        );
        console.log("✅ Contraseña actualizada con éxito.");
      }

      // 2. Manejar el cambio de nombre o correo
      const hasProfileDataChanged =
        usuario.nombre !== usuarioOriginal.nombre ||
        usuario.correo !== usuarioOriginal.correo;

      if (hasProfileDataChanged) {
        somethingChanged = true;
        console.log("🟨 Actualizando nombre/correo...");

        // Si la contraseña no se cambió en el paso 1, necesitamos reautenticar igualmente
        if (!usuario.nuevaContraseña) {
          await reautenticarUsuario(usuario.contraseña);
        }

        const nuevosDatos = {
          nombre: usuario.nombre,
          correo: usuario.correo,
        };
        await actualizarUsuario(usuarioLocal.uid, nuevosDatos);
        console.log("✅ Datos del perfil (nombre/correo) actualizados.");
      }
      
      if (!somethingChanged) {
        alert("No has modificado ningún dato.");
        return;
      }

      alert("✅ Perfil actualizado correctamente.");
      navigate("/intranet");

    } catch (error) {
      console.error("❌ Error al actualizar:", error);
      let errorMessage = "❌ No se pudo actualizar el perfil. ";
      if (error.code === 'auth/wrong-password') {
        errorMessage += "La contraseña actual es incorrecta.";
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    }
  };

  return (
    <>
    <HeaderRegistrado />
    <div className="container">
     
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
          <label>Nueva Contraseña:</label>
          <input
            type="password"
            name="nuevaContraseña"
            value={usuario.nuevaContraseña}
            onChange={handleChange}
            placeholder="Dejar en blanco para no cambiar"
          />
        </div>
        
        <div>
          <label>Repetir Nueva Contraseña:</label>
          <input
            type="password"
            name="repetirContraseña"
            value={usuario.repetirContraseña}
            onChange={handleChange}
          />
        </div>

        <hr />

        <div>
          <label>Contraseña Actual (obligatoria para cualquier cambio):</label>
          <input
            type="password"
            name="contraseña"
            value={usuario.contraseña}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Actualizar</button>
      </form>
    </div>
    </>
  );
}

export default Perfil;


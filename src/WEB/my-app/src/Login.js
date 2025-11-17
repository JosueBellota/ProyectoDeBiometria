import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "./logicaFake/auth";
import { obtenerUsuarioCompleto } from "./logicaFake/logicaFake";

function Login() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log("🟦 Iniciando proceso de login...");
      const uid = await loginUsuario(correo, password);

      if (!uid) {
        setError("Correo o contraseña incorrectos");
        return;
      }

      console.log("🟩 UID obtenido del login:", uid);

      // ✅ Obtener datos completos del usuario desde el backend
      const usuarioCompleto = await obtenerUsuarioCompleto(uid);

      if (!usuarioCompleto || usuarioCompleto.error) {
        console.error("❌ Error obteniendo usuario completo:", usuarioCompleto);
        setError("Usuario no encontrado en el backend");
        return;
      }

      // Guardar el usuario completo con su rol y UID
      const usuarioFinal = {
        ...usuarioCompleto,
        uid,
        correo: usuarioCompleto.correo || correo,
      };

      localStorage.setItem("usuario", JSON.stringify(usuarioFinal));

      console.log("✅ Usuario logueado:", usuarioFinal.nombre, "→ Rol:", usuarioFinal.rol);

      // ✅ Redirección según el rol
      if (usuarioFinal.rol === "admin") navigate("/admin/intranet");
      else navigate("/ciudadano/intranet");
    } catch (error) {
      console.error("❌ Error en login:", error);
      setError("Error inesperado al iniciar sesión");
    }
  };

  return (
    <div className="container">
      <h1>Iniciar Sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo:</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;

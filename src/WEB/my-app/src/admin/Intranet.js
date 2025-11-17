import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "./../logicaFake/auth";
import { mainAdmin } from "./../logicaFake/logicaFake";
import Menu from "./templates/Menu";
import "./css/admin.css";

let testEjecutado = false;

function IntranetAdmin() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ✅ Verificar si el usuario está logueado y es admin
  useEffect(() => {
    const user = obtenerUsuarioLogueado();

    if (!user) {
      navigate("/");
      return;
    }

    if (user.rol !== "admin") {
      alert("⚠️ Acceso denegado. Solo los administradores pueden ingresar.");
      navigate("/");
      return;
    }
  }, [navigate]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    if (typeof fecha === "string" || typeof fecha === "number")
      return new Date(fecha).toLocaleString();
    if (fecha.seconds) return new Date(fecha.seconds * 1000).toLocaleString();
    if (fecha._seconds) return new Date(fecha._seconds * 1000).toLocaleString();
    return "Formato de fecha desconocido";
  };

  useEffect(() => {
    if (!testEjecutado) {
      const ejecutar = async () => {
        try {
          const res = await mainAdmin();
          setUsuarios(res);
        } catch (error) {
          console.error("❌ Error al obtener usuarios:", error);
          setUsuarios([{ error: error.message }]);
        } finally {
          setCargando(false);
        }
      };
      ejecutar();
      testEjecutado = true;
    } else {
      setCargando(false);
    }
  }, []);

  return (
    <div className="container">
      <Menu />
      <h1>👩‍💼 Panel de Administración - Usuarios Registrados</h1>
      {cargando ? (
        <p>Cargando lista de usuarios...</p>
      ) : usuarios.length === 0 ? (
        <p>No hay usuarios registrados.</p>
      ) : usuarios[0].error ? (
        <span className="error">{usuarios[0].error}</span>
      ) : (
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>ID Usuario</th>
              <th>Fecha Registro</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={i}>
                <td data-label="#"> {i + 1} </td>
                <td data-label="Nombre">{u.resultado?.nombre}</td>
                <td data-label="Correo">{u.resultado?.correo}</td>
                <td data-label="Rol">{u.resultado?.rol}</td>
                <td data-label="ID Usuario">{u.resultado?.idUsuario}</td>
                <td data-label="Fecha Registro">
                  {formatearFecha(u.resultado?.fechaRegistro)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default IntranetAdmin;

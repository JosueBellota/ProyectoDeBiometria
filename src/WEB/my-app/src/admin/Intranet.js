// --------------------------------------------------------------------------
// Fichero: Intranet.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la intranet de administrador.
// --------------------------------------------------------------------------

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
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: "", correo: "", rol: "ciudadano" });

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

  const handleAddUser = () => {
    // Aquí iría la lógica para añadir el usuario a la base de datos
    console.log("Añadir nuevo usuario:", newUser);
    // Por ahora, solo lo añadimos al estado local para demostración
    setUsuarios([...usuarios, { resultado: { ...newUser, fechaRegistro: new Date() } }]);
    setShowAddUserModal(false);
    setNewUser({ nombre: "", correo: "", rol: "ciudadano" });
  };

  return (
    <div className="home-page">
      <Menu />
      <main className="home-content">
        <div className="intranet-content-block">
          <h1 className="intranet-title">👩‍💼 Panel de Administración - Usuarios Registrados</h1>
          
          <button onClick={() => setShowAddUserModal(true)} className="add-user-btn">Añadir Usuario</button>

          {cargando ? (
            <p>Cargando lista de usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : usuarios[0].error ? (
            <span className="error">{usuarios[0].error}</span>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="usuarios-tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={i}>
                      <td data-label="#"> {i + 1} </td>
                      <td data-label="Nombre">{u.resultado?.nombre}</td>
                      <td data-label="Correo">{u.resultado?.correo}</td>
                      <td data-label="Rol">{u.resultado?.rol}</td>
                      <td data-label="Fecha Registro">
                        {formatearFecha(u.resultado?.fechaRegistro)}
                      </td>
                      <td data-label="Acciones">
                        <button className="action-btn edit-btn">Editar</button>
                        <button className="action-btn delete-btn">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showAddUserModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Añadir Nuevo Usuario</h2>
              <input
                type="text"
                placeholder="Nombre"
                value={newUser.nombre}
                onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
              />
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={newUser.correo}
                onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })}
              />
              <select
                value={newUser.rol}
                onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
              >
                <option value="ciudadano">Ciudadano</option>
                <option value="admin">Admin</option>
              </select>
              <div className="modal-actions">
                <button onClick={handleAddUser}>Guardar</button>
                <button onClick={() => setShowAddUserModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default IntranetAdmin;
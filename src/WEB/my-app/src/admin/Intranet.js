import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "./../logicaFake/auth";
import { 
  mainAdmin, 
  crearUsuario, 
  eliminarUsuario, 
  actualizarDatosUsuario 
} from "./../logicaFake/logicaFake";
import Menu from "./templates/Menu";
import AirQualityExposure from "../ciudadano/AirQualityExposure";
import "./css/admin.css";

function IntranetAdmin() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Estado para crear usuario
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: "", correo: "", rol: "ciudadano", password: "" });
  
  // Estado para editar usuario
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const initialLoad = useRef(true);

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
    // Si es string (ISO) o timestamp numérico
    if (typeof fecha === "string" || typeof fecha === "number")
      return new Date(fecha).toLocaleString();
    // Si es objeto Timestamp de Firebase
    if (fecha.seconds) return new Date(fecha.seconds * 1000).toLocaleString();
    if (fecha._seconds) return new Date(fecha._seconds * 1000).toLocaleString();
    
    return "Formato de fecha desconocido";
  };

  const fetchUsers = useCallback(async () => {
    setCargando(true);
    try {
      const res = await mainAdmin();
      setUsuarios(res);
    } catch (error) {
      console.error("❌ Error al obtener usuarios:", error);
      setUsuarios([{ error: error.message }]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoad.current) {
      fetchUsers();
      initialLoad.current = false;
    }
  }, [fetchUsers]);

  // --- CREAR USUARIO ---
  const handleAddUser = async () => {
    if (!newUser.nombre || !newUser.correo || !newUser.password) {
      alert("Por favor completa todos los campos (nombre, correo, contraseña).");
      return;
    }
    
    try {
      const res = await crearUsuario(newUser);
      if (res.error) {
        alert("Error al crear usuario: " + res.error);
      } else {
        alert("Usuario creado correctamente.");
        setShowAddUserModal(false);
        setNewUser({ nombre: "", correo: "", rol: "ciudadano", password: "" });
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al crear el usuario.");
    }
  };

  // --- ELIMINAR USUARIO ---
  const handleDeleteUser = async (idUsuario) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await eliminarUsuario(idUsuario);
      if (res.error) {
        alert("Error al eliminar: " + res.error);
      } else {
        alert("Usuario eliminado correctamente.");
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al eliminar el usuario.");
    }
  };

  // --- EDITAR USUARIO ---
  const startEditUser = (userResult) => {
    // userResult es el objeto que viene dentro de u.resultado
    setEditingUser({
      id: userResult.idUsuario, // Asegúrate de que este campo exista en el objeto mapeado en logicaFake
      nombre: userResult.nombre,
      correo: userResult.correo,
      rol: userResult.rol,
      // No editamos password aquí por seguridad, ni fecha
    });
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async () => {
    if (!editingUser) return;
    
    try {
      const datosActualizar = {
        nombre: editingUser.nombre,
        correo: editingUser.correo, // Ojo: cambiar correo en Firebase Auth requiere re-autenticación a veces, pero LogicaDeNegocio lo maneja
        rol: editingUser.rol
      };

      const res = await actualizarDatosUsuario(editingUser.id, datosActualizar);
      if (res.error) {
        alert("Error al actualizar: " + res.error);
      } else {
        alert("Usuario actualizado correctamente.");
        setShowEditUserModal(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar usuario.");
    }
  };

  return (
    <div className="home-page">
      <Menu />
      <main className="home-content">
        <div className="intranet-content-block">
          <h1 className="intranet-title">👩‍💼 Usuarios Registrados</h1>
          
          {/* Vista Previa: Estimación de Exposición (Simulación) para Admin */}
          <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
              <h4 style={{ marginTop: 0 }}>👁️ Vista Previa: Estimación de Exposición (Ejemplo Semanal)</h4>
              <AirQualityExposure 
                startDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()} 
                endDate={new Date().toISOString()} 
              />
          </div>

          <div>
            <button onClick={() => setShowAddUserModal(true)} className="add-user-btn">Añadir Usuario</button>
            <button onClick={fetchUsers} className="refresh-btn">Actualizar</button>
          </div>

          {cargando ? (
            <p>Cargando lista de usuarios...</p>
          ) : usuarios.length === 0 ? (
            <p>No hay usuarios registrados.</p>
          ) : usuarios[0].error ? (
            <span className="error">{usuarios[0].error}</span>
          ) : (
            <div className="usuarios-tabla-container" style={{ overflowX: "auto" }}>
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
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => startEditUser(u.resultado)}
                        >
                          Editar
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={() => handleDeleteUser(u.resultado?.idUsuario)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL CREAR USUARIO */}
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
              <input
                type="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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

        {/* MODAL EDITAR USUARIO */}
        {showEditUserModal && editingUser && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <h2>Editar Usuario</h2>
              <input
                type="text"
                placeholder="Nombre"
                value={editingUser.nombre}
                onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
              />
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={editingUser.correo}
                onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
              />
              <select
                value={editingUser.rol}
                onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value })}
              >
                <option value="ciudadano">Ciudadano</option>
                <option value="admin">Admin</option>
              </select>
              <div className="modal-actions">
                <button onClick={handleSaveEditUser}>Actualizar</button>
                <button onClick={() => setShowEditUserModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default IntranetAdmin;

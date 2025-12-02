// --------------------------------------------------------------------------
// Fichero: logicaFake.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero simula la lógica de negocio para la aplicación web.
// --------------------------------------------------------------------------

import { obtenerUsuarioLogueado } from "./auth";
const API_BASE = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// --------------------------------------------------------------------------
// 🚀 Funciones de obtención de datos
// --------------------------------------------------------------------------

// ----------------------------------------------------------
// obtenerTodosLosUsuarios()
//
// Obtiene la lista completa de todos los usuarios registrados
// a través del ServidorREST. Requiere que un administrador
// esté logueado.
//
// Retorno:
//   - Array<Object>: Lista de objetos de usuario.
//   - { error: string }: Objeto con mensaje de error si falla la operación.
// ----------------------------------------------------------
export async function obtenerTodosLosUsuarios() {
  try {
    const usuario = obtenerUsuarioLogueado();
    const idAdmin = usuario?.uid || usuario?.id || usuario?.idUsuario;
    if (!idAdmin) throw new Error("No se encontró ID del administrador");

    const res = await fetch(`${API_BASE}/usuarios/admin/${idAdmin}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// obtenerNodosPorPropietario(idUsuario)
//
// Obtiene todos los nodos asociados a un propietario específico.
//
// Parámetros:
//   - idUsuario: ID del propietario de los nodos.
//
// Retorno:
//   - Array<Object>: Lista de objetos de nodo.
//   - { error: string }: Objeto con mensaje de error si falla la operación.
// ----------------------------------------------------------
async function obtenerNodosPorPropietario(idUsuario) {
  try {
    const res = await fetch(`${API_BASE}/nodos/propietario/${idUsuario}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// obtenerUsuarioCompleto(uid)
//
// Obtiene los datos completos de un usuario, incluyendo su rol,
// desde el ServidorREST.
//
// Parámetros:
//   - uid: UID del usuario.
//
// Retorno:
//   - Object: Objeto con los datos completos del usuario.
//   - { error: string }: Objeto con mensaje de error si falla la operación.
// ----------------------------------------------------------
export async function obtenerUsuarioCompleto(uid) {
  try {
    if (!uid) throw new Error("Se requiere el UID del usuario");

    // ✅ Nuevo endpoint universal
    let res = await fetch(`${API_BASE}/usuarios/completo/${uid}`);
    let data = await res.json();

    if (!res.ok || data.error) throw new Error(data.error || "No se pudo obtener el usuario");

    return data;
  } catch (error) {
    console.error("❌ Error en obtenerUsuarioCompleto:", error);
    return { error: error.message };
  }
}

// --------------------------------------------------------------------------
// ✨ Funciones de actualización de datos
// --------------------------------------------------------------------------

// ----------------------------------------------------------
// actualizarDistanciaUsuario(idUsuario, distancia)
//
// Actualiza la distancia recorrida por un usuario en el backend.
//
// Parámetros:
//   - idUsuario: ID del usuario a actualizar.
//   - distancia: Nueva distancia.
//
// Retorno:
//   - Object: La respuesta del servidor tras la actualización.
//   - { error: string }: Objeto con mensaje de error si falla la operación.
// ----------------------------------------------------------
export async function actualizarDistanciaUsuario(idUsuario, distancia) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ distancia }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("❌ Error en actualizarDistanciaUsuario:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// actualizarDatosUsuario(idUsuario, datos)
//
// Actualiza datos generales de un usuario en el backend.
//
// Parámetros:
//   - idUsuario: ID del usuario a actualizar.
//   - datos: Objeto con los campos a actualizar (ej. { nombre: "Nuevo Nombre" }).
//
// Retorno:
//   - Object: La respuesta del servidor tras la actualización.
//   - { error: string }: Objeto con mensaje de error si falla la operación.
// ----------------------------------------------------------
export async function actualizarDatosUsuario(idUsuario, datos) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("❌ Error en actualizarDatosUsuario:", error);
    return { error: error.message };
  }
}

// ----------------------------------------------------------
// actualizarMonedasUsuario(idUsuario, monedas)
//
// Actualiza el saldo de monedas de un usuario en el backend.
//
// Parámetros:
//   - idUsuario: ID del usuario a actualizar.
//   - monedas: Nuevo saldo de monedas.
//
// Retorno:
//   - Object: La respuesta del servidor tras la actualización.
//   - { error: string }: Objeto con mensaje de error si falla la operación.
// ----------------------------------------------------------
export async function actualizarMonedasUsuario(idUsuario, monedas) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monedas }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  } catch (error) {
    console.error("❌ Error en actualizarMonedasUsuario:", error);
    return { error: error.message };
  }
}

// --------------------------------------------------------------------------
// 🔄 Funciones principales
// --------------------------------------------------------------------------

// ----------------------------------------------------------
// main()
//
// Función principal para usuarios con rol de "ciudadano".
// Obtiene los nodos del usuario logueado, que ya incluyen sus
// mediciones más recientes gracias a la lógica del backend.
//
// Retorno:
//   - Array<Object>: Lista de nodos con sus datos y sensores.
// ----------------------------------------------------------
export async function main() {
  try {
    const usuario = obtenerUsuarioLogueado();
    const idUsuario = usuario?.uid || usuario?.id || usuario?.idUsuario;
    if (!idUsuario) {
      return [{ paso: "AUTENTICACIÓN", error: "No hay usuario logueado" }];
    }

    const nodos = await obtenerNodosPorPropietario(idUsuario);
    if (nodos.error) {
      return [{ paso: "GET /nodos/propietario", error: nodos.error }];
    }

    if (!Array.isArray(nodos) || nodos.length === 0) {
      return [{ 
        paso: "GET /nodos/propietario", 
        resultado: "El usuario no tiene nodos registrados." 
      }];
    }

    // El backend ahora devuelve los nodos con sus sensores y tiempo,
    // así que no necesitamos hacer más llamadas.
    return nodos.map(nodo => ({
      paso: "GET /nodos/propietario",
      resultado: {
        nodo: nodo.nombre,
        datos: {
          sensores: nodo.sensores || {},
          tiempo: nodo.tiempo || null
        }
      }
    }));
  } catch (error) {
    return [{ paso: "main()", error: error.message }];
  }
}

// ----------------------------------------------------------
// mainAdmin()
//
// Función principal para usuarios con rol de "administrador".
// Obtiene la lista completa de todos los usuarios.
//
// Retorno:
//   - Array<Object>: Lista de usuarios formateada.
// ----------------------------------------------------------
export async function mainAdmin() {
  try {
    const usuarios = await obtenerTodosLosUsuarios();
    if (usuarios.error) return [{ paso: "GET /usuarios", error: usuarios.error }];

    if (!Array.isArray(usuarios) || usuarios.length === 0)
      return [{ paso: "GET /usuarios", resultado: "No hay usuarios registrados." }];

    return usuarios.map((u) => ({
      paso: "GET /usuarios",
      resultado: {
        idUsuario: u.uid,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        monedas: u.monedas,     
        premios: u.premios,     
      },
    }));
  } catch (error) {
    return [{ paso: "mainAdmin()", error: error.message }];
  }
}

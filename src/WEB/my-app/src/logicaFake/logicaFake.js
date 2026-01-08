// --------------------------------------------------------------------------
// Fichero: logicaFake.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero simula la lógica de negocio para la aplicación web.
// --------------------------------------------------------------------------

import { obtenerUsuarioLogueado } from "./auth";
// logicaFake/logicaFake.js
import { API_BASE } from "./config";

// --------------------------------------------------------------------------
// 🚀 Funciones de obtención de datos
// --------------------------------------------------------------------------

export async function obtenerLecturas(opciones) {
  const params = new URLSearchParams();
  
  if (opciones.latitud) params.append("latitud", opciones.latitud);
  if (opciones.longitud) params.append("longitud", opciones.longitud);
  if (opciones.radio) params.append("radio", opciones.radio);
  if (opciones.fechaInicio) params.append("fechaInicio", opciones.fechaInicio.toISOString());
  if (opciones.fechaFin) params.append("fechaFin", opciones.fechaFin.toISOString());
  if (opciones.nombreNodo) params.append("nombreNodo", opciones.nombreNodo);
  if (opciones.propietarioId) params.append("propietarioId", opciones.propietarioId);

  try {
    const res = await fetch(`${API_BASE}/lecturas?${params.toString()}`);
    let data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener lecturas");

    // Filtrado por tipo de sensor en el cliente
    if (opciones.tiposensor && opciones.tiposensor !== 'all') {
      data = data.filter(lectura => lectura.tipo_sensor.toLowerCase() === opciones.tiposensor.toLowerCase());
    }

    return data;
  } catch (error) {
    console.error("❌ Error en obtenerLecturas:", error);
    return { error: error.message };
  }
}

export async function obtenerNodosPorUbicacion(lat, lon, radio) {
  try {
    const res = await fetch(`${API_BASE}/nodos/ubicacion?latitud=${lat}&longitud=${lon}&radio=${radio}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al obtener nodos por ubicación");
    return data;
  } catch (error) {
    console.error("❌ Error en obtenerNodosPorUbicacion:", error);
    return { error: error.message };
  }
}

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
export async function obtenerNodosPorPropietario(idUsuario) {
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


/**
 * Devuelve una lista de nodos con info del usuario y estado (activo 24h).
 * Requiere un endpoint en tu ServidorREST.
 */
export async function obtenerNodosAdmin() {
  const admin = obtenerUsuarioLogueado();
  if (!admin?.uid) throw new Error("No hay admin logueado");

  // 1) sacar usuarios desde admin (ruta existente)
  const rUsers = await fetch(`${API_BASE}/usuarios/admin/${admin.uid}`);
  if (!rUsers.ok) throw new Error("No se pudo obtener usuarios (admin)");

  const usuarios = await rUsers.json(); // <- en tu backend devuelve array con {id, nombre, correo...}

  // 2) por cada usuario, pedir sus nodos (ruta existente)
  const rows = [];

  for (const u of usuarios) {
    const rNodos = await fetch(`${API_BASE}/nodos/propietario/${u.id}`);
    if (!rNodos.ok) continue;

    const nodos = await rNodos.json(); // tu obtenerNodos ya devuelve sensores/tiempo

    nodos.forEach((n) => {
      // activo: si tiene tiempo y es <24h
      const lastTs = n.tiempo || null;
      let activo24h = false;

      if (lastTs?.seconds) {
        const ms = lastTs.seconds * 1000;
        activo24h = Date.now() - ms <= 24 * 60 * 60 * 1000;
      }

      rows.push({
        uid: u.id,
        nombreUsuario: u.nombre,
        correoUsuario: u.correo,
        nodoId: n.id,
        nodoNombre: n.nombre,
        encendido: !!n.encendido,
        creadoEn: n.creadoEn || null,
        lastReadingAt: lastTs,
        activo24h,
      });
    });
  }

  return rows;
}
// -----------------------------------------------------------------------------------
// Fichero: LogicaDeNegocio.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Clase LogicaDeNegocio
// -----------------------------------------------------------------------------------
// Esta clase representa la capa de negocio del sistema, encargada de gestionar la
// interacción con la base de datos Firestore de Firebase.
//
// Funcionalidades principales:
//  - Gestión de usuarios (crear, obtener, actualizar, eliminar)
//  - Gestión de nodos (crear, obtener, actualizar, eliminar)
//  - Registro, actualización y eliminación de mediciones
//  - Vinculación y desvinculación de nodos con usuarios
//  - Envío de notificaciones (placeholder)
// -----------------------------------------------------------------------------------

const admin = require("firebase-admin");
const functions = require("firebase-functions");

class LogicaDeNegocio {

  //------------------------------------------------------------------------------------
  // Atributos privados:
  //  - #db: referencia a la base de datos Firestore
  //  - #admin: instancia de Firebase Admin SDK
  //------------------------------------------------------------------------------------
  #db;
  #admin;

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // constructor() --> (inicializa Firebase y obtiene referencia a Firestore)
  // -->
  // objeto LogicaDeNegocio
  //------------------------------------------------------------------------------------
  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.#admin = admin;
    this.#db = admin.firestore();
  }

  // ===================================================================================
  // =============================== MÉTODOS DE MEDICIONES ==============================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // idNodo, tipoSensor, valor, opciones (entrada)
  // opciones: { autoCrearSensor: boolean } (opcional) - por defecto true
  // -->
  // guardarMedida() --> (crea un nuevo documento de medición dentro del sensor indicado)
  // - Verifica existencia del nodo.
  // - Verifica existencia del sensor; si no existe y autoCrearSensor=true lo crea.
  // - Crea una medición en nodos/{idNodo}/sensores/{sensorId}/mediciones/{idMedicion}
  // - NO escribe sensores como objeto embebido en el documento nodo (ahora están en subcolección)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async guardarMedida(idNodo, tipoSensor, valor, opciones = { autoCrearSensor: true }) {
    try {
      // Verificar que el nodo existe
      const nodoRef = this.#db.collection("nodos").doc(idNodo);
      const nodoDoc = await nodoRef.get();
      if (!nodoDoc.exists) {
        throw new Error(`Nodo no encontrado: ${idNodo}`);
      }

      // Preparar referencia al sensor
      const sensorId = `sensor_${tipoSensor.toLowerCase()}`;
      const sensorRef = nodoRef.collection("sensores").doc(sensorId);
      let sensorDoc = await sensorRef.get();

      // Si no existe el sensor y está permitida la autocreación, lo creamos
      if (!sensorDoc.exists) {
        if (opciones && opciones.autoCrearSensor === false) {
          throw new Error(`Sensor no encontrado en el nodo: ${tipoSensor}`);
        } else {
          functions.logger.info(`⚠️ Sensor no encontrado en nodo ${idNodo}. Creando sensor '${tipoSensor}' automáticamente.`);
          await sensorRef.set({
            tipo: tipoSensor,
            creadoEn: this.#admin.firestore.Timestamp.now(),
          });
          sensorDoc = await sensorRef.get();
        }
      }

      // Crear ID de medición basado en timestamp (formato legible y ordenable)
      const fechaHora = new Date().toISOString();
      const idMedicion = fechaHora.replace(/[-:.TZ]/g, "").slice(0, 15);

      // Crear documento de medición
      await sensorRef.collection("mediciones").doc(idMedicion).set({
        valor,
        fechaHora: this.#admin.firestore.Timestamp.now(),
      });

      // Nota: no actualizamos un campo 'sensores.tipo' dentro del documento nodo,
      // porque en el nuevo diseño los sensores están como subcolección.
      // Si quieres mantener un resumen rápido en el documento nodo, descomenta y adapta:
      // await nodoRef.update({ [`ultimo.${tipoSensor}`]: { valor, fechaHora: this.#admin.firestore.Timestamp.now() } });

      functions.logger.info(`✅ Medición registrada para ${tipoSensor} en nodo ${idNodo} (sensorId: ${sensorId}, medicion: ${idMedicion})`);
    } catch (error) {
      functions.logger.error("❌ Error en guardarMedida:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, tipoSensor (entrada)
  // -->
  // obtenerMedida() --> (devuelve la última medición registrada para un sensor del nodo)
  // - Busca en nodos/{idNodo}/sensores/sensor_{tipoSensor}/mediciones ordenando por fechaHora
  // - Devuelve objeto { id, valor, fechaHora } o null si no hay mediciones
  // -->
  // objeto con datos de la medición o null
  //------------------------------------------------------------------------------------
  async obtenerMedida(idNodo, tipoSensor) {
    try {
      const medicionesRef = this.#db
        .collection("nodos")
        .doc(idNodo)
        .collection("sensores")
        .doc(`sensor_${tipoSensor.toLowerCase()}`)
        .collection("mediciones");

      const snapshot = await medicionesRef.orderBy("fechaHora", "desc").limit(1).get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      functions.logger.error("❌ Error en obtenerMedida:", error);
      return null;
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, tipoSensor, idMedicion, nuevosDatos (entrada)
  // -->
  // actualizarMedida() --> (actualiza los valores de una medición específica)
  // - Actualiza campos dentro de nodos/{idNodo}/sensores/{sensorId}/mediciones/{idMedicion}
  // - No cambia la estructura de la base de datos, solo los campos del documento medición
  // -->
  // void
  //------------------------------------------------------------------------------------
  async actualizarMedida(idNodo, tipoSensor, idMedicion, nuevosDatos) {
    try {
      await this.#db
        .collection("nodos")
        .doc(idNodo)
        .collection("sensores")
        .doc(`sensor_${tipoSensor.toLowerCase()}`)
        .collection("mediciones")
        .doc(idMedicion)
        .update(nuevosDatos);

      functions.logger.info(`✅ Medición ${idMedicion} actualizada en nodo ${idNodo}`);
    } catch (error) {
      functions.logger.error("❌ Error en actualizarMedida:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, tipoSensor, idMedicion (entrada)
  // -->
  // eliminarMedida() --> (elimina una medición específica del sensor del nodo)
  // - Borra el documento nodos/{idNodo}/sensores/{sensorId}/mediciones/{idMedicion}
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarMedida(idNodo, tipoSensor, idMedicion) {
    try {
      await this.#db
        .collection("nodos")
        .doc(idNodo)
        .collection("sensores")
        .doc(`sensor_${tipoSensor.toLowerCase()}`)
        .collection("mediciones")
        .doc(idMedicion)
        .delete();

      functions.logger.info(`🗑️ Medición ${idMedicion} eliminada del sensor ${tipoSensor} en nodo ${idNodo}`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarMedida:", error);
    }
  }

// ===================================================================================
// =============================== MÉTODOS DE USUARIOS ===============================
// ===================================================================================

//------------------------------------------------------------------------------------
// nombre, correo, rol, password (entrada)
// -->
// crearUsuario() --> (crea un nuevo usuario en Authentication y Firestore)
// - Crea usuario en Authentication con correo y contraseña
// - Guarda documento en 'usuarios' con array vacío 'nodos' para relacionar nodos creados
// - Devuelve uid del usuario creado
// -->
// id del usuario creado
//------------------------------------------------------------------------------------
async crearUsuario(nombre, correo, rol, password) {
  try {
    // Crear usuario en Authentication
    const userRecord = await this.#admin.auth().createUser({
      email: correo,
      password: password,
      displayName: nombre,
    });

    // Crear usuario en Firestore
    const nuevoUsuario = {
      uid: userRecord.uid,
      nombre,
      correo,
      rol,
      nodos: [],
      creadoEn: this.#admin.firestore.Timestamp.now(),
    };

    await this.#db.collection("usuarios").doc(userRecord.uid).set(nuevoUsuario);
    functions.logger.info(`✅ Usuario creado correctamente: ${userRecord.uid}`);
    return userRecord.uid;
  } catch (error) {
    functions.logger.error("❌ Error en crearUsuario:", error);
    return null;
  }
}

//------------------------------------------------------------------------------------
// idUsuario (entrada)
// -->
// obtenerUsuario() --> (devuelve los datos de un usuario específico)
// - Lee documento en 'usuarios/{idUsuario}'
// -->
// objeto con datos del usuario o null
//------------------------------------------------------------------------------------
async obtenerUsuario(idUsuario) {
  try {
    const doc = await this.#db.collection("usuarios").doc(idUsuario).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    functions.logger.error("❌ Error en obtenerUsuario:", error);
    return null;
  }
}

//------------------------------------------------------------------------------------
// idUsuario, datos (entrada)
// datos puede incluir: nombre, correo, password, rol
// -->
// actualizarUsuario() --> (modifica los datos de un usuario existente en Auth y Firestore)
// - Actualiza correo y contraseña en Authentication si se proporcionan
// - Actualiza otros campos en Firestore
// -->
// void
//------------------------------------------------------------------------------------
async actualizarUsuario(idUsuario, datos) {
  try {
    // Actualizar Authentication si cambia correo, password o nombre
    const updateAuth = {};
    if (datos.correo) updateAuth.email = datos.correo;
    if (datos.password) updateAuth.password = datos.password;
    if (datos.nombre) updateAuth.displayName = datos.nombre;

    if (Object.keys(updateAuth).length > 0) {
      await this.#admin.auth().updateUser(idUsuario, updateAuth);
    }

    // Eliminar password antes de actualizar Firestore
    if (datos.password) delete datos.password;

    // Actualizar Firestore
    await this.#db.collection("usuarios").doc(idUsuario).update(datos);
    functions.logger.info(`✅ Usuario actualizado: ${idUsuario}`);
  } catch (error) {
    functions.logger.error("❌ Error en actualizarUsuario:", error);
  }
}

//------------------------------------------------------------------------------------
// idUsuario, idNodo (entrada)
// -->
// vincularNodoAUsuario() --> (agrega un nodo al arreglo de nodos del usuario)
// - Usa FieldValue.arrayUnion para evitar duplicados
// -->
// void
//------------------------------------------------------------------------------------
async vincularNodoAUsuario(idUsuario, idNodo) {
  try {
    const usuarioRef = this.#db.collection("usuarios").doc(idUsuario);
    await usuarioRef.update({
      nodos: this.#admin.firestore.FieldValue.arrayUnion(idNodo),
    });
    functions.logger.info(`🔗 Nodo ${idNodo} vinculado a usuario ${idUsuario}`);
  } catch (error) {
    functions.logger.error("❌ Error en vincularNodoAUsuario:", error);
  }
}

//------------------------------------------------------------------------------------
// idUsuario, idNodo (entrada)
// -->
// desvincularNodoDeUsuario() --> (remueve un nodo del arreglo de nodos del usuario)
// - Usa FieldValue.arrayRemove para eliminar la referencia
// -->
// void
//------------------------------------------------------------------------------------
async desvincularNodoDeUsuario(idUsuario, idNodo) {
  try {
    const usuarioRef = this.#db.collection("usuarios").doc(idUsuario);
    await usuarioRef.update({
      nodos: this.#admin.firestore.FieldValue.arrayRemove(idNodo),
    });
    functions.logger.info(`🔓 Nodo ${idNodo} desvinculado de usuario ${idUsuario}`);
  } catch (error) {
    functions.logger.error("❌ Error en desvincularNodoDeUsuario:", error);
  }
}

//------------------------------------------------------------------------------------
// idUsuario (entrada)
// -->
// eliminarUsuario() --> (elimina un usuario de Authentication y Firestore, y todos sus nodos)
// - Lee los nodos referenciados en usuarios/{idUsuario}.nodos y llama eliminarNodo()
// - Elimina usuario en Authentication
// - Elimina documento del usuario en Firestore
// -->
// void
//------------------------------------------------------------------------------------
async eliminarUsuario(idUsuario) {
  try {
    const usuarioRef = this.#db.collection("usuarios").doc(idUsuario);
    const usuarioDoc = await usuarioRef.get();

    if (!usuarioDoc.exists) {
      functions.logger.warn(`⚠️ Usuario no encontrado: ${idUsuario}`);
      return;
    }

    // Eliminar todos los nodos asociados
    const nodosSnapshot = await this.#db.collection("nodos").where("propietarioId", "==", idUsuario).get();
    for (const nodoDoc of nodosSnapshot.docs) {
      await this.eliminarNodo(nodoDoc.id);
    }

    // Eliminar usuario en Authentication
    await this.#admin.auth().deleteUser(idUsuario);

    // Eliminar usuario en Firestore
    await usuarioRef.delete();
    functions.logger.info(`🗑️ Usuario ${idUsuario} eliminado de Authentication y Firestore`);
  } catch (error) {
    functions.logger.error("❌ Error en eliminarUsuario:", error);
  }
}


  // ===================================================================================
  // ================================ MÉTODOS DE NODOS =================================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // nombre, ubicacion, propietarioId (entrada)
  // -->
  // crearNodo() --> (crea un nuevo nodo y lo vincula al propietario)
  // - Crea documento en 'nodos' y añade el id al array 'usuarios/{propietarioId}.nodos'
  // -->
  // id del nodo creado
  //------------------------------------------------------------------------------------
  async crearNodo(nombre, ubicacion, propietarioId) {
    try {
      // Verificar existencia del usuario
      const usuarioDoc = await this.#db.collection("usuarios").doc(propietarioId).get();
      if (!usuarioDoc.exists) {
        throw new Error(`No se puede crear nodo: usuario no encontrado (${propietarioId})`);
      }

      const nuevoNodo = {
        propietarioId,
        nombre,
        ubicacion,
        creadoEn: this.#admin.firestore.Timestamp.now(),
      };

      const ref = await this.#db.collection("nodos").add(nuevoNodo);
      await this.vincularNodoAUsuario(propietarioId, ref.id);

      functions.logger.info(`✅ Nodo creado correctamente: ${ref.id}`);
      return ref.id;
    } catch (error) {
      functions.logger.error("❌ Error en crearNodo:", error);
      return null;
    }
  }


  //------------------------------------------------------------------------------------
  // idNodo, tipoSensor (entrada)
  // -->
  // crearSensor() --> (crea un nuevo sensor dentro del nodo especificado)
  // - Crea documento en nodos/{idNodo}/sensores/{sensorId} con campo 'tipo'
  // -->
  // id del sensor creado
  //------------------------------------------------------------------------------------
  async crearSensor(idNodo, tipoSensor) {
    try {
      const nodoDoc = await this.#db.collection("nodos").doc(idNodo).get();
      if (!nodoDoc.exists) {
        throw new Error(`No se puede crear sensor: nodo no encontrado (${idNodo})`);
      }

      const sensorId = `sensor_${tipoSensor.toLowerCase()}`;
      const sensorRef = this.#db
        .collection("nodos")
        .doc(idNodo)
        .collection("sensores")
        .doc(sensorId);

      await sensorRef.set({
        tipo: tipoSensor,
        creadoEn: this.#admin.firestore.Timestamp.now(),
      });

      functions.logger.info(`✅ Sensor '${tipoSensor}' creado en nodo ${idNodo}`);
      return sensorId;
    } catch (error) {
      functions.logger.error("❌ Error en crearSensor:", error);
      return null;
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo (entrada)
  // -->
  // obtenerNodo() --> (devuelve los datos de un nodo específico)
  // - Devuelve el documento nodos/{idNodo} (sin incluir subcolecciones)
  // -->
  // objeto con datos del nodo o null
  //------------------------------------------------------------------------------------
  async obtenerNodo(idNodo) {
    try {
      const doc = await this.#db.collection("nodos").doc(idNodo).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      functions.logger.error("❌ Error en obtenerNodo:", error);
      return null;
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, datos (entrada)
  // -->
  // actualizarNodo() --> (modifica los datos de un nodo existente)
  // - Actualiza campos del documento nodos/{idNodo}
  // -->
  // void
  //------------------------------------------------------------------------------------
  async actualizarNodo(idNodo, datos) {
    try {
      await this.#db.collection("nodos").doc(idNodo).update(datos);
      functions.logger.info(`✅ Nodo actualizado: ${idNodo}`);
    } catch (error) {
      functions.logger.error("❌ Error en actualizarNodo:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, tipoSensor (entrada)
  // -->
  // eliminarSensor() --> (elimina un sensor y todas sus mediciones del nodo)
  // - Borra todas las mediciones en nodos/{idNodo}/sensores/{sensorId}/mediciones y luego el documento sensor
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarSensor(idNodo, tipoSensor) {
    try {
      const sensorId = `sensor_${tipoSensor.toLowerCase()}`;
      const sensorRef = this.#db
        .collection("nodos")
        .doc(idNodo)
        .collection("sensores")
        .doc(sensorId);

      // Eliminar todas las mediciones del sensor
      const medicionesSnapshot = await sensorRef.collection("mediciones").get();
      for (const medicionDoc of medicionesSnapshot.docs) {
        await medicionDoc.ref.delete();
      }

      // Eliminar el documento del sensor
      await sensorRef.delete();

      functions.logger.info(`🗑️ Sensor '${tipoSensor}' eliminado del nodo ${idNodo}`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarSensor:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo (entrada)
  // -->
  // eliminarNodo() --> (elimina un nodo y todos sus sensores y mediciones asociadas)
  // - Recorre nodos/{idNodo}/sensores, elimina cada medición y cada sensor, y finalmente el nodo
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarNodo(idNodo) {
    try {
      const nodoRef = this.#db.collection("nodos").doc(idNodo);
      const sensoresSnapshot = await nodoRef.collection("sensores").get();

      // Eliminar todos los sensores y sus mediciones
      for (const sensorDoc of sensoresSnapshot.docs) {
        const medicionesSnapshot = await sensorDoc.ref.collection("mediciones").get();
        for (const medicionDoc of medicionesSnapshot.docs) {
          await medicionDoc.ref.delete();
        }
        await sensorDoc.ref.delete();
      }

      // Finalmente eliminar el nodo
      await nodoRef.delete();

      functions.logger.info(`🗑️ Nodo y sus sensores eliminados correctamente: ${idNodo}`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarNodo:", error);
    }
  }

  // ===================================================================================
  // ============================== MÉTODO DE NOTIFICACIONES ===========================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // mensaje (entrada)
  // -->
  // enviarNotificacion() --> (simula el envío de una notificación)
  // - Placeholder: usa functions.logger para simular notificaciones
  // -->
  // void
  //------------------------------------------------------------------------------------
  async enviarNotificacion(mensaje) {
    try {
      functions.logger.info("🔔 Notificación enviada:", mensaje);
    } catch (error) {
      functions.logger.error("❌ Error en enviarNotificacion:", error);
    }
  }
} // class LogicaDeNegocio

// -----------------------------------------------------------------------------------
// Exportación del módulo
// -----------------------------------------------------------------------------------
module.exports = LogicaDeNegocio;

// -----------------------------------------------------------------------------------
// Fin del fichero LogicaDeNegocio.js
// -----------------------------------------------------------------------------------

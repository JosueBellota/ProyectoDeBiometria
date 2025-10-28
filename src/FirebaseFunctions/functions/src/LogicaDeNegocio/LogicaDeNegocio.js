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
//  - Registro y actualización de medidas (en el documento del nodo)
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
  // idNodo, medidas (entrada)
  // medidas: objeto con los campos { co2, temperatura, humedad } (pueden ser null)
  // -->
  // guardarMedida() --> (actualiza los valores de sensores y la marca de tiempo)
  // - Verifica existencia del nodo.
  // - Actualiza los campos no nulos en nodos/{idNodo}/sensores.
  // - Registra la hora de la última actualización en el campo 'tiempo'.
  // -->
  // void
  //------------------------------------------------------------------------------------
  async guardarMedida(idNodo, medidas) {
    try {
      const nodoRef = this.#db.collection("nodos").doc(idNodo);
      const nodoDoc = await nodoRef.get();

      if (!nodoDoc.exists) {
        throw new Error(`Nodo no encontrado: ${idNodo}`);
      }

      // Validar estructura de medidas
      const sensores = nodoDoc.data().sensores || {};
      const nuevasMedidas = { ...sensores };

      // Actualizar solo los valores no nulos
      for (const [clave, valor] of Object.entries(medidas)) {
        nuevasMedidas[clave] = valor !== undefined ? valor : sensores[clave] ?? null;
      }

      // Actualizar el nodo completo
      await nodoRef.update({
        sensores: nuevasMedidas,
        tiempo: this.#admin.firestore.Timestamp.now(),
      });

      functions.logger.info(`✅ Medidas actualizadas para nodo ${idNodo}:`, medidas);
    } catch (error) {
      functions.logger.error("❌ Error en guardarMedida:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo (entrada)
  // -->
  // obtenerMedidas() --> (devuelve las medidas actuales de un nodo)
  // - Devuelve el objeto sensores y la marca de tiempo
  // -->
  // objeto { sensores, tiempo } o null
  //------------------------------------------------------------------------------------
  async obtenerMedidas(idNodo) {
    try {
      const doc = await this.#db.collection("nodos").doc(idNodo).get();
      if (!doc.exists) return null;

      const data = doc.data();
      return { sensores: data.sensores || {}, tiempo: data.tiempo || null };
    } catch (error) {
      functions.logger.error("❌ Error en obtenerMedidas:", error);
      return null;
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
  // - Guarda documento en 'usuarios' con array vacío 'nodos'
  // - Devuelve uid del usuario creado
  // -->
  // id del usuario creado
  //------------------------------------------------------------------------------------
  async crearUsuario(nombre, correo, rol, password) {
    try {
      const userRecord = await this.#admin.auth().createUser({
        email: correo,
        password,
        displayName: nombre,
      });

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
  // -->
  // actualizarUsuario() --> (modifica los datos de un usuario existente)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async actualizarUsuario(idUsuario, datos) {
    try {
      const updateAuth = {};
      if (datos.correo) updateAuth.email = datos.correo;
      if (datos.password) updateAuth.password = datos.password;
      if (datos.nombre) updateAuth.displayName = datos.nombre;

      if (Object.keys(updateAuth).length > 0) {
        await this.#admin.auth().updateUser(idUsuario, updateAuth);
      }

      if (datos.password) delete datos.password;
      await this.#db.collection("usuarios").doc(idUsuario).update(datos);
      functions.logger.info(`✅ Usuario actualizado: ${idUsuario}`);
    } catch (error) {
      functions.logger.error("❌ Error en actualizarUsuario:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idUsuario, idNodo (entrada)
  // -->
  // vincularNodoAUsuario() --> (agrega un nodo al arreglo 'nodos' del usuario)
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
  // desvincularNodoDeUsuario() --> (elimina el idNodo del arreglo 'nodos')
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
  // eliminarUsuario() --> (elimina usuario y sus nodos)
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

      const nodosSnapshot = await this.#db.collection("nodos")
        .where("propietarioId", "==", idUsuario)
        .get();

      for (const nodoDoc of nodosSnapshot.docs) {
        await this.eliminarNodo(nodoDoc.id);
      }

      await this.#admin.auth().deleteUser(idUsuario);
      await usuarioRef.delete();
      functions.logger.info(`🗑️ Usuario ${idUsuario} eliminado correctamente`);
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
  // crearNodo() --> (crea un nuevo nodo con sensores por defecto en null)
  // -->
  // id del nodo creado
  //------------------------------------------------------------------------------------
  async crearNodo(nombre, ubicacion, propietarioId) {
    try {
      const usuarioDoc = await this.#db.collection("usuarios").doc(propietarioId).get();
      if (!usuarioDoc.exists) {
        throw new Error(`Usuario no encontrado (${propietarioId})`);
      }

      const nuevoNodo = {
        propietarioId,
        nombre,
        ubicacion,
        sensores: {
          co2: null,
          temperatura: null,
          humedad: null,
        },
        tiempo: this.#admin.firestore.Timestamp.now(),
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
  // idNodo (entrada)
  // -->
  // obtenerNodo() --> (devuelve los datos de un nodo)
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
  // actualizarNodo() --> (modifica datos del nodo)
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
  // idNodo (entrada)
  // -->
  // eliminarNodo() --> (elimina el nodo de Firestore)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarNodo(idNodo) {
    try {
      await this.#db.collection("nodos").doc(idNodo).delete();
      functions.logger.info(`🗑️ Nodo eliminado correctamente: ${idNodo}`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarNodo:", error);
    }
  }

  // ===================================================================================
  // ============================== MÉTODO DE NOTIFICACIONES ===========================
  // ===================================================================================
  async enviarNotificacion(mensaje) {
    try {
      functions.logger.info("🔔 Notificación enviada:", mensaje);
    } catch (error) {
      functions.logger.error("❌ Error en enviarNotificacion:", error);
    }
  }
}

module.exports = LogicaDeNegocio;

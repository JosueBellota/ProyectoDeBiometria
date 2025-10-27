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
  // idNodo, sensorData (entrada)
  // -->
  // guardarMedida() --> (crea un nuevo documento de medición en Firestore)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async guardarMedida(idNodo, sensorData) {
    try {
      const fechaHora = new Date().toISOString();
      const idMedicion = `medicion_${fechaHora.replace(/[-:.TZ]/g, "").slice(0, 15)}`;

      const doc = {
        temperatura: sensorData.temperatura,
        co2: sensorData.co2,
        fechaHora: this.#admin.firestore.Timestamp.now(),
      };

      await this.#db
        .collection("datosSensores")
        .doc(idNodo)
        .collection(idMedicion)
        .doc("datos")
        .set(doc);
    } catch (error) {
      functions.logger.error("❌ Error en guardarMedida:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo (entrada)
  // -->
  // obtenerMedida() --> (devuelve la última medición registrada para el nodo)
  // -->
  // objeto con datos de la medición o null
  //------------------------------------------------------------------------------------
  async obtenerMedida(idNodo) {
    try {
      const medicionesRef = this.#db.collection("datosSensores").doc(idNodo);
      const subcollections = await medicionesRef.listCollections();

      if (subcollections.length === 0) {
        return null;
      }

      const ultimaColeccion = subcollections.sort((a, b) =>
        b.id.localeCompare(a.id)
      )[0];
      const doc = await ultimaColeccion.doc("datos").get();

      return doc.exists ? doc.data() : null;
    } catch (error) {
      functions.logger.error("❌ Error en obtenerMedida:", error);
      return null;
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, idMedicion, nuevosDatos (entrada)
  // -->
  // actualizarMedida() --> (actualiza los valores de una medición específica)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async actualizarMedida(idNodo, idMedicion, nuevosDatos) {
    try {
      await this.#db
        .collection("datosSensores")
        .doc(idNodo)
        .collection(idMedicion)
        .doc("datos")
        .update(nuevosDatos);
    } catch (error) {
      functions.logger.error("❌ Error en actualizarMedida:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo, idMedicion (entrada)
  // -->
  // eliminarMedida() --> (elimina una medición específica del nodo)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarMedida(idNodo, idMedicion) {
    try {
      await this.#db
        .collection("datosSensores")
        .doc(idNodo)
        .collection(idMedicion)
        .doc("datos")
        .delete();
    } catch (error) {
      functions.logger.error("❌ Error en eliminarMedida:", error);
    }
  }

  // ===================================================================================
  // ================================ MÉTODOS DE USUARIOS ===============================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // nombre, correo, contraseña, rol (entrada)
  // -->
  // crearUsuario() --> (crea un nuevo usuario en Firebase Auth y Firestore)
  // -->
  // objeto con exito y uid del usuario creado
  //------------------------------------------------------------------------------------
  async crearUsuario(nombre, correo, contraseña, rol = "ciudadano") {
    try {
      // Crear usuario en Firebase Authentication
      const userRecord = await this.#admin.auth().createUser({
        email: correo,
        password: contraseña,
        displayName: nombre,
      });

      // Crear documento en Firestore con el UID
      const nuevoUsuario = {
        nombre,
        correo,
        rol,
        nodos: [],
        creadoEn: this.#admin.firestore.Timestamp.now(),
      };

      await this.#db.collection("usuarios").doc(userRecord.uid).set(nuevoUsuario);

      functions.logger.info(`✅ Usuario creado correctamente: ${correo}`);
      return { exito: true, uid: userRecord.uid };
    } catch (error) {
      functions.logger.error("❌ Error en crearUsuario:", error);
      return { exito: false, error: error.message };
    }
  }

  //------------------------------------------------------------------------------------
  // idUsuario (entrada)
  // -->
  // obtenerUsuario() --> (devuelve los datos del usuario indicado)
  // -->
  // objeto con datos del usuario o null
  //------------------------------------------------------------------------------------
  async obtenerUsuario(idUsuario) {
    try {
      const doc = await this.#db.collection("usuarios").doc(idUsuario).get();
      if (!doc.exists) return null;

      const usuario = doc.data();

      // También obtener datos de Firebase Auth (correo y nombre actualizados)
      const authUser = await this.#admin.auth().getUser(idUsuario).catch(() => null);
      if (authUser) {
        usuario.correo = authUser.email;
        usuario.nombre = authUser.displayName;
      }

      return usuario;
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
      await this.#db.collection("usuarios").doc(idUsuario).update(datos);

      // Actualizar datos en Auth si corresponde
      const updates = {};
      if (datos.nombre) updates.displayName = datos.nombre;
      if (datos.correo) updates.email = datos.correo;

      if (Object.keys(updates).length > 0) {
        await this.#admin.auth().updateUser(idUsuario, updates);
      }

      functions.logger.info(`✅ Usuario actualizado: ${idUsuario}`);
    } catch (error) {
      functions.logger.error("❌ Error en actualizarUsuario:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idUsuario (entrada)
  // -->
  // eliminarUsuario() --> (elimina un usuario tanto de Firestore como de Auth)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarUsuario(idUsuario) {
    try {
      await this.#db.collection("usuarios").doc(idUsuario).delete();
      await this.#admin.auth().deleteUser(idUsuario);

      functions.logger.info(`🗑️ Usuario eliminado: ${idUsuario}`);
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
  // -->
  // id del nodo creado
  //------------------------------------------------------------------------------------
  async crearNodo(nombre, ubicacion, propietarioId) {
    try {
      const nuevoNodo = {
        propietarioId,
        nombre,
        ubicacion,
        sensores: { temperatura: null, co2: null },
      };

      const ref = await this.#db.collection("nodos").add(nuevoNodo);
      await this.vincularNodoAUsuario(propietarioId, ref.id);
      return ref.id;
    } catch (error) {
      functions.logger.error("❌ Error en crearNodo:", error);
      return null;
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo (entrada)
  // -->
  // obtenerNodo() --> (devuelve los datos de un nodo específico)
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
  // -->
  // void
  //------------------------------------------------------------------------------------
  async actualizarNodo(idNodo, datos) {
    try {
      await this.#db.collection("nodos").doc(idNodo).update(datos);
    } catch (error) {
      functions.logger.error("❌ Error en actualizarNodo:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idNodo (entrada)
  // -->
  // eliminarNodo() --> (elimina un nodo de la base de datos)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async eliminarNodo(idNodo) {
    try {
      await this.#db.collection("nodos").doc(idNodo).delete();
    } catch (error) {
      functions.logger.error("❌ Error en eliminarNodo:", error);
    }
  }

  // ===================================================================================
  // =============================== MÉTODOS DE VÍNCULO ================================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // idUsuario, idNodo (entrada)
  // -->
  // vincularNodoAUsuario() --> (agrega un nodo al array de nodos del usuario)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async vincularNodoAUsuario(idUsuario, idNodo) {
    try {
      const refUsuario = this.#db.collection("usuarios").doc(idUsuario);
      await refUsuario.update({
        nodos: this.#admin.firestore.FieldValue.arrayUnion(idNodo),
      });
    } catch (error) {
      functions.logger.error("❌ Error en vincularNodoAUsuario:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // idUsuario, idNodo (entrada)
  // -->
  // desvincularNodoDelUsuario() --> (elimina un nodo del array de nodos del usuario)
  // -->
  // void
  //------------------------------------------------------------------------------------
  async desvincularNodoDelUsuario(idUsuario, idNodo) {
    try {
      const refUsuario = this.#db.collection("usuarios").doc(idUsuario);
      await refUsuario.update({
        nodos: this.#admin.firestore.FieldValue.arrayRemove(idNodo),
      });
    } catch (error) {
      functions.logger.error("❌ Error en desvincularNodoDelUsuario:", error);
    }
  }

  // ===================================================================================
  // ============================== MÉTODO DE NOTIFICACIONES ===========================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // mensaje (entrada)
  // -->
  // enviarNotificacion() --> (simula el envío de una notificación)
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

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
  // nombreNodo: texto, propietarioId: texto,
  // medidas: objeto { co2: número, temperatura: número, humedad: número }
  // -->
  // guardarMedidas() --> guarda mediciones en el nodo correspondiente
  //------------------------------------------------------------------------------------
  async guardarMedidas(nombreNodo, propietarioId, medidas) {
    try {
      const nodo = await this.obtenerNodo(nombreNodo, propietarioId);
      if (!nodo) throw new Error(`Nodo "${nombreNodo}" no encontrado para el propietario ${propietarioId}`);

      const nodoRef = this.#db.collection("nodos").doc(nodo.id);
      const sensores = nodo.sensores || {};
      const nuevasMedidas = { ...sensores };

      for (const [clave, valor] of Object.entries(medidas)) {
        nuevasMedidas[clave] = valor !== undefined ? valor : sensores[clave] ?? null;
      }

      await nodoRef.update({
        sensores: nuevasMedidas,
        tiempo: this.#admin.firestore.Timestamp.now(),
      });

      functions.logger.info(`✅ Medidas actualizadas en nodo "${nombreNodo}":`, medidas);

      if (nuevasMedidas.co2 !== null && nuevasMedidas.co2 >= 100) {
        const mensaje = `⚠️ CO₂ elevado en nodo "${nombreNodo}". Valor: ${nuevasMedidas.co2}`;
        await this.enviarNotificacion(mensaje, "rojo", propietarioId);
      }

    } catch (error) {
      functions.logger.error("❌ Error en guardarMedidas:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // nombreNodo: texto, propietarioId: texto
  // -->
  // obtenerMedidas() --> devuelve las medidas actuales del nodo correspondiente
  // -->
  // - Busca el nodo por nombre + propietario
  // - Devuelve { sensores, tiempo } o null si no existe
  // {
  //   sensores:{                 
  //       co2: número,                   
  //       temperatura: número,           
  //       humedad: número               
  //   },
  //   tiempo: timestamp                 
  // }
  //
  //------------------------------------------------------------------------------------
  async obtenerMedidas(nombreNodo, propietarioId) {
    try {
      const nodo = await this.obtenerNodo(nombreNodo, propietarioId);
      if (!nodo) {
        functions.logger.warn(`⚠️ Nodo "${nombreNodo}" no encontrado para el propietario ${propietarioId}`);
        return null;
      }

      const sensores = nodo.sensores || {};
      const tiempo = nodo.tiempo || null;

      return { sensores, tiempo };

    } catch (error) {
      functions.logger.error("❌ Error en obtenerMedidas:", error);
      return null;
    }
  }

  // ===================================================================================
  // =============================== MÉTODOS DE USUARIOS ===============================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // nombre: texto, correo: texto, rol: texto, password: texto
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
      monedas: 0,           
      premios: [],           
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
  // idUsuario (entrada)
  // -->
  // eliminarUsuario() --> elimina usuario, sus nodos y su cuenta de Authentication
  //------------------------------------------------------------------------------------
  async eliminarUsuario(idUsuario) {
    try {
      const usuarioRef = this.#db.collection("usuarios").doc(idUsuario);
      const usuarioDoc = await usuarioRef.get();

      if (!usuarioDoc.exists) {
        functions.logger.warn(`⚠️ Usuario no encontrado: ${idUsuario}`);
        return;
      }

      // Eliminar todos los nodos del usuario
      const nodosSnapshot = await this.#db.collection("nodos")
        .where("propietarioId", "==", idUsuario)
        .get();

      for (const nodoDoc of nodosSnapshot.docs) {
        await this.eliminarNodo(nodoDoc.id);
      }

      // Intentar eliminar usuario de Authentication
      try {
        await this.#admin.auth().deleteUser(idUsuario);
      } catch (authError) {
        functions.logger.warn(`⚠️ Usuario ${idUsuario} no encontrado en Authentication`);
      }

      // Finalmente eliminar documento en Firestore
      await usuarioRef.delete();
      functions.logger.info(`🗑️ Usuario ${idUsuario} eliminado correctamente`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarUsuario:", error);
    }
  }

  // ------------------------------------------------------------------------------------
  // obtenerUsuariosDesdeAdmin(idAdmin)
  // -->
  // [
  // {
  //   id: texto,                        
  //   uid: texto,                        
  //   nombre: texto,                     
  //   correo: texto,                    
  //   rol: texto,                        
  //   monedas: número,                   
  //   premios: array de texto,           
  //   creadoEn: timestamp,               
  // },
  // ...
  // ]
  // ------------------------------------------------------------------------------------
  async obtenerUsuariosDesdeAdmin(idAdmin) {
    try {
      const adminDoc = await this.#db.collection("usuarios").doc(idAdmin).get();

      if (!adminDoc.exists) {
        throw new Error(`Usuario admin no encontrado (${idAdmin})`);
      }

      const adminData = adminDoc.data();
      if (adminData.rol !== "admin") {
        throw new Error(`El usuario ${idAdmin} no tiene permisos de administrador`);
      }

      const snapshot = await this.#db.collection("usuarios").get();
      const usuarios = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      functions.logger.info(`✅ Usuario admin ${idAdmin} obtuvo lista de ${usuarios.length} usuarios`);
      return usuarios;
    } catch (error) {
      functions.logger.error("❌ Error en obtenerUsuariosDesdeAdmin:", error);
      return null;
    }
  }

  // ===================================================================================
  // ================================ MÉTODOS DE NODOS =================================
  // ===================================================================================

  //------------------------------------------------------------------------------------
  // nombre: texto, ubicacion: texto, propietarioId: texto
  // -->
  // crearNodo() --> crea nuevo nodo, pero si el propietario ya tiene un nodo
  // con ese nombre → ERROR
  //------------------------------------------------------------------------------------
  async crearNodo(nombre, ubicacion, propietarioId) {
    try {
      const existente = await this.obtenerNodo(nombre, propietarioId);
      if (existente) {
        throw new Error(`El propietario ${propietarioId} ya tiene un nodo llamado "${nombre}".`);
      }

      const nuevoNodo = {
        propietarioId,
        nombre,
        ubicacion,
        sensores: { co2: null, temperatura: null, humedad: null }, // cada uno: número o null
        tiempo: this.#admin.firestore.Timestamp.now(),
      };

      await this.#db.collection("nodos").add(nuevoNodo);

      functions.logger.info(`✅ Nodo creado: ${nombre} (${propietarioId})`);
      return true;

    } catch (error) {
      functions.logger.error("❌ Error en crearNodo:", error);
      throw error;
    }
  }

  //------------------------------------------------------------------------------------
  // nombre: texto, propietarioId: texto
  // -->
  // obtenerNodo() --> devuelve el nodo del propietario cuyo nombre coincida
  // -->
  // {
  //   id: texto,                          
  //   propietarioId: texto,               
  //   nombre: texto,                      
  //   ubicacion: texto,                   
  //   sensores: {                         
  //       co2: número,                    
  //       temperatura: número,            
  //       humedad: número                 
  //   },
  //   tiempo: timestamp                   
  // }
  // ------------------------------------------------------------------------------------
  async obtenerNodo(nombre, propietarioId) {
    try {
      const snapshot = await this.#db
        .collection("nodos")
        .where("nombre", "==", nombre)
        .where("propietarioId", "==", propietarioId)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };

    } catch (error) {
      functions.logger.error("❌ Error en obtenerNodo:", error);
      return null;
    }
  }

  // ------------------------------------------------------------------------------------
  // propietarioId: texto
  // -->
  // obtenerNodos(idPropietario)
  // -->
  // [
  //   {
  //     id: texto,                          
  //     propietarioId: texto,               
  //     nombre: texto,                      
  //     ubicacion: texto,                   
  //     sensores: {                         
  //         co2: número,                    
  //         temperatura: número,            
  //         humedad: número                 
  //     },
  //     tiempo: timestamp                   
  //   },
  //   ...
  // ]
  // ------------------------------------------------------------------------------------
  async obtenerNodos(idPropietario) {
    try {
      const snapshot = await this.#db
        .collection("nodos")
        .where("propietarioId", "==", idPropietario)
        .get();

      if (snapshot.empty) {
        functions.logger.warn(`⚠️ No se encontraron nodos para propietario ${idPropietario}`);
        return [];
      }

      const nodos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      functions.logger.info(`✅ Se encontraron ${nodos.length} nodo(s) para propietario ${idPropietario}`);
      return nodos;
    } catch (error) {
      functions.logger.error("❌ Error en obtenerNodo (por propietario):", error);
      return [];
    }
  }

  // ------------------------------------------------------------------------------------
  // nombreNodo: texto, propietarioId: texto, datos: objeto (campos a actualizar)
  // -->
  // actualizarNodo(nombreNodo, propietarioId, datos)
  // -->
  // {
  //   id: texto,                          
  //   propietarioId: texto,               
  //   nombre: texto,                      
  //   ubicacion: texto,                   
  //   sensores: {                         
  //       co2: número,                    
  //       temperatura: número,            
  //       humedad: número                 
  //   },
  //   tiempo: timestamp                   
  // }
  // ----------------------------------------------------------------------------------
  async actualizarNodo(nombreNodo, propietarioId, datos) {
    try {
      const nodo = await this.obtenerNodo(nombreNodo, propietarioId);
      if (!nodo) throw new Error(`Nodo "${nombreNodo}" no encontrado para el propietario ${propietarioId}`);

      await this.#db.collection("nodos").doc(nodo.id).update(datos);

      functions.logger.info(`✅ Nodo actualizado: ${nombreNodo} (${propietarioId})`);

    } catch (error) {
      functions.logger.error("❌ Error en actualizarNodo:", error);
    }
  }

  //------------------------------------------------------------------------------------
  // nombreNodo: texto, propietarioId: texto
  // -->
  // eliminarNodo() --> elimina el nodo de Firestore y lo desvincula de todos los usuarios
  //------------------------------------------------------------------------------------
  async eliminarNodo(nombreNodo, propietarioId) {
    try {
      const nodo = await this.obtenerNodo(nombreNodo, propietarioId);
      if (!nodo) return;

      await this.#db.collection("nodos").doc(nodo.id).delete();

      functions.logger.info(`🗑️ Nodo eliminado: "${nombreNodo}" (${nodo.id})`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarNodo:", error);
    }
  }


  // ------------------------------------------------------------------------------------
  // uid: texto
  // -->
  // generarTokenAutologin(uid)
  // -->
  // - Verifica que el usuario exista en Firebase Authentication
  // - Obtiene el rol desde los claims personalizados del usuario
  // - Genera un token personalizado válido para autologin
  // - Construye y devuelve un link de acceso automático
  // -->
  // ------------------------------------------------------------------------------------
  async generarTokenAutologin(uid) {
    try {
      // Verificar si el usuario existe en Firebase Auth
      const userRecord = await this.#admin.auth().getUser(uid);
      if (!userRecord) {
        functions.logger.warn(`⚠️ Usuario con UID ${uid} no encontrado en Firebase Auth`);
        return null;
      }

      // Obtener el rol desde los claims personalizados, si existen
      const rol = userRecord.customClaims?.rol || "usuario";
      const token = await this.#admin.auth().createCustomToken(uid, { rol });
      const link = `https://proyectodebiometria.web.app/autologin?token=${token}`;
      
      functions.logger.info(`🔑 Link autologin generado correctamente para UID: ${uid}`);
      return link;

    } catch (error) {
      functions.logger.error("❌ Error generando token autologin:", error);
      return null;
    }
  }

  // ------------------------------------------------------------------------------------
  // mensaje: texto, color: texto, topic: texto
  // -->
  // enviarNotificacion(mensaje, color, topic)
  // -->
  // {
  //   notification: {
  //     title: texto,
  //     body: texto
  //   },
  //   data: {
  //     mensaje: texto,
  //     color: texto
  //   },
  //   topic: texto
  // }
  // ------------------------------------------------------------------------------------

  async enviarNotificacion(mensaje, color, topic) {
    try {
      functions.logger.info("🔔 Enviando notificación:", { mensaje, color, topic });

      const payload = {
        notification: {
          title: "Alerta de CO₂",
          body: mensaje,
        },
        data: {
          mensaje,
          color,
        },
        topic: topic, 
      };
      await admin.messaging().send(payload);
      functions.logger.info("✅ Notificación enviada al topic:", topic);
    } catch (error) {
      functions.logger.error("❌ Error en enviarNotificacion:", error);
    }
  }


}

module.exports = LogicaDeNegocio;

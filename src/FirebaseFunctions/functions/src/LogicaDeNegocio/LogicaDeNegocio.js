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
//  - Gestión de lecturas de sensores (guardar, obtener, eliminar)
//  - Envío de notificaciones
// -----------------------------------------------------------------------------------

const admin = require("firebase-admin");
const functions = require("firebase-functions");
const geofire = require("geofire-common");

class LogicaDeNegocio {

  #db;
  #admin;

  constructor() {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.#admin = admin;
    this.#db = admin.firestore();
  }

  // ===================================================================================
  // =============================== MÉTODOS DE LECTURAS ===============================
  // ===================================================================================

  async GuardarLecturas(nombreNodo, propietarioId, lecturas, latitud, longitud) {
    try {
      const nodo = await this._obtenerNodoBasico(nombreNodo, propietarioId);
      if (!nodo) {
        throw new Error(`Nodo "${nombreNodo}" no encontrado para el propietario ${propietarioId}`);
      }

      const batch = this.#db.batch();
      const timestamp = this.#admin.firestore.Timestamp.now();
      let co2elevado = null;

      // Calcula el geohash para la ubicación de este lote de lecturas
      const hash = geofire.geohashForLocation([latitud, longitud]);

      lecturas.forEach((lectura) => {
        const lecturaRef = this.#db.collection("lecturas").doc();
        batch.set(lecturaRef, {
          id_nodo: nodo.id,
          tipo_sensor: lectura.tipo,
          valor: lectura.valor,
          latitud: latitud,
          longitud: longitud,
          timestamp: timestamp,
          geohash: hash, // Añadimos el geohash al documento
        });

        if (lectura.tipo === "co2" && lectura.valor >= 100) {
          co2elevado = lectura.valor;
        }
      });

      await batch.commit();
      functions.logger.info(`✅ ${lecturas.length} lecturas guardadas para el nodo "${nombreNodo}" con geohash ${hash}`);

      if (co2elevado !== null) {
        const mensaje = `⚠️ CO₂ elevado en nodo "${nombreNodo}". Valor: ${co2elevado}`;
        await this.enviarNotificacion(mensaje, "rojo", propietarioId);
      }

    } catch (error) {
      functions.logger.error("❌ Error en GuardarLecturas:", error);
      throw error;
    }
  }

  async obtenerLecturas(opciones = {}) {
    try {
      // Validar que al menos un filtro esté presente
      if (Object.keys(opciones).length === 0) {
        throw new Error("Se requiere al menos un filtro para obtener lecturas.");
      }
      // Validar que nombreNodo y propietarioId vengan juntos
      if ((opciones.nombreNodo && !opciones.propietarioId) || (!opciones.nombreNodo && opciones.propietarioId)) {
        throw new Error("Si se proporciona nombreNodo o propietarioId, el otro también es requerido.");
      }

      let lecturas = [];
      let consultaRealizada = false;

      // Estrategia 1: Búsqueda por Nodo (eficiente)
      if (opciones.nombreNodo && opciones.propietarioId) {
        const nodo = await this._obtenerNodoBasico(opciones.nombreNodo, opciones.propietarioId);
        if (!nodo) return [];

        const snapshot = await this.#db.collection("lecturas").where("id_nodo", "==", nodo.id).get();
        lecturas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        consultaRealizada = true;
      }
      // Estrategia 2: Búsqueda por Ubicación con Geohash (eficiente)
      else if (opciones.latitud !== undefined && opciones.longitud !== undefined && opciones.radio !== undefined) {
        const center = [opciones.latitud, opciones.longitud];
        const radiusInM = opciones.radio;

        // Obtener los límites de la consulta de geohash
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = [];

        // Realizar una consulta por cada límite
        for (const b of bounds) {
          const q = this.#db.collection("lecturas")
            .orderBy("geohash")
            .startAt(b[0])
            .endAt(b[1]);
          promises.push(q.get());
        }

        // Esperar a que todas las consultas se completen
        const snapshots = await Promise.all(promises);
        const matchingDocs = [];
        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            matchingDocs.push(doc.data());
          }
        }
        
        // Filtro final en memoria para asegurar que los puntos están dentro del círculo exacto
        lecturas = matchingDocs.filter(doc => {
            const distanceInKm = geofire.distanceBetween([doc.latitud, doc.longitud], center);
            const distanceInM = distanceInKm * 1000;
            return distanceInM <= radiusInM;
        });
        consultaRealizada = true;
      }

      if (!consultaRealizada) {
        throw new Error("La consulta de lecturas debe incluir un filtro por nodo o por ubicación.");
      }
      
      // --- Aplicar filtros secundarios en memoria (fecha) ---
      if (opciones.fechaInicio) {
        const fechaInicio = new Date(opciones.fechaInicio);
        lecturas = lecturas.filter(l => l.timestamp.toDate() >= fechaInicio);
      }
      if (opciones.fechaFin) {
        const fechaFin = new Date(opciones.fechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        lecturas = lecturas.filter(l => l.timestamp.toDate() <= fechaFin);
      }
      
      return lecturas.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

    } catch (error) {
      functions.logger.error("❌ Error en obtenerLecturas:", error);
      throw error;
    }
  }

  async eliminarLecturas(nombreNodo, propietarioId, opciones) {
    try {
      if (!opciones || Object.keys(opciones).length === 0) {
        throw new Error("Se requiere al menos un filtro para eliminar lecturas.");
      }

      const nodo = await this._obtenerNodoBasico(nombreNodo, propietarioId);
      if (!nodo) {
        throw new Error(`Nodo "${nombreNodo}" no encontrado para el propietario ${propietarioId}`);
      }

      let query = this.#db.collection("lecturas").where("id_nodo", "==", nodo.id);

      if (opciones.fechaInicio) {
        query = query.where("timestamp", ">=", opciones.fechaInicio);
      }
      if (opciones.fechaFin) {
        query = query.where("timestamp", "<=", opciones.fechaFin);
      }
      if (opciones.tipoSensor) {
        query = query.where("tipo_sensor", "==", opciones.tipoSensor);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        functions.logger.info(`ℹ️ No se encontraron lecturas para eliminar con los filtros proporcionados.`);
        return 0;
      }

      const batch = this.#db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      functions.logger.info(`🗑️ ${snapshot.size} lecturas eliminadas para el nodo "${nombreNodo}"`);
      return snapshot.size;

    } catch (error) {
      functions.logger.error("❌ Error en eliminarLecturas:", error);
      throw error;
    }
  }

  _haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // en metros
  }

  // ===================================================================================
  // =============================== MÉTODOS DE USUARIOS ===============================
  // ===================================================================================

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
        distancia: 0,
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

  async obtenerUsuario(idUsuario) {
    try {
      const doc = await this.#db.collection("usuarios").doc(idUsuario).get();
      if (doc.exists) {
        const usuarioData = doc.data();
        if (usuarioData.distancia === undefined) {
          usuarioData.distancia = 0;
        }
        return usuarioData;
      }
      return null;
    } catch (error) {
      functions.logger.error("❌ Error en obtenerUsuario:", error);
      return null;
    }
  }

  async actualizarUsuario(idUsuario, datos) {
    try {
      const usuarioRef = this.#db.collection("usuarios").doc(idUsuario);
      const usuarioDoc = await usuarioRef.get();

      if (!usuarioDoc.exists) {
        throw new Error(`Usuario con ID ${idUsuario} no encontrado`);
      }

      const datosActualizacion = { ...datos };
      delete datosActualizacion.uid;
      delete datosActualizacion.creadoEn;

      if (datos.correo && datos.correo !== usuarioDoc.data().correo) {
        await this.#admin.auth().updateUser(idUsuario, {
          email: datos.correo
        });
      }

      await usuarioRef.update(datosActualizacion);

      functions.logger.info(`✅ Usuario ${idUsuario} actualizado correctamente`);
      return true;

    } catch (error) {
      functions.logger.error("❌ Error en actualizarUsuario:", error);
      throw error;
    }
  }

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
      const usuarios = snapshot.docs.map((doc) => {
        const usuarioData = doc.data();
        if (usuarioData.distancia === undefined) {
          usuarioData.distancia = 0;
        }
        return {
          id: doc.id,
          ...usuarioData,
        };
      });

      functions.logger.info(`✅ Usuario admin ${idAdmin} obtuvo lista de ${usuarios.length} usuarios`);
      return usuarios;
    } catch (error) {
      functions.logger.error("❌ Error en obtenerUsuariosDesdeAdmin:", error);
      return null;
    }
  }

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
        await this.eliminarNodo(nodoDoc.data().nombre, idUsuario);
      }

      try {
        await this.#admin.auth().deleteUser(idUsuario);
      } catch (authError) {
        functions.logger.warn(`⚠️ Usuario ${idUsuario} no encontrado en Authentication`);
      }

      await usuarioRef.delete();
      functions.logger.info(`🗑️ Usuario ${idUsuario} eliminado correctamente`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarUsuario:", error);
    }
  }

  // ===================================================================================
  // ================================ MÉTODOS DE NODOS =================================
  // ===================================================================================

  async _obtenerNodoBasico(nombre, propietarioId) {
    const snapshot = await this.#db
      .collection("nodos")
      .where("nombre", "==", nombre)
      .where("propietarioId", "==", propietarioId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async crearNodo(nombre, propietarioId) {
    try {
      const existente = await this._obtenerNodoBasico(nombre, propietarioId);
      if (existente) {
        throw new Error(`El propietario ${propietarioId} ya tiene un nodo llamado "${nombre}".`);
      }

      const nuevoNodo = {
        propietarioId,
        nombre,
        creadoEn: this.#admin.firestore.Timestamp.now(),
      };

      await this.#db.collection("nodos").add(nuevoNodo);

      functions.logger.info(`✅ Nodo creado: ${nombre} (${propietarioId})`);
      return true;

    } catch (error) {
      functions.logger.error("❌ Error en crearNodo:", error);
      throw error;
    }
  }

  async obtenerNodo(nombre, propietarioId) {
    try {
      const nodoBasico = await this._obtenerNodoBasico(nombre, propietarioId);

      if (!nodoBasico) return null;

      // Llama a la nueva versión de obtenerLecturas sin filtros de fecha/ubicación
      // para obtener solo el último lote de mediciones, como hacía la lógica original.
      const lecturasRecientes = await this.obtenerLecturas({ 
        nombreNodo: nombre, 
        propietarioId: propietarioId 
      });

      const sensores = {};
      let tiempo = null;

      if (lecturasRecientes.length > 0) {
        tiempo = lecturasRecientes[0].timestamp;
        lecturasRecientes.forEach(lectura => {
          sensores[lectura.tipo_sensor] = lectura.valor;
        });
      }

      return {
        ...nodoBasico,
        sensores,
        tiempo,
      };

    } catch (error) {
      functions.logger.error("❌ Error en obtenerNodo:", error);
      return null;
    }
  }

  async obtenerNodos(idPropietario) {
    try {
      const nodosSnapshot = await this.#db
        .collection("nodos")
        .where("propietarioId", "==", idPropietario)
        .get();

      if (nodosSnapshot.empty) {
        return [];
      }

      const nodos = nodosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const nodosConLecturas = await Promise.all(
        nodos.map(async (nodo) => {
          const lecturasRecientes = await this.obtenerLecturas({ 
            nombreNodo: nodo.nombre, 
            propietarioId: nodo.propietarioId 
          });
          const sensores = {};
          let tiempo = null;

          if (lecturasRecientes.length > 0) {
            tiempo = lecturasRecientes[0].timestamp;
            lecturasRecientes.forEach(lectura => {
              sensores[lectura.tipo_sensor] = lectura.valor;
            });
          }
          
          return { ...nodo, sensores, tiempo };
        })
      );

      functions.logger.info(`✅ Se encontraron ${nodosConLecturas.length} nodo(s) para propietario ${idPropietario}`);
      return nodosConLecturas;

    } catch (error) {
      functions.logger.error("❌ Error en obtenerNodos (por propietario):", error);
      return [];
    }
  }

  async actualizarNodo(nombreNodo, propietarioId, datos) {
    try {
      const nodo = await this._obtenerNodoBasico(nombreNodo, propietarioId);
      if (!nodo) {
        throw new Error(`Nodo "${nombreNodo}" no encontrado para el propietario ${propietarioId}`);
      }

      const datosValidos = { ...datos };
      delete datosValidos.ubicacion;
      delete datosValidos.sensores;
      delete datosValidos.tiempo;

      await this.#db.collection("nodos").doc(nodo.id).update(datosValidos);

      functions.logger.info(`✅ Nodo actualizado: ${nombreNodo} (${propietarioId})`);

    } catch (error) {
      functions.logger.error("❌ Error en actualizarNodo:", error);
      throw error;
    }
  }

  async eliminarNodo(nombreNodo, propietarioId) {
    try {
      const nodo = await this._obtenerNodoBasico(nombreNodo, propietarioId);
      if (!nodo) {
        functions.logger.warn(`⚠️ Nodo a eliminar no encontrado: "${nombreNodo}"`);
        return;
      }

      const lecturasSnapshot = await this.#db.collection("lecturas").where("id_nodo", "==", nodo.id).get();
      if (!lecturasSnapshot.empty) {
        const batch = this.#db.batch();
        lecturasSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        functions.logger.info(`🗑️ ${lecturasSnapshot.size} lecturas eliminadas para el nodo "${nombreNodo}"`);
      }

      await this.#db.collection("nodos").doc(nodo.id).delete();

      functions.logger.info(`🗑️ Nodo principal eliminado: "${nombreNodo}" (${nodo.id})`);
    } catch (error) {
      functions.logger.error("❌ Error en eliminarNodo:", error);
      throw error;
    }
  }


  // ===================================================================================
  // ============================ AUTENTICACIÓN Y OTROS ==============================
  // ===================================================================================

  async generarTokenAutologin(uid) {
    try {
      const userRecord = await this.#admin.auth().getUser(uid);
      if (!userRecord) {
        functions.logger.warn(`⚠️ Usuario con UID ${uid} no encontrado en Firebase Auth`);
        return null;
      }

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

  async revocarSesion(uid) {
    try {
      await this.#admin.auth().revokeRefreshTokens(uid);

      functions.logger.info(`⛔ Sesión revocada correctamente para UID: ${uid}`);
      return true;

    } catch (error) {
      functions.logger.error("❌ Error en revocarSesion:", error);
      return false;
    }
  }

}

module.exports = LogicaDeNegocio;
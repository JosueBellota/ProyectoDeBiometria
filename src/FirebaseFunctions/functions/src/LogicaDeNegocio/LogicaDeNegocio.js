// -----------------------------------------------------------------------------------
// Fichero: LogicaDeNegocio.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Clase LogicaDeNegocio
// -----------------------------------------------------------------------------------
// Esta clase representa la capa de negocio del sistema, encargada de gestionar la
// lógica de interacción con la base de datos Firestore de Firebase. 
// 
// Funcionalidades principales:
//  - Inicializar Firebase (si no está inicializado).
//  - Guardar mediciones en la colección "medidas".
//  - Recuperar la última medición almacenada.
//
// El diseño está orientado a mantener separada la lógica de acceso a datos del resto
// del sistema (patrón de arquitectura por capas).
// -----------------------------------------------------------------------------------

const admin = require("firebase-admin");
const functions = require("firebase-functions");

class LogicaDeNegocio {
  // -----------------------------------------------------------------------------------
  // Atributos privados
  // -----------------------------------------------------------------------------------
  // #db    : referencia al servicio Firestore
  // #admin : referencia al objeto principal de administración de Firebase
  // -----------------------------------------------------------------------------------
  #db;
  #admin;

  // -----------------------------------------------------------------------------------
  // constructor()
  // -->
  // Inicializa Firebase si no está ya inicializado y obtiene las referencias
  // necesarias para interactuar con la base de datos.
  // -----------------------------------------------------------------------------------
  constructor() {
    // Inicializamos Firebase solo si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    this.#admin = admin;
    this.#db = admin.firestore();
  }

  // -----------------------------------------------------------------------------------
  // sensor: nombre del sensor (String)
  // valor : valor numérico leído (Number)
  // -->
  // guardarMedicion() --> (guarda un documento con los datos de la medición en Firestore)
  // -->
  // objeto de respuesta con estado de éxito y mensaje descriptivo
  //
  // En caso de error, no devuelve nada y registra el error en los logs de Firebase.
  // -----------------------------------------------------------------------------------
  async guardarMedicion(sensor, valor) {
    try {
      const doc = {
        nombre: sensor,
        valor: valor,
        timestamp: this.#admin.firestore.FieldValue.serverTimestamp(),
      };

      await this.#db.collection("medidas").add(doc);

      return { exito: true, mensaje: "Guardado correctamente en Firestore" };
    } catch (error) {
      functions.logger.error("❌ Error en guardarMedicion:", error);
      // No se devuelve nada en caso de error
    }
  }

  // -----------------------------------------------------------------------------------
  // Sin parámetros de entrada
  // -->
  // obtenerMedicion() --> (consulta la última medición guardada en la colección "medidas")
  // -->
  // objeto con los datos de la medición más reciente:
  //  {
  //    sensor : nombre del sensor (String)
  //    valor  : valor numérico leído (Number)
  //    tiempo : marca temporal del servidor (Timestamp)
  //  }
  //
  // En caso de error, no devuelve nada y registra el error en los logs de Firebase.
  // -----------------------------------------------------------------------------------
  async obtenerMedicion() {
    try {
      const snapshot = await this.#db
        .collection("medidas")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error("No hay medidas guardadas en la colección");
      }

      const doc = snapshot.docs[0].data();

      return {
        sensor: doc.nombre,
        valor: doc.valor,
        tiempo: doc.timestamp,
      };
    } catch (error) {
      functions.logger.error("❌ Error en obtenerMedicion:", error);
      // No se devuelve nada en caso de error
    }
  }
} // class LogicaDeNegocio

// -----------------------------------------------------------------------------------
// Exportación del módulo
// -----------------------------------------------------------------------------------
// Se exporta la clase LogicaDeNegocio para que pueda ser utilizada desde otras
// partes del sistema, como controladores o servicios API.
// -----------------------------------------------------------------------------------
module.exports = LogicaDeNegocio;

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

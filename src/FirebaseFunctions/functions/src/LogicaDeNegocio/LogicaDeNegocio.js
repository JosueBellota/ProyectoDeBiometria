const admin = require("firebase-admin");

class LogicaDeNegocio {
  #db;
  #admin;

  constructor() {
    // Inicializamos Firebase solo si no está inicializado
    if (!admin.apps.length) {
      admin.initializeApp();
    }

    this.#admin = admin;
    this.#db = admin.firestore();
  }

  // Guarda una medición en la colección "medidas"
  async guardarMedicion(sensor, valor) {
    const doc = {
      nombre: sensor,
      valor: valor,
      timestamp: this.#admin.firestore.FieldValue.serverTimestamp(),
    };

    await this.#db.collection("medidas").add(doc);

    return { exito: true, mensaje: "Guardado correctamente en Firestore" };
  }

  // Obtiene la última medición registrada
  async obtenerMedicion() {
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
  }
}

module.exports = LogicaDeNegocio;

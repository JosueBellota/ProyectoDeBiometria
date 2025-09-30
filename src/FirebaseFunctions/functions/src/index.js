const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa Firebase solo una vez
admin.initializeApp();
const db = admin.firestore();

// Importamos las APIs pasando dependencias
const { guardarMedida } = require("./Api/guardarMedida")(functions, admin, db);
const { recibirMedida } = require("./Api/recibirMedida")(functions, admin, db);

// Exportamos las funciones para Firebase
exports.guardarMedida = guardarMedida;
exports.recibirMedida = recibirMedida;

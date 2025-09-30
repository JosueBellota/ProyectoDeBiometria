const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa Firebase solo una vez
admin.initializeApp();
const db = admin.firestore();

// Importamos la API pasando las dependencias necesarias
const { guardarMedidas } = require("./Api/guardarMedidas")(functions, admin, db);

// Exportamos la función para Firebase
exports.guardarMedidas = guardarMedidas;

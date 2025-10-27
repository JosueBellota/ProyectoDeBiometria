// -----------------------------------------------------------------------------------
// Fichero: index.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Descripción general:
// -----------------------------------------------------------------------------------
// Punto de entrada principal de las Cloud Functions de Firebase.
// Aquí se importan y exponen las funciones HTTPS definidas en el módulo ServidorREST.
// -----------------------------------------------------------------------------------

// Importamos la función del servidor REST unificado
const { ServidorREST } = require("./servidorREST/ServidorRest");

// Exportamos la función para Firebase
exports.ServidorREST = ServidorREST;

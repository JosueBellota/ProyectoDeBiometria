// Importamos las funciones del servidor REST

const { ManejarGET } = require("./servidorREST/ManejarGET");
const { ManejarPOST } = require("./servidorREST/ManejarPOST");

// Exportamos las funciones para Firebase
exports.ManejarPOST = ManejarPOST;
exports.ManejarGET = ManejarGET;

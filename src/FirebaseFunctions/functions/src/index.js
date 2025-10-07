// Importamos las funciones del servidor REST
const { ManejarPOST } = require("./servidorREST/ManejarPOST");
const { ManejarGET } = require("./servidorREST/ManejarGET");

// Exportamos las funciones para Firebase
exports.ManejarPOST = ManejarPOST;
exports.ManejarGET = ManejarGET;

// -----------------------------------------------------------------------------------
// Fichero: ManejarGET.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Descripción general:
// -----------------------------------------------------------------------------------
// Este módulo define y exporta una función HTTPS de Firebase llamada "ManejarGET".
// 
// Su objetivo es permitir el acceso controlado a la última medición registrada en 
// Firestore mediante una petición HTTP GET. 
//
// Funcionalidades principales:
//  - Validar que el método HTTP sea GET.
//  - Invocar la capa de lógica de negocio para obtener la última medición.
//  - Devolver la respuesta en formato JSON con los datos o un mensaje de error.
// 
// Incluye control de errores, soporte CORS y registro de actividad en consola.
// -----------------------------------------------------------------------------------

const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const LogicaDeNegocio = require("../LogicaDeNegocio/LogicaDeNegocio");

// -----------------------------------------------------------------------------------
// Instancia de la lógica de negocio
// -----------------------------------------------------------------------------------
// Se crea un objeto de la clase LogicaDeNegocio, encargado de gestionar la comunicación
// con Firestore y las operaciones de negocio relacionadas con las mediciones.
// -----------------------------------------------------------------------------------
const logica = new LogicaDeNegocio();

// -----------------------------------------------------------------------------------
// Petición HTTP GET
// -->
// ManejarGET() --> (función HTTPS invocada desde un endpoint Firebase)
// -->
// Respuesta JSON con la última medición registrada o mensaje de error.
//
// Flujo de ejecución:
//  1. Se valida que el método sea GET.
//  2. Se llama a logica.obtenerMedicion() para acceder a Firestore.
//  3. Se devuelve la respuesta al cliente en formato JSON.
// -----------------------------------------------------------------------------------
exports.ManejarGET = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // -----------------------------------------------------------------------------------
      // Validación del método HTTP
      // -----------------------------------------------------------------------------------
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Método no permitido, usa GET" });
      }

      console.log("📡 Petición GET recibida");

      // -----------------------------------------------------------------------------------
      // Obtención de la última medición desde la capa de negocio
      // -----------------------------------------------------------------------------------
      const resultado = await logica.obtenerMedicion();

      // -----------------------------------------------------------------------------------
      // Respuesta satisfactoria
      // -----------------------------------------------------------------------------------
      return res.status(200).json(resultado);

    } catch (error) {
      // -----------------------------------------------------------------------------------
      // Manejo de errores y registro en consola
      // -----------------------------------------------------------------------------------
      console.error("❌ Error en ManejarGET:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}); // ManejarGET()

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

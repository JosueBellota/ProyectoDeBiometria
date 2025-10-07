// -----------------------------------------------------------------------------------
// Fichero: ManejarPOST.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Descripción general:
// -----------------------------------------------------------------------------------
// Este módulo define y exporta una función HTTPS de Firebase llamada "ManejarPOST".
// 
// Su objetivo es recibir mediante una petición HTTP POST los datos de una medición
// (sensor y valor) y almacenarlos en Firestore a través de la capa de lógica de negocio.
//
// Funcionalidades principales:
//  - Validar que el método HTTP sea POST.
//  - Verificar que el cuerpo de la petición contenga datos válidos.
//  - Guardar la medición en la base de datos utilizando LogicaDeNegocio.
//  - Enviar una respuesta JSON indicando el resultado de la operación.
//
// Incluye manejo de errores, validación de tipos, soporte CORS y trazas en consola.
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
// Petición HTTP POST
// -->
// ManejarPOST() --> (función HTTPS invocada desde un endpoint Firebase)
// -->
// Respuesta JSON con el resultado del guardado o mensaje de error.
//
// Flujo de ejecución:
//  1. Se valida que el método sea POST.
//  2. Se extraen los datos del cuerpo de la petición (sensor y valor).
//  3. Se valida su formato y tipo de dato.
//  4. Se llama a logica.guardarMedicion() para almacenar los datos en Firestore.
//  5. Se devuelve una respuesta al cliente en formato JSON.
// -----------------------------------------------------------------------------------
exports.ManejarPOST = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // -----------------------------------------------------------------------------------
      // Validación del método HTTP
      // -----------------------------------------------------------------------------------
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido, usa POST" });
      }

      console.log("📩 Datos recibidos:", req.body);

      // -----------------------------------------------------------------------------------
      // Validación de datos de entrada
      // -----------------------------------------------------------------------------------
      const { sensor, valor } = req.body;
      const valorNum = Number(valor);

      if (typeof sensor !== "string" || isNaN(valorNum)) {
        return res.status(400).json({
          error: "Se esperaba { sensor: string, valor: number }",
        });
      }

      // -----------------------------------------------------------------------------------
      // Guardado de la medición en Firestore
      // -----------------------------------------------------------------------------------
      const resultado = await logica.guardarMedicion(sensor, valorNum);

      // -----------------------------------------------------------------------------------
      // Respuesta satisfactoria
      // -----------------------------------------------------------------------------------
      return res.status(200).json(resultado);

    } catch (error) {
      // -----------------------------------------------------------------------------------
      // Manejo de errores y registro en consola
      // -----------------------------------------------------------------------------------
      console.error("❌ Error en ManejarPOST:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}); // ManejarPOST()

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

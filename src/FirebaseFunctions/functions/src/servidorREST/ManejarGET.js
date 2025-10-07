const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const LogicaDeNegocio = require("../LogicaDeNegocio/LogicaDeNegocio");

const logica = new LogicaDeNegocio();

exports.ManejarGET = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Método no permitido, usa GET" });
      }

      console.log("📡 Petición GET recibida");

      const resultado = await logica.obtenerMedicion();
      return res.status(200).json(resultado);

    } catch (error) {
      console.error("❌ Error en ManejarGET:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

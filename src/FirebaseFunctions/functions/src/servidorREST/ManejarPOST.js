const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const LogicaDeNegocio = require("../LogicaDeNegocio/LogicaDeNegocio");

const logica = new LogicaDeNegocio();

exports.ManejarPOST = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido, usa POST" });
      }

      console.log("📩 Datos recibidos:", req.body);

      const { sensor, valor } = req.body;
      const valorNum = Number(valor);

      if (typeof sensor !== "string" || isNaN(valorNum)) {
        return res.status(400).json({
          error: "Se esperaba { sensor: string, valor: number }",
        });
      }

      const resultado = await logica.guardarMedicion(sensor, valorNum);
      return res.status(200).json(resultado);

    } catch (error) {
      console.error("❌ Error en ManejarPOST:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); 

admin.initializeApp();
const db = admin.firestore();


// -----------------------------------------------------------------------------------
// entrada (JSON en el body del request):
//     {
//        sensor: string,
//        valor: number
//     }
// -->
// guardarMedidas (endpoint HTTP POST)
//     • Recibe un JSON con los datos de la medida
//     • Valida los campos
//     • Llama a guardarMedidasInterno()
// -->
// salida (JSON):
//     { exito: booleano, mensaje: texto }
//     o { error: texto } en caso de fallo
// -----------------------------------------------------------------------------------
exports.guardarMedidas = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido, usa POST" });
      }

      const { sensor, valor } = req.body;

      console.log("📌 Datos recibidos en request:", req.body);

      // Validamos y convertimos valor
      const valorNum = Number(valor);
      if (typeof sensor !== "string" || isNaN(valorNum)) {
        return res.status(400).json({
          error: "Se esperaba { sensor: string, valor: number }",
        });
      }

      const resultado = await guardarMedidasInterno(sensor, valorNum);

      return res.status(200).json(resultado);
    } catch (error) {
      console.error("❌ Error en guardarMedidas:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});

// -----------------------------------------------------------------------------------
// sensor: texto 
// valor: numero 
// -->
// guardarMedidasInterno()
//     • Construye el documento con los campos recibidos
//     • Guarda en la colección "emisoras_f" de Firestore
// -->
// salida (JSON):
//     { exito: booleano , mensaje: texto }
// -----------------------------------------------------------------------------------
async function guardarMedidasInterno(sensor, valor) {
  const doc = {
    nombre: sensor,
    valor: valor,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("emisoras_f").add(doc);

  return { exito: true, mensaje: "Guardado correctamente en Firestore" };
}

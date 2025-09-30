const cors = require("cors")({ origin: true });

// Importamos la lógica de negocio
const recibirMedidaInterno = require("../LogicaDelNegocio/recibirMedidaInterno");

// -----------------------------------------------------------------------------------
// req: { método GET }
//     
// -->
// recibirMedida (endpoint HTTP GET)
//     • No recibe parámetros en el body
//     • Llama a recibirMedidaInterno()
// -->
// JSON:
//     { sensor: texto, valor: numero }
//     o { error: texto } en caso de fallo
// -----------------------------------------------------------------------------------

module.exports = (functions, admin, db) => {
  return {
    recibirMedida: functions.https.onRequest((req, res) => {
      cors(req, res, async () => {
        try {
          if (req.method !== "GET") {
            return res.status(405).json({ error: "Método no permitido, usa GET" });
          }

          console.log("📌 Petición recibida para recibirMedida");

          // Llamamos a la lógica de negocio
          const resultado = await recibirMedidaInterno(db);

          return res.status(200).json(resultado);
        } catch (error) {

            
          console.error("❌ Error en recibirMedida:", error);
          return res.status(500).json({ error: error.message });
        }
      });
    }),
  };
};

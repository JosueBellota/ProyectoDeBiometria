const cors = require("cors")({ origin: true });

// Importamos la lógica de negocio
const guardarMedidaInterno = require("../LogicaDeNegocio/guardarMedidaInterno");


// -----------------------------------------------------------------------------------
// req: {
//
//     metodo: POST,
//     body:{
//         sensor: texto,
//         valor: numero N
//     }    
// }
//     
// -->
// guardarMedidas (endpoint HTTP POST)
//     • Recibe un JSON con los datos de la medida
//     • Valida los campos
//     • Llama a guardarMedidasInterno()
// -->
// JSON:
//     { exito: booleano, mensaje: texto }
//     o { error: texto } en caso de fallo
// -----------------------------------------------------------------------------------

module.exports = (functions, admin, db) => {
  return {


    guardarMedida: functions.https.onRequest((req, res) => {

      cors(req, res, async () => {

        try {

          if (req.method !== "POST") {
            return res.status(405).json({ error: "Método no permitido, usa POST" });
          }

            console.log("📌 Datos recibidos en request:", req.body);

            const sensor = req.body.sensor;
            const valor = req.body.valor;



            // Validamos y convertimos valor
            const valorNum = Number(valor);
            if (typeof sensor !== "string" || isNaN(valorNum)) {
                return res.status(400).json({
                error: "Se esperaba { sensor: string, valor: number }",
                });
            }


            const resultado = await guardarMedidaInterno(db, admin, sensor, valorNum);

            return res.status(200).json(resultado);


        } catch (error) {
          console.error("❌ Error en guardarMedida:", error);
          return res.status(500).json({ error: error.message });
        }
      });


    }),
  };
};

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// -----------------------------------------------------------------------------------
// datos: objeto JSON con campos { sensor: string, valor: number }
// -->
// guardarMedidas() --> función expuesta a la nube que recibe un JSON desde Android o prueba,
//                     valida los campos y llama a la función interna guardarMedidasInterno
// -->
// no devuelve ningún dato de negocio, solo indica éxito o lanza excepción en caso de error
// -----------------------------------------------------------------------------------
exports.guardarMedidas = functions.https.onCall(async (data, context) => {
  const sensor = data.sensor;
  const valor = data.valor;

  if (typeof sensor !== "string" || typeof valor !== "number") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Se esperaba { sensor: string, valor: number }"
    );
  }

  try {
    // llama a la función interna que guarda en Firestore
    return await guardarMedidasInterno(sensor, valor);
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// -----------------------------------------------------------------------------------
// sensor: texto (de entrada)
// valor: número (de entrada)
// -->
// guardarMedidasInterno() --> función interna que construye el documento y lo guarda en Firestore
// -->
// devuelve un objeto JSON con exito: true y mensaje de confirmación
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

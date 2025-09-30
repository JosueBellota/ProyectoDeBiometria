// -----------------------------------------------------------------------------------
//    
//   (sin parámetros de entrada)
//     
// -->
// recibirMedidaInterno()
//     • Recupera un documento de la colección "emisoras_f"
//     • Devuelve sus campos básicos
// -->
// JSON:
//     { sensor: texto, valor: numero }
// -----------------------------------------------------------------------------------

module.exports = async function recibirMedidaInterno(db) {

  const snapshot = await db
    .collection("medidas")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("No hay medidas guardadas en la colección");
  }

  const doc = snapshot.docs[0].data();

  return {
    sensor: doc.nombre,
    valor: doc.valor,
  };
};

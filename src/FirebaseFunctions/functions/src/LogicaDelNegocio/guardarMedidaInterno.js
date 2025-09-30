// -----------------------------------------------------------------------------------
//    
//   sensor: texto,
//   valor: numero N    
//     
// -->
// guardarMedidasInterno()
//  
// -->
// JSON:
//     { exito: booleano, mensaje: texto }
//
// -----------------------------------------------------------------------------------

module.exports = async function guardarMedidasInterno(db, admin, sensor, valor) {

    const doc = {

        nombre: sensor,
        valor: valor,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),

    };

    await db.collection("medidas").add(doc);

    return { exito: true, mensaje: "Guardado correctamente en Firestore" };


};
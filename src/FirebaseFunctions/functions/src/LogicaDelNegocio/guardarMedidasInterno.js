// -----------------------------------------------------------------------------------
// guardarMedidasInterno()
//   • Construye el documento con los campos recibidos
//   • Guarda en la colección "emisoras_f" de Firestore
// -----------------------------------------------------------------------------------

module.exports = async function guardarMedidasInterno(db, admin, sensor, valor) {


    const doc = {
        nombre: sensor,
        valor: valor,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("emisoras_f").add(doc);

    return { exito: true, mensaje: "Guardado correctamente en Firestore" };


};
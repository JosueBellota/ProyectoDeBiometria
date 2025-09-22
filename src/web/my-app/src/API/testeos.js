// API/Testeos.js
export class testeos {

//   constructor() {}

  // Valida que el nombre de la emisora exista y sea igual al esperado
  testNombreEmisora(nombre, esperado = "LE_WH-1000XM5") {
    
    if (!nombre) {
      console.error("❌ Error: nombre de emisora es null o undefined");
      return false;
    }

    if (nombre === esperado) {
      console.log(`✅ Test correcto: ${nombre} coincide con ${esperado}`);
      return true;
    } else {
      console.error(`❌ Test fallido: ${nombre} no coincide con ${esperado}`);
      return false;
    }
  }
}

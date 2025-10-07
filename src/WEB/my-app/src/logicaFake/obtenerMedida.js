// ---------------------------------------------------------
//
// Fichero:api.js
// Responsable: Josue Bellota Ichaso
//
// ----------------------------------------------------------

// ----------------------------------------------------------
// RecibirMedida()
// ----------------------------------------------------------
// • Realiza una petición GET a la función Firebase "recibirMedida".
// • Si la respuesta es correcta, devuelve el JSON recibido
//   en la propiedad "resultado".
// • Si ocurre error, devuelve un objeto con la descripción del error.
//
// Formato devuelto:
//   { paso: "GET", resultado: objeto }
//   ó
//   { paso: "GET", error: texto }
// ----------------------------------------------------------
export async function obtenerMedida() {
  try {
    const res = await fetch(
      "https://us-central1-proyectodebiometria.cloudfunctions.net/recibirMedida"
    );
    const data = await res.json();

    if (!res.ok) {
      return { paso: "GET", error: data.error || "Error desconocido en GET" };
    }

    return { paso: "GET", resultado: data };
  } catch (err) {
    return { paso: "GET", error: err.message };
  }
}

// ----------------------------------------------------------
// main()
// ----------------------------------------------------------
// • Función de entrada principal para la App.
// • Llama directamente a RecibirMedida() y devuelve sus resultados
//   en un array (para mantener la misma estructura que antes).
//
// Formato devuelto:
//   [ { paso, resultado } ]   ó   [ { paso, error } ]
// ----------------------------------------------------------
export async function main() {
  const resultados = [];

  // petición real al endpoint
  const resultadoGet = await obtenerMedida();

  resultados.push(resultadoGet);

  return resultados;
}

// ---------------------------------------------------------
//
// Fichero: api.js
// Responsable: Josue Bellota Ichaso
//
// ---------------------------------------------------------

// ----------------------------------------------------------
// obtenerMedida()
// ----------------------------------------------------------
// • Realiza una petición GET a la función Firebase "ManejarGET".
// • Devuelve el JSON recibido en la propiedad "resultado".
// • En caso de error, devuelve { paso, error }.
//
// Formato devuelto:
//   { paso: "GET", resultado: objeto }
//   ó
//   { paso: "GET", error: texto }
// ----------------------------------------------------------
export async function obtenerMedida() {
  try {
    const res = await fetch(
      "https://us-central1-proyectodebiometria.cloudfunctions.net/ManejarGET"
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
// • Función principal de la App.
// • Llama a obtenerMedida() y devuelve sus resultados
//   en un array (igual que antes).
//
// Formato devuelto:
//   [ { paso, resultado } ]   ó   [ { paso, error } ]
// ----------------------------------------------------------
export async function main() {
  const resultados = [];

  const resultadoGet = await obtenerMedida();
  resultados.push(resultadoGet);

  return resultados;
}

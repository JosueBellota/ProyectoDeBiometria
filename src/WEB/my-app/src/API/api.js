// ---------------------------------------------------------
//
// Fichero:api.js
// Responsable: Josue Bellota Ichaso
//
// ----------------------------------------------------------

// ----------------------------------------------------------
// sin parámetros (de entrada)
// -->
// RecibirMedida() --> realiza una petición GET a la función
// Firebase "recibirMedida". Si la respuesta es correcta, devuelve
// el JSON recibido como resultado. Si ocurre error, devuelve
// un objeto con la descripción del error.
// -->
// { paso: "GET", resultado: objeto }  ó  { paso: "GET", error: texto }
// ----------------------------------------------------------
export async function RecibirMedida() {
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
// Función main (pruebas de la API)
// ----------------------------------------------------------
// sin parámetros (de entrada)
// -->
// main() --> ejecuta pruebas sobre las funciones de API.
//   1. Define una lista de tests (sensor y valor fijo).
//   2. Por cada test, llama a RecibirMedida() y guarda
//      el resultado junto al test en un array.
// -->
// resultados: lista de objetos con { paso, resultado/error, test }
// ----------------------------------------------------------
export async function main() {
  const tests = [{ sensor: "CO2", valor: 1234 }];
  const resultados = [];

  for (const test of tests) {
    const resultadoGet = await RecibirMedida();
    resultados.push({ ...resultadoGet, test });
  }

  return resultados;
}

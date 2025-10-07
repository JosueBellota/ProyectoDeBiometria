// test.js

// 🔹 Test para ManejarPOST (POST)
export async function pruebaGuardarMedida(test) {
  try {
    const res = await fetch(
      "https://us-central1-proyectodebiometria.cloudfunctions.net/ManejarPOST",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(test),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { test, paso: "POST", error: data.error || "Error desconocido en POST" };
    }

    return { test, paso: "POST", resultado: data };
  } catch (err) {
    return { test, paso: "POST", error: err.message };
  }
}

// 🔹 Test para ManejarGET (GET)
export async function pruebaRecibirMedida() {
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

// -----------------------------------------------
// 🔹 Función que ejecuta ambos tests secuenciales
// -----------------------------------------------
export async function pruebaAutomatica() {
  const tests = [{ sensor: "CO2", valor: 1234 }];
  const resultados = [];

  for (const test of tests) {
    const resultadoPost = await pruebaGuardarMedida(test);
    resultados.push(resultadoPost);

    // Solo probamos GET si el POST tuvo éxito
    if (resultadoPost.resultado) {
      const resultadoGet = await pruebaRecibirMedida();
      resultados.push(resultadoGet);
    }
  }

  return resultados;
}

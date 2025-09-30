// 🔹 API para pruebas de Firebase Functions

// Función GET para recibir medida
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



// Función principal de tests
export async function main() {
  const tests = [{ sensor: "CO2", valor: 1234 }];
  const resultados = [];

  for (const test of tests) {
    const resultadoGet = await RecibirMedida();
    resultados.push({ ...resultadoGet, test });
  }

  return resultados;
}

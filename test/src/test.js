// test.js
export async function pruebaAutomatica() {

// Valores a Testear

  const tests = [
    { sensor: "CO2", valor: 100 }
  ];

  const resultados = [];

  for (const test of tests) {
    try {
      // Hacemos POST al endpoint HTTP
      const res = await fetch(
        "https://guardarmedidas-k4jphiswsa-uc.a.run.app",
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
        resultados.push({ test, error: data.error || "Error desconocido" });
      } else {
        resultados.push({ test, resultado: data });
      }
    } catch (err) {
      resultados.push({ test, error: err.message });
    }
  }

  return resultados;
}

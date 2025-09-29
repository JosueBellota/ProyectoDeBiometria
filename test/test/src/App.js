import React, { useEffect, useState } from "react";
import { pruebaAutomatica } from "./test";

function App() {
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    const ejecutarTest = async () => {
      const res = await pruebaAutomatica();
      setResultados(res);
    };

    ejecutarTest();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Test automático de Firebase Functions</h1>
      {resultados.length === 0 ? (
        <p>Ejecutando tests...</p>
      ) : (
        resultados.map((r, index) => (
          <div
            key={index}
            style={{
              marginBottom: 10,
              padding: 5,
              border: "1px solid #ccc",
            }}
          >
            <strong>Test:</strong> {JSON.stringify(r.test)} <br />
            {r.resultado && (
              <span style={{ color: "green" }}>
                ✅ Resultado: {JSON.stringify(r.resultado)}
              </span>
            )}
            {r.error && (
              <span style={{ color: "red" }}>
                ❌ Error:{" "}
                {typeof r.error === "string" ? r.error : JSON.stringify(r.error)}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;

import React, { useEffect, useState } from "react";
import { main } from "./API/api";

let testEjecutado = false;

function App() {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!testEjecutado) {
      const ejecutarTest = async () => {
        const res = await main();
        setResultados(res);
        setCargando(false);
      };
      ejecutarTest();
      testEjecutado = true;
    } else {
      setCargando(false);
    }
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Medida</h1>
      {cargando ? (
        <p>Ejecutando tests...</p>
      ) : resultados.length === 0 ? (
        <p>No hay tests ejecutados en esta sesión aún.</p>
      ) : (
        resultados.map((r, index) => (
          <div
            key={index}
            style={{
              marginBottom: 12,
              padding: 10,
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          >
            <strong>Sensor:</strong> {r.test.sensor} <br />
            <strong>Valor:</strong> {r.test.valor} <br />

            {r.error && (
              <span style={{ color: "red" }}>
                ❌ Error: {typeof r.error === "string" ? r.error : JSON.stringify(r.error)}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;

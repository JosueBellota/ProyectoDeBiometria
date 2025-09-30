import React, { useEffect, useState } from "react";
import { pruebaAutomatica } from "./test";

// variable global en memoria
let testEjecutado = false;

function App() {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!testEjecutado) {
      const ejecutarTest = async () => {
        const res = await pruebaAutomatica();
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
    <div style={{ padding: 20 }}>
      <h1>Test automático de Firebase Functions</h1>
      {cargando ? (
        <p>Ejecutando tests...</p>
      ) : resultados.length === 0 ? (
        <p>No hay tests ejecutados en esta sesión aún.</p>
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
            <strong>Paso:</strong> {r.paso} <br />
            {r.test && (
              <>
                <strong>Test:</strong> {JSON.stringify(r.test)} <br />
              </>
            )}
            {r.resultado && (
              <span style={{ color: "green" }}>
                ✅ Resultado: {JSON.stringify(r.resultado)}
              </span>
            )}
            {r.error && (
              <span style={{ color: "red" }}>
                ❌ Error:{" "}
                {typeof r.error === "string"
                  ? r.error
                  : JSON.stringify(r.error)}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;

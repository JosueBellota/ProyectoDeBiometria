// ---------------------------------------------------------
//
// Fichero:App.js
// Responsable: Josue Bellota Ichaso
//
// ----------------------------------------------------------

import React, { useEffect, useState } from "react";
import { main } from "./logicaFake/obtenerMedida";

// ---------------------------------------------------------
// Variable global para controlar si ya se ejecutó la petición
// ---------------------------------------------------------
let testEjecutado = false;

function App() {
  // ---------------------------------------------------------
  // State:
  //   - resultados: guarda la lista de respuestas recibidas
  //   - cargando: indica si se está realizando la petición
  // ---------------------------------------------------------
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ---------------------------------------------------------
  // Función auxiliar para formatear el tiempo recibido
  // ---------------------------------------------------------
  const formatearTiempo = (tiempo) => {
    if (!tiempo) return "Sin fecha";

    // Caso Firestore Timestamp { _seconds, _nanoseconds }
    if (tiempo._seconds) {
      return new Date(tiempo._seconds * 1000).toLocaleString();
    }

    // Caso Firestore Timestamp { seconds, nanoseconds }
    if (tiempo.seconds) {
      return new Date(tiempo.seconds * 1000).toLocaleString();
    }

    // Caso número en milisegundos (Date.now())
    if (typeof tiempo === "number") {
      return new Date(tiempo).toLocaleString();
    }

    // Caso string ISO (ej: "2025-10-03T13:45:00.000Z")
    if (typeof tiempo === "string") {
      return new Date(tiempo).toLocaleString();
    }

    return "Formato de tiempo desconocido";
  };

  // ---------------------------------------------------------
  // useEffect:
  //   • Se ejecuta solo la primera vez que se monta el componente.
  //   • Llama a la función "main()" (que a su vez invoca RecibirMedida).
  //   • Actualiza el estado con los datos obtenidos.
  // ---------------------------------------------------------
  useEffect(() => {
    if (!testEjecutado) {
      const ejecutarPeticion = async () => {
        const res = await main(); // aquí llegan los valores reales
        setResultados(res);
        setCargando(false);
      };
      ejecutarPeticion();
      testEjecutado = true;
    } else {
      setCargando(false);
    }
  }, []);

  // ---------------------------------------------------------
  // Renderizado:
  //   • Mientras está cargando muestra un mensaje.
  //   • Si no hay resultados, avisa que no hay medidas aún.
  //   • Si hay resultados, muestra sensor, valor y fecha legible.
  // ---------------------------------------------------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>Medida</h1>
      {cargando ? (
        <p>Ejecutando petición...</p>
      ) : resultados.length === 0 ? (
        <p>No hay medidas recibidas aún.</p>
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
            {r.error ? (
              <span style={{ color: "red" }}>
                ❌ Error:{" "}
                {typeof r.error === "string"
                  ? r.error
                  : JSON.stringify(r.error)}
              </span>
            ) : (
              <>
                <strong>Sensor:</strong> {r.resultado.sensor} <br />
                <strong>Valor:</strong> {r.resultado.valor} <br />
                <strong>Tiempo:</strong> {formatearTiempo(r.resultado.tiempo)}{" "}
                <br />
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;

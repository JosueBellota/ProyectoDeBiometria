import React, { useEffect, useState } from "react";
import { main } from "./API/main";

function App() {

  const [datos, setDatos] = useState([]);

  useEffect(() => {
    const fetchDatos = async () => {
      const resultado = await main();
      setDatos(resultado);
    };
    fetchDatos();
  }, []);

  return (
    <div>
      <h2>Datos de IBeacon</h2>
      {datos.length === 0 ? (
        <p>Cargando...</p>
      ) : (
        datos.map((item) => (
          <div key={item.id}>
            {item.id}: {item.nombre || "Sin nombre"}
          </div>
        ))
      )}
    </div>
  );
}

export default App;

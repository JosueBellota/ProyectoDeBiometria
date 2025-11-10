import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "./../logicaFake/auth";
import { main } from "./../logicaFake/logicaFake";
import Menu from "./templates/Menu"; // 👈 Importar el menú

let testEjecutado = false;

function Intranet() {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const user = obtenerUsuarioLogueado();
    if (!user) navigate("/login");
  }, [navigate]);

  const formatearTiempo = (tiempo) => {
    if (!tiempo) return "Sin fecha";
    if (typeof tiempo === "string" || typeof tiempo === "number")
      return new Date(tiempo).toLocaleString();
    if (tiempo.seconds) return new Date(tiempo.seconds * 1000).toLocaleString();
    if (tiempo._seconds) return new Date(tiempo._seconds * 1000).toLocaleString();
    return "Formato de tiempo desconocido";
  };

  useEffect(() => {
    if (!testEjecutado) {
      const ejecutarPeticion = async () => {
        try {
          const res = await main();
          setResultados(res);
        } catch (error) {
          console.error("❌ Error al obtener mediciones:", error);
          setResultados([{ error: error.message }]);
        } finally {
          setCargando(false);
        }
      };
      ejecutarPeticion();
      testEjecutado = true;
    } else {
      setCargando(false);
    }
  }, []);

  return (
    <div className="container">
      <Menu /> {/* 👈 Menú compartido */}
      <h1>Intranet - Mediciones de Sensores</h1>
      {cargando ? (
        <p>Ejecutando petición...</p>
      ) : resultados.length === 0 ? (
        <p>No hay medidas recibidas aún.</p>
      ) : (
        resultados.map((r, index) => (
          <div key={index} className="medida-card">
            {r.error ? (
              <span className="error">
                ❌ Error: {typeof r.error === "string" ? r.error : JSON.stringify(r.error)}
              </span>
            ) : r.resultado ? (
              <>
                <strong>Nodo:</strong> {r.resultado.nodo || "Desconocido"} <br />
                <strong>Tiempo:</strong> {formatearTiempo(r.resultado.datos?.tiempo)} <br />
                <strong>Sensores:</strong>
                <ul>
                  {Object.entries(r.resultado.datos?.sensores ?? {}).length > 0 ? (
                    Object.entries(r.resultado.datos.sensores).map(([sensor, valor]) => (
                      <li key={sensor}>
                        {sensor}: {valor ?? "-"}
                      </li>
                    ))
                  ) : (
                    <li>Sin datos de sensores</li>
                  )}
                </ul>

              </>
            ) : (
              <pre>{JSON.stringify(r, null, 2)}</pre>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Intranet;

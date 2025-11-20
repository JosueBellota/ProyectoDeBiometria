import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerUsuarioLogueado } from "./../logicaFake/auth";
import { main, obtenerUsuarioCompleto, actualizarDistanciaUsuario } from "./../logicaFake/logicaFake";
import Menu from "./templates/Menu";
import "./css/ciudadano.css";

function Intranet() {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [distanciaRecorrida, setDistanciaRecorrida] = useState(0);
  const [usuario, setUsuario] = useState(null);

  const fetchData = useCallback(async () => {
    setCargando(true);
    try {
      const user = obtenerUsuarioLogueado();
      if (!user) {
        navigate("/");
        return;
      }
      setUsuario(user);

      // Fetch user data to get distance
      const userData = await obtenerUsuarioCompleto(user.uid);
      if (userData && userData.distancia !== undefined) {
        setDistanciaRecorrida(userData.distancia);
      }

      // Fetch sensor measurements
      const res = await main();
      setResultados(res);

    } catch (error) {
      console.error("❌ Error al obtener datos:", error);
      setResultados([{ error: error.message }]);
    } finally {
      setCargando(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      console.log("Tab focused, refreshing data...");
      fetchData();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchData]);

  const resetDistancia = async () => {
    if (usuario) {
      try {
        await actualizarDistanciaUsuario(usuario.uid, 0);
        setDistanciaRecorrida(0);
      } catch (error) {
        console.error("❌ Error al resetear la distancia:", error);
      }
    }
  };

  const formatearTiempo = (tiempo) => {
    if (!tiempo) return "Sin fecha";
    if (typeof tiempo === "string" || typeof tiempo === "number")
      return new Date(tiempo).toLocaleString();
    if (tiempo.seconds) return new Date(tiempo.seconds * 1000).toLocaleString();
    if (tiempo._seconds)
      return new Date(tiempo._seconds * 1000).toLocaleString();
    return "Formato de tiempo desconocido";
  };

  return (
    <div className="container">
      <Menu />
      <h1>Intranet - Mediciones de Sensores</h1>

      <div className="distancia-container">
        <div className="distancia-info">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path fillRule="evenodd" d="M11.25 4.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10.5 9.75a.75.75 0 00-1.5 0v2.25H7.5a.75.75 0 000 1.5h1.5v4.5a.75.75 0 001.5 0v-4.5h.75a.75.75 0 000-1.5h-.75V9.75z" clipRule="evenodd" />
          </svg>
          <span className="distancia-texto">
            Distancia Recorrida: {distanciaRecorrida} metros
          </span>
        </div>
        <button onClick={resetDistancia} className="reset-btn">Resetear</button>
      </div>

      {cargando ? (
        <p>Ejecutando petición...</p>
      ) : resultados.length === 0 || (resultados[0] && (resultados[0].error || resultados[0].resultado === "El usuario no tiene nodos registrados.")) ? (
        <p>No hay medidas recibidas aún.</p>
      ) : (
        resultados.map((r, index) => (
          <div key={index} className="medida-card">
            {r.error ? (
              <span className="error">
                ❌ Error: {typeof r.error === "string" ? r.error : JSON.stringify(r.error)}
              </span>
            ) : r.resultado && r.resultado.nodo ? (
              <>
                <strong>Nodo:</strong> {r.resultado.nodo || "Desconocido"} <br />
                <strong>Tiempo:</strong>{" "}
                {formatearTiempo(r.resultado.datos?.tiempo)} <br />
                <strong>Sensores:</strong>
                <ul>
                  {Object.entries(r.resultado.datos?.sensores ?? {}).length > 0 ? (
                    Object.entries(r.resultado.datos.sensores).map(
                      ([sensor, valor]) => (
                        <li key={sensor}>
                          {sensor}: {valor ?? "-"}
                        </li>
                      )
                    )
                  ) : (
                    <li>Sin datos de sensores</li>
                  )}
                </ul>
              </>
            ) : (
              <p>{r.resultado}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Intranet;

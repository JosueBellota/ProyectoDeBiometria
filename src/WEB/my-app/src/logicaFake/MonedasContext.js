// src/logicaFake/MonedasContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { obtenerUsuarioLogueado } from "./auth";
import { obtenerUsuarioCompleto } from "./logicaFake";

const MonedasContext = createContext();

export function useMonedas() {
  return useContext(MonedasContext);
}

export function MonedasProvider({ children }) {
  const [monedas, setMonedas] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonedas = async () => {
      const user = obtenerUsuarioLogueado();
      if (user) {
        const fullUser = await obtenerUsuarioCompleto(user.uid);
        if (fullUser && !fullUser.error) {
          setMonedas(fullUser.monedas || 0);
        }
      }
      setLoading(false);
    };

    fetchMonedas();
  }, []);

  const value = {
    monedas,
    setMonedas,
    loading,
  };

  return (
    <MonedasContext.Provider value={value}>{children}</MonedasContext.Provider>
  );
}

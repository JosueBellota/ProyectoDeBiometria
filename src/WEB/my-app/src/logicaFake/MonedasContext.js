// --------------------------------------------------------------------------
// Fichero: MonedasContext.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene el contexto de las monedas.
// --------------------------------------------------------------------------

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { obtenerUsuarioLogueado, actualizarUsuario } from "./auth";
import {
  obtenerUsuarioCompleto,
  actualizarMonedasUsuario,
} from "./logicaFake";
import {
  puedeReclamarMoneda,
  marcarMonedaReclamada,
  obtenerTiempoRestante,
  TIEMPO_REQUERIDO_ACTIVIDAD,
} from "./monedas";

const MonedasContext = createContext();

export function useMonedas() {
  return useContext(MonedasContext);
}

export function MonedasProvider({ children }) {
  const [monedas, setMonedas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState(null);

  // --- Timer State ---
  const [tiempoActivo, setTiempoActivo] = useState(0);
  const [puedeReclamar, setPuedeReclamar] = useState(false);
  const [tiempoRestanteCooldown, setTiempoRestanteCooldown] = useState(0);
  // --- End Timer State ---

  const fetchUsuarioYMonedas = useCallback(async () => {
    setLoading(true);
    const user = obtenerUsuarioLogueado();
    if (user) {
      const fullUser = await obtenerUsuarioCompleto(user.uid);
      if (fullUser && !fullUser.error) {
        setUsuario(fullUser);
        setMonedas(fullUser.monedas || 0);
      }
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsuarioYMonedas();
    setPuedeReclamar(puedeReclamarMoneda());
    setTiempoRestanteCooldown(obtenerTiempoRestante());
  }, [fetchUsuarioYMonedas]);

  // Main timer logic
  useEffect(() => {
    let timerId;

    const runTimers = () => {
      clearInterval(timerId); // Clear previous timer

      if (document.hidden) {
        return; // Don't run timers if the tab is not visible
      }

      if (puedeReclamar) {
        timerId = setInterval(() => {
          setTiempoActivo((t) => Math.min(t + 1, TIEMPO_REQUERIDO_ACTIVIDAD));
        }, 1000);
      } else {
        timerId = setInterval(() => {
          const restante = obtenerTiempoRestante();
          setTiempoRestanteCooldown(restante);
          if (restante <= 0) {
            setPuedeReclamar(true);
            setTiempoActivo(0);
          }
        }, 1000);
      }
    };

    runTimers(); // Initial run
    document.addEventListener("visibilitychange", runTimers);

    return () => {
      clearInterval(timerId);
      document.removeEventListener("visibilitychange", runTimers);
    };
  }, [puedeReclamar]);

  const reclamarMoneda = async () => {
    if (
      tiempoActivo < TIEMPO_REQUERIDO_ACTIVIDAD ||
      !puedeReclamar ||
      !usuario
    )
      return;

    const nuevasMonedas = (usuario.monedas || 0) + 1;

    // Optimistic UI update
    setMonedas(nuevasMonedas);
    setUsuario((prev) => ({ ...prev, monedas: nuevasMonedas }));

    marcarMonedaReclamada();
    setPuedeReclamar(false);
    setTiempoRestanteCooldown(obtenerTiempoRestante());
    setTiempoActivo(0);

    try {
      await actualizarMonedasUsuario(usuario.uid, nuevasMonedas);
    } catch (error) {
      alert(`❌ Error al guardar la moneda: ${error.message}`);
      // Revert UI change on error
      setMonedas(usuario.monedas);
       setUsuario((prev) => ({ ...prev, monedas: usuario.monedas }));
    }
  };

  const value = {
    monedas,
    setMonedas,
    loading,
    tiempoActivo,
    puedeReclamar,
    tiempoRestanteCooldown,
    reclamarMoneda,
    TIEMPO_REQUERIDO_ACTIVIDAD, // Export constant for use in components
  };

  return (
    <MonedasContext.Provider value={value}>{children}</MonedasContext.Provider>
  );
}
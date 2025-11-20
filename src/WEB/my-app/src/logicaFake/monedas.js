// src/logicaFake/monedas.js

// Cooldown de 5 minutos (en milisegundos) para simular un día
export const COOLDOWN_DIARIO = 5 * 60 * 1000; 
export const TIEMPO_REQUERIDO_ACTIVIDAD = 30; // 30 segundos en segundos

/**
 * Comprueba si el usuario puede reclamar una nueva moneda.
 * @returns {boolean} - True si el cooldown ha terminado, false en caso contrario.
 */
export const puedeReclamarMoneda = () => {
  const ultimaReclamacion = localStorage.getItem('ultimaReclamacionMoneda');
  if (!ultimaReclamacion) {
    return true; // Nunca ha reclamado, así que puede.
  }

  const tiempoDesdeUltima = Date.now() - parseInt(ultimaReclamacion, 10);
  return tiempoDesdeUltima >= COOLDOWN_DIARIO;
};

/**
 * Guarda el momento actual como la última vez que se reclamó una moneda.
 */
export const marcarMonedaReclamada = () => {
  localStorage.setItem('ultimaReclamacionMoneda', Date.now().toString());
};

/**
 * Calcula el tiempo restante para poder volver a reclamar.
 * @returns {number} - El tiempo restante en milisegundos.
 */
export const obtenerTiempoRestante = () => {
    const ultimaReclamacion = localStorage.getItem('ultimaReclamacionMoneda');
    if (!ultimaReclamacion) {
      return 0; // No hay cooldown
    }
  
    const tiempoPasado = Date.now() - parseInt(ultimaReclamacion, 10);
    const tiempoRestante = COOLDOWN_DIARIO - tiempoPasado;
  
    return tiempoRestante > 0 ? tiempoRestante : 0;
};

/**
 * Formatea un tiempo en milisegundos o segundos a MM:SS.
 * @param {number} totalUnits - El tiempo total en milisegundos o segundos.
 * @param {boolean} inMilliseconds - Si el tiempo está en milisegundos.
 * @returns {string} - El tiempo formateado como "MM:SS".
 */
export const formatTime = (totalUnits, inMilliseconds = true) => {
  const totalSeconds = inMilliseconds ? Math.floor(totalUnits / 1000) : totalUnits;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

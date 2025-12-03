// src/WEB/my-app/src/ciudadano/ReadingsTable.js
import React from 'react';

// Helper para formatear el tiempo
const formatearTiempo = (tiempo) => {
  if (!tiempo) return "Sin fecha";
  if (tiempo.seconds) return new Date(tiempo.seconds * 1000).toLocaleString();
  if (tiempo._seconds) return new Date(tiempo._seconds * 1000).toLocaleString();
  if (typeof tiempo === "string" || typeof tiempo === "number") {
    return new Date(tiempo).toLocaleString();
  }
  return "Formato desconocido";
};

// Agrupa las lecturas por timestamp para mostrarlas en una sola fila
const agruparLecturasPorTimestamp = (lecturas) => {
    if (!lecturas || lecturas.length === 0) return [];
    const mediciones = new Map();
    lecturas.forEach(lectura => {
        // La clave ahora incluye el id_nodo para evitar colisiones si dos nodos tienen el mismo timestamp
        const clave = `${lectura.id_nodo}-${lectura.timestamp.seconds}`;
        if (!mediciones.has(clave)) {
            mediciones.set(clave, {
                id_nodo: lectura.id_nodo,
                timestamp: lectura.timestamp,
                co2: '-',
                temperatura: '-',
                humedad: '-'
            });
        }
        const medicion = mediciones.get(clave);
        if (lectura.tipo_sensor.toLowerCase() === 'co2') {
            medicion.co2 = lectura.valor;
        } else if (lectura.tipo_sensor.toLowerCase() === 'temperatura') {
            medicion.temperatura = lectura.valor;
        } else if (lectura.tipo_sensor.toLowerCase() === 'humedad') {
            medicion.humedad = lectura.valor;
        }
    });
    // Devuelve ordenado por fecha, de más reciente a más antiguo
    return Array.from(mediciones.values()).sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
}

function ReadingsTable({ lecturas, showNodeColumn = false }) {
  const medicionesAgrupadas = agruparLecturasPorTimestamp(lecturas);

  if (medicionesAgrupadas.length === 0) {
    return <p>No hay lecturas para el período seleccionado.</p>;
  }

  return (
    <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '.25rem' }}>
      <table className="table table-striped table-hover table-sm mb-0">
        <thead className="thead-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            {showNodeColumn && <th>Nodo</th>}
            <th>Fecha y Hora</th>
            <th>CO₂ (ppm)</th>
            <th>Temp (°C)</th>
            <th>Humedad (%)</th>
          </tr>
        </thead>
        <tbody>
          {medicionesAgrupadas.map((medicion, index) => (
            <tr key={index}>
              {showNodeColumn && <td>{medicion.id_nodo ? medicion.id_nodo.substring(0, 6) + '...' : 'N/A'}</td>}
              <td>{formatearTiempo(medicion.timestamp)}</td>
              <td>{medicion.co2}</td>
              <td>{medicion.temperatura}</td>
              <td>{medicion.humedad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReadingsTable;

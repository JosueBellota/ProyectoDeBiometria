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

const getUnit = (tipoSensor) => {
    const tipo = tipoSensor ? tipoSensor.toLowerCase() : '';
    if (tipo === 'co') return 'ppm';
    if (tipo === 'no2') return 'µg/m³';
    if (tipo === 'o3') return 'µg/m³';
    return '';
};

function ReadingsTable({ lecturas, showNodeColumn = false, nodeIdToNameMap = new Map() }) {
  if (!lecturas || lecturas.length === 0) {
    return <p>No hay lecturas para el período seleccionado.</p>;
  }

  // Ordenar lecturas por fecha, de más reciente a más antiguo
  const lecturasOrdenadas = [...lecturas].sort((a, b) => {
    const timeA = a.timestamp.seconds || a.timestamp._seconds || 0;
    const timeB = b.timestamp.seconds || b.timestamp._seconds || 0;
    return timeB - timeA;
  });

  return (
    <div className="table-responsive" style={{ border: '1px solid #dee2e6', borderRadius: '.25rem' }}>
      <table className="table table-striped table-hover table-sm mb-0">
        <thead className="thead-dark" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
          <tr>
            {showNodeColumn && <th>Nodo</th>}
            <th>Fecha y Hora</th>
            <th>Tipo de Sensor</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {lecturasOrdenadas.map((lectura, index) => (
            <tr key={index}>
              {showNodeColumn && <td>{nodeIdToNameMap.get(lectura.id_nodo) || (lectura.id_nodo ? lectura.id_nodo.substring(0, 6) + '...' : 'N/A')}</td>}
              <td>{formatearTiempo(lectura.timestamp)}</td>
              <td>{lectura.tipo_sensor ? (lectura.tipo_sensor === 'co' ? 'CO' : lectura.tipo_sensor.toUpperCase()) : 'N/A'}</td>
              <td>{lectura.valor.toFixed(2)} {getUnit(lectura.tipo_sensor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReadingsTable;

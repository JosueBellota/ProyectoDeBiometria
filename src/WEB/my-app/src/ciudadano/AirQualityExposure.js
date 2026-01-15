import React, { useState, useEffect, useMemo } from 'react';

// ----------------------------------------------------------------------
// 1. Configuración de Escalas y Límites
// ----------------------------------------------------------------------
const LIMITS = {
    'co': { 
        name: 'Monóxido de Carbono',
        unit: 'mg/m³',
        ranges: [
            { max: 7, label: 'Buena', color: '#4caf50' },
            { max: 10, label: 'Regular', color: '#ffeb3b' },
            { max: Infinity, label: 'Mala', color: '#f44336' }
        ],
        official_acceptable: "0 - 7 mg/m³"
    },
    'no2': { 
        name: 'Dióxido de Nitrógeno',
        unit: 'µg/m³',
        ranges: [
            { max: 90, label: 'Buena', color: '#4caf50' },
            { max: 120, label: 'Regular', color: '#ffeb3b' },
            { max: Infinity, label: 'Mala', color: '#f44336' }
        ],
        official_acceptable: "0 - 90 µg/m³"
    },
    'o3': { 
        name: 'Ozono',
        unit: 'µg/m³',
        ranges: [
            { max: 100, label: 'Buena', color: '#4caf50' },
            { max: 130, label: 'Regular', color: '#ffeb3b' },
            { max: Infinity, label: 'Mala', color: '#f44336' }
        ],
        official_acceptable: "0 - 100 µg/m³"
    }
};

const getStatus = (type, value) => {
    const config = LIMITS[type];
    for (const r of config.ranges) {
        if (value <= r.max) return r;
    }
    return config.ranges[config.ranges.length - 1];
};

const AirQualityExposure = ({ startDate, endDate }) => {
    
    const [averages, setAverages] = useState({ co: 0, no2: 0, o3: 0 });

    // ----------------------------------------------------------------------
    // 2. Generación de Datos Ficticios para el Periodo
    // ----------------------------------------------------------------------
    useEffect(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Calculamos días de diferencia para saber cuántos puntos generar
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        
        // Generamos un promedio aleatorio base para cada contaminante para este usuario
        // CO: 0.5 - 9.0
        // NO2: 20 - 110
        // O3: 30 - 120
        const generateAvg = (min, max) => {
            let sum = 0;
            // Simulamos lecturas por cada día del periodo
            for (let i = 0; i < diffDays; i++) {
                // Variación diaria
                const dailyVal = min + Math.random() * (max - min);
                sum += dailyVal;
            }
            return sum / diffDays;
        };

        setAverages({
            co: generateAvg(0.5, 9.0),
            no2: generateAvg(20, 110),
            o3: generateAvg(30, 120)
        });

    }, [startDate, endDate]);


    return (
        <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            margin: '20px 0',
            fontFamily: '"Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.4rem' }}>
                    📉 Estimación de Exposición Personal
                </h3>
                <p style={{ color: '#7f8c8d', fontSize: '0.9rem', margin: 0 }}>
                    Promedio calculado sobre el periodo del <strong>{new Date(startDate).toLocaleDateString()}</strong> al <strong>{new Date(endDate).toLocaleDateString()}</strong>.
                </p>
            </div>

            {/* Grid de Tarjetas */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px'
            }}>
                {Object.keys(LIMITS).map((key) => {
                    const data = LIMITS[key];
                    const val = averages[key];
                    const status = getStatus(key, val);

                    return (
                        <div key={key} style={{
                            border: `1px solid ${status.color}40`, // Color borde suave
                            borderRadius: '12px',
                            padding: '15px',
                            backgroundColor: `${status.color}08`, // Fondo muy suave
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Barra lateral de color */}
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: '6px',
                                backgroundColor: status.color
                            }} />

                            <div style={{ marginLeft: '10px' }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#34495e', fontSize: '1rem' }}>
                                    {data.name} ({key.toUpperCase()})
                                </h4>
                                
                                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c3e50' }}>
                                        {val.toFixed(1)}
                                    </span>
                                    <span style={{ fontSize: '0.9rem', color: '#7f8c8d', marginLeft: '4px' }}>
                                        {data.unit}
                                    </span>
                                </div>

                                <div style={{ 
                                    display: 'inline-block',
                                    padding: '4px 10px', 
                                    borderRadius: '20px', 
                                    backgroundColor: status.color, 
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    marginBottom: '10px'
                                }}>
                                    {status.label}
                                </div>

                                <div style={{ 
                                    fontSize: '0.8rem', 
                                    color: '#555', 
                                    borderTop: '1px solid rgba(0,0,0,0.05)',
                                    paddingTop: '8px'
                                }}>
                                    <span style={{display: 'block', fontWeight: '600', marginBottom: '2px'}}>
                                        Rango Oficial Aceptable:
                                    </span>
                                    {data.official_acceptable}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#95a5a6', textAlign: 'center', fontStyle: 'italic' }}>
                * Estimación basada en simulaciones de tus rutas habituales y datos de estaciones cercanas.
            </div>
        </div>
    );
};

export default AirQualityExposure;
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
    // Si no hay valor (0 o undefined), asumimos bueno o un estado neutro
    if (!value && value !== 0) return { label: 'Sin datos', color: '#bdc3c7' };
    
    const config = LIMITS[type];
    for (const r of config.ranges) {
        if (value <= r.max) return r;
    }
    return config.ranges[config.ranges.length - 1];
};

const AirQualityExposure = ({ startDate, endDate, readings = [] }) => {
    
    const [averages, setAverages] = useState({ co: 0, no2: 0, o3: 0 });
    const [hasData, setHasData] = useState(false);

    // ----------------------------------------------------------------------
    // 2. Cálculo Real basado en lecturas proporcionadas
    // ----------------------------------------------------------------------
    useEffect(() => {
        // Filtramos por fecha, aunque se supone que el padre ya las filtra.
        // Pero para asegurar consistencia con el título del periodo:
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Ajustamos end para incluir todo el día
        end.setHours(23, 59, 59, 999);

        const validReadings = readings.filter(r => {
            const t = new Date(r.timestamp._seconds * 1000);
            return t >= start && t <= end;
        });

        if (validReadings.length === 0) {
            setAverages({ co: 0, no2: 0, o3: 0 });
            setHasData(false);
            return;
        }

        setHasData(true);

        const sums = { co: 0, no2: 0, o3: 0 };
        const counts = { co: 0, no2: 0, o3: 0 };

        validReadings.forEach(r => {
            const type = r.tipo_sensor ? r.tipo_sensor.toLowerCase() : '';
            if (sums.hasOwnProperty(type) && typeof r.valor === 'number') {
                sums[type] += r.valor;
                counts[type]++;
            }
        });

        setAverages({
            co: counts.co > 0 ? sums.co / counts.co : 0,
            no2: counts.no2 > 0 ? sums.no2 / counts.no2 : 0,
            o3: counts.o3 > 0 ? sums.o3 / counts.o3 : 0
        });

    }, [startDate, endDate, readings]);


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
                {!hasData && (
                    <p style={{ color: '#e67e22', fontWeight: 'bold', marginTop: '10px' }}>
                        ⚠️ No se encontraron lecturas para este periodo. Mostrando valores por defecto.
                    </p>
                )}
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

            {/* Calidad del Aire Media General */}
            <div style={{
                marginTop: '25px',
                padding: '20px',
                borderRadius: '12px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1.1rem' }}>
                    🌟 Calidad del Aire Global del Periodo
                </h4>
                
                {(() => {
                    // Calculamos la calidad general basada en el peor de los 3
                    const statusCO = getStatus('co', averages.co);
                    const statusNO2 = getStatus('no2', averages.no2);
                    const statusO3 = getStatus('o3', averages.o3);
                    
                    const severities = { '#4caf50': 1, '#ffeb3b': 2, '#f44336': 3, '#bdc3c7': 0 };
                    const labels = { '#4caf50': 'BUENA', '#ffeb3b': 'REGULAR', '#f44336': 'DESFAVORABLE', '#bdc3c7': 'SIN DATOS' };
                    
                    const maxSeverity = Math.max(
                        severities[statusCO.color],
                        severities[statusNO2.color],
                        severities[statusO3.color]
                    );
                    
                    // Si no hay datos (maxSeverity 0), mostramos gris
                    if (maxSeverity === 0) {
                         return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '2.2rem',
                                    fontWeight: '900',
                                    color: '#bdc3c7',
                                }}>
                                    SIN DATOS SUFICIENTES
                                </div>
                            </div>
                         );
                    }

                    const finalColor = Object.keys(severities).find(key => severities[key] === maxSeverity);
                    const finalLabel = labels[finalColor];

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                                fontSize: '2.2rem',
                                fontWeight: '900',
                                color: finalColor,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                                letterSpacing: '1px'
                            }}>
                                {finalLabel}
                            </div>
                            <p style={{ margin: '10px 0 0 0', color: '#555', maxWidth: '600px', fontSize: '0.95rem' }}>
                                {maxSeverity === 1 && "¡Felicidades! Tu exposición general ha sido óptima y saludable durante este periodo."}
                                {maxSeverity === 2 && "Atención: Algunos contaminantes han estado en niveles moderados. Se recomienda precaución en días de mayor actividad."}
                                {maxSeverity === 3 && "Aviso: Has estado expuesto a niveles elevados de contaminación. Considera reducir el tiempo en zonas de tráfico intenso."}
                            </p>
                        </div>
                    );
                })()}
            </div>
            
            <div style={{ marginTop: '20px', fontSize: '0.85rem', color: '#95a5a6', textAlign: 'center', fontStyle: 'italic' }}>
                * Calculado estrictamente a partir de las lecturas registradas en la plataforma.
            </div>
        </div>
    );
};

export default AirQualityExposure;

import React, { useState, useEffect, useMemo } from 'react';

const AirQualityExposure = ({ sensorType = 'calidad' }) => {
    // ----------------------------------------------------------------------
    // 1. Configuración de Escalas y Límites (Replicando lógica de Intranet)
    // ----------------------------------------------------------------------
    const limits = {
        'calidad': { low: 1, med: 2, high: 3, unit: '' },
        'co': { low: 0, med: 7, high: 10, unit: 'mg/m³' },
        'no2': { low: 0, med: 90, high: 120, unit: 'µg/m³' },
        'o3': { low: 0, med: 100, high: 130, unit: 'µg/m³' }
    };

    const getRecommendation = (val, type) => {
        const limit = limits[type] || limits['calidad'];
        if (type === 'calidad') {
            if (val <= 1.5) return { text: "Excelente. Disfruta del aire libre.", color: '#4caf50' }; // Green
            if (val <= 2.5) return { text: "Aceptable. Grupos sensibles deben tener precaución.", color: '#ffeb3b' }; // Yellow
            return { text: "Mala. Evita esfuerzos al aire libre.", color: '#f44336' }; // Red
        } else {
            if (val <= limit.med) return { text: "Niveles saludables.", color: '#4caf50' };
            if (val <= limit.high) return { text: "Niveles moderados.", color: '#ffeb3b' };
            return { text: "Niveles altos. Precaución.", color: '#f44336' };
        }
    };

    // ----------------------------------------------------------------------
    // 2. Datos Ficticios (Simulación de BBDD)
    // ----------------------------------------------------------------------
    // Generamos datos "históricos" para el día de hoy
    const generateDailyReadings = (type) => {
        const readings = [];
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0); // Desde las 8:00 AM
        
        const limit = limits[type];
        const baseValue = (limit.med + limit.low) / 2; // Un valor medio inicial

        for (let i = 0; i < 12; i++) { // 12 horas de lecturas
            const time = new Date(startOfDay.getTime() + i * 3600 * 1000);
            if (time > now) break; // No predecimos el futuro

            // Variación aleatoria
            let val;
            if (type === 'calidad') {
                val = 1 + Math.random() * 2; // 1 a 3
            } else {
                const noise = (Math.random() - 0.5) * (limit.high - limit.low); 
                val = Math.max(0, baseValue + noise);
            }
            
            readings.push({ time, value: val });
        }
        return readings;
    };

    const [readings, setReadings] = useState([]);

    useEffect(() => {
        setReadings(generateDailyReadings(sensorType));
    }, [sensorType]);

    // ----------------------------------------------------------------------
    // 3. Algoritmo de Agregación (Promedio Simple)
    // ----------------------------------------------------------------------
    const average = useMemo(() => {
        if (!readings.length) return 0;
        const sum = readings.reduce((acc, curr) => acc + curr.value, 0);
        return sum / readings.length;
    }, [readings]);

    // ----------------------------------------------------------------------
    // 4. Renderizado
    // ----------------------------------------------------------------------
    const limit = limits[sensorType] || limits['calidad'];
    const recommendation = getRecommendation(average, sensorType);
    
    // Cálculo de posición porcentual en la barra (0% a 100%)
    // Mapeamos: Low -> 0%, High -> 100% (con margen)
    let percent = 0;
    if (sensorType === 'calidad') {
        percent = ((average - 1) / (3 - 1)) * 100;
    } else {
        // Asumimos un rango visual de 0 a 1.5 * High para que no se salga
        const maxDisplay = limit.high * 1.5;
        percent = (average / maxDisplay) * 100;
    }
    percent = Math.max(0, Math.min(100, percent));

    return (
        <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            margin: '20px 0',
            textAlign: 'center',
            maxWidth: '100%',
            fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                📉 Estimación de Exposición Diaria
            </h3>
            
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
                Basado en tu actividad y las lecturas promedio de hoy.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.8rem', fontWeight: 'bold', color: '#555' }}>
                <span>Buena</span>
                <span>Regular</span>
                <span>Mala</span>
            </div>

            {/* Barra de Gradiente */}
            <div style={{
                height: '24px',
                width: '100%',
                background: 'linear-gradient(90deg, #4caf50 0%, #ffeb3b 50%, #f44336 100%)',
                borderRadius: '12px',
                position: 'relative',
                marginBottom: '15px'
            }}>
                {/* Marcador */}
                <div style={{
                    position: 'absolute',
                    left: `${percent}%`,
                    top: '-6px',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '36px',
                    backgroundColor: '#333',
                    border: '2px solid white',
                    borderRadius: '2px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    transition: 'left 0.5s ease-out'
                }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                    {average.toFixed(1)}
                </span>
                <span style={{ fontSize: '1rem', color: '#777', marginLeft: '5px' }}>
                    {limit.unit}
                </span>
            </div>

            <div style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '8px',
                borderLeft: `5px solid ${recommendation.color}`
            }}>
                <strong style={{ display: 'block', color: recommendation.color, marginBottom: '4px' }}>
                    Recomendación Oficial:
                </strong>
                <span style={{ color: '#555' }}>
                    {recommendation.text}
                </span>
            </div>
        </div>
    );
};

export default AirQualityExposure;

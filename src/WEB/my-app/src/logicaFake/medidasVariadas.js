// --------------------------------------------------------------------------
// Fichero: medidasVariadas.js
// Responsable: El Agente
//
// Descripción:
// Script para insertar 60 lecturas en el centro de Gandia.
// 20 lecturas por contaminante (CO, NO2, O3).
// Variación entre niveles recomendables, máximo permitido y peligrosos.
// Radio máximo de 250 metros.
// --------------------------------------------------------------------------

const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2"; 
const NODO_ID = "nodo_variado_test";

const GANDIA_CENTER_LAT = 38.96667;
const GANDIA_CENTER_LNG = -0.18333;
const MAX_RADIUS_METERS = 250;

// Aproximación de grados para 250m
// 1 grado latitud ~ 111 km -> 1 km = 1/111 deg -> 250m = 0.25/111 = 0.00225 deg
const MAX_RADIUS_DEG = 0.00225;

const SENSORS = ['co', 'no2', 'o3'];

// Rangos de valores
const RANGES = {
    'co': [
        { min: 0.5, max: 6.5, label: 'Bueno' },   // < 7
        { min: 7.1, max: 9.9, label: 'Regular' }, // 7 - 10
        { min: 10.1, max: 15.0, label: 'Malo' }   // > 10
    ],
    'no2': [
        { min: 10, max: 85, label: 'Bueno' },     // < 90
        { min: 91, max: 119, label: 'Regular' },  // 90 - 120
        { min: 121, max: 200, label: 'Malo' }     // > 120
    ],
    'o3': [
        { min: 20, max: 95, label: 'Bueno' },     // < 100
        { min: 101, max: 129, label: 'Regular' }, // 100 - 130
        { min: 131, max: 180, label: 'Malo' }     // > 130
    ]
};

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomLocation() {
    // Generar punto aleatorio dentro del círculo
    const r = MAX_RADIUS_DEG * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    return {
        lat: GANDIA_CENTER_LAT + r * Math.cos(theta),
        lng: GANDIA_CENTER_LNG + r * Math.sin(theta)
    };
}

export async function agregarMedidasVariadas() {
    console.log("🚀 Iniciando carga de 60 medidas variadas...");
    
    // 1. Crear el nodo contenedor si no existe (o asegurarnos de que existe)
    try {
        await fetch(`${BASE_URL}/nodos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: NODO_ID, propietarioId: PROPIETARIO_ID }),
        });
        console.log(`Nodo ${NODO_ID} asegurado.`);
    } catch (e) { 
        console.warn("Posiblemente el nodo ya existe o hubo error menor", e); 
    }

    let count = 0;

    for (const sensor of SENSORS) {
        for (let i = 0; i < 20; i++) {
            // Seleccionar rango aleatorio para variar (0: bueno, 1: regular, 2: malo)
            // Intentar distribuir equitativamente: i % 3
            const rangeType = i % 3; 
            const range = RANGES[sensor][rangeType];
            const valor = getRandomArbitrary(range.min, range.max);
            
            const loc = getRandomLocation();

            try {
                await fetch(`${BASE_URL}/lecturas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombreNodo: NODO_ID,
                        propietarioId: PROPIETARIO_ID,
                        lecturas: [{ tipo: sensor.toUpperCase(), valor: valor }],
                        latitud: loc.lat,
                        longitud: loc.lng,
                    }),
                });
                count++;
                if (count % 10 === 0) console.log(`Enviadas ${count}/60 lecturas...`);
            } catch (e) {
                console.error(`Error enviando lectura ${sensor} ${i}`, e);
            }
        }
    }
    console.log("✅ Carga de medidas variadas completada.");
    
    // --- NUEVO: 20 Lecturas alrededor de la Estación Oficial ---
    console.log("🚀 Añadiendo 20 lecturas cerca de la Estación Oficial...");
    
    const STATION_LAT = 38.968129;
    const STATION_LNG = -0.193242;
    const STATION_RADIUS_DEG = 0.003; // ~300 metros

    // Valores de referencia (Simulando lo que mide la estación)
    const STATION_REF = {
        'co': 0.3,   // mg/m3
        'no2': 12,   // µg/m3
        'o3': 50     // µg/m3
    };

    let stationCount = 0;
    for (let i = 0; i < 20; i++) {
        const sensor = SENSORS[i % 3]; // Rotar sensores: CO, NO2, O3
        
        // Distancia aleatoria (más probabilidad cerca del centro)
        const r = STATION_RADIUS_DEG * Math.pow(Math.random(), 2); 
        const theta = Math.random() * 2 * Math.PI;
        
        const lat = STATION_LAT + r * Math.cos(theta);
        const lng = STATION_LNG + r * Math.sin(theta);

        // Calcular variabilidad basada en la distancia
        // Si r es 0 (centro), variación es 0. Si es r_max, variación máxima.
        const distRatio = r / STATION_RADIUS_DEG;
        
        // Base oficial
        const baseValue = STATION_REF[sensor];
        
        // Ruido: A mayor distancia, más ruido (positivo o negativo)
        // Ejemplo CO: base 0.3. Ruido max +/- 2.0. En el centro +/- 0.
        // Ejemplo NO2: base 12. Ruido max +/- 30.
        let maxNoise = 0;
        if (sensor === 'co') maxNoise = 2.0; 
        if (sensor === 'no2') maxNoise = 40;
        if (sensor === 'o3') maxNoise = 40;

        const noise = (Math.random() * 2 - 1) * maxNoise * distRatio;
        
        let finalValue = baseValue + noise;
        
        // Asegurar que no sea negativo
        if (finalValue < 0) finalValue = 0;

        try {
            await fetch(`${BASE_URL}/lecturas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombreNodo: NODO_ID,
                    propietarioId: PROPIETARIO_ID,
                    lecturas: [{ tipo: sensor.toUpperCase(), valor: finalValue }],
                    latitud: lat,
                    longitud: lng,
                }),
            });
            stationCount++;
            if (stationCount % 5 === 0) console.log(`Estación Oficial: ${stationCount}/20 lecturas...`);
        } catch (e) {
            console.error(`Error enviando lectura estación ${i}`, e);
        }
    }
    console.log("✅ Lecturas de estación oficial añadidas.");
}

export async function eliminarMedidasVariadas() {
    console.log("🚀 Eliminando nodo de medidas variadas...");
    try {
        const response = await fetch(`${BASE_URL}/nodos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                nombreNodo: NODO_ID, 
                propietarioId: PROPIETARIO_ID 
            }),
        });

        if (response.ok) {
            console.log(`Nodo ${NODO_ID} y sus lecturas eliminados.`);
        } else {
            console.error(`Error eliminando nodo ${NODO_ID}: ${response.statusText}`);
            throw new Error(response.statusText);
        }
    } catch (e) {
        console.error(`Excepción eliminando nodo ${NODO_ID}`, e);
        throw e;
    }
}

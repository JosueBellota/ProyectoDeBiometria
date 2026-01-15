// --------------------------------------------------------------------------
// Fichero: medidasVariadas.js
// Responsable: El Agente
//
// Descripción:
// Script para insertar lecturas de prueba.
// Separado en:
// 1. Centro de Gandía (60 lecturas variadas).
// 2. Estación Oficial (20 lecturas simulando la estación).
// --------------------------------------------------------------------------

const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";
const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2"; 

const NODO_CENTRO_ID = "nodo_variado_test";
const NODO_ESTACION_ID = "nodo_estacion_test";

const GANDIA_CENTER_LAT = 38.96667;
const GANDIA_CENTER_LNG = -0.18333;

const STATION_LAT = 38.968129;
const STATION_LNG = -0.193242;

// Aproximación de grados para 250m
const MAX_RADIUS_DEG = 0.00225;
const STATION_RADIUS_DEG = 0.003; 

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

function getRandomLocation(centerLat, centerLng, radiusDeg) {
    const r = radiusDeg * Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;

    return {
        lat: centerLat + r * Math.cos(theta),
        lng: centerLng + r * Math.sin(theta)
    };
}

// --------------------------------------------------------------------------
// 1. LECTURAS VARIADAS EN EL CENTRO (60 Lecturas)
// --------------------------------------------------------------------------
export async function agregarMedidasCentro() {
    console.log("🚀 Iniciando carga de 60 medidas variadas en Centro...");
    
    try {
        await fetch(`${BASE_URL}/nodos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: NODO_CENTRO_ID, propietarioId: PROPIETARIO_ID }),
        });
        console.log(`Nodo ${NODO_CENTRO_ID} asegurado.`);
    } catch (e) { console.warn("Nodo ya existe o error", e); }

    let count = 0;

    for (const sensor of SENSORS) {
        for (let i = 0; i < 20; i++) {
            // i % 3 para distribuir Bueno/Regular/Malo equitativamente
            const rangeType = i % 3; 
            const range = RANGES[sensor][rangeType];
            const valor = getRandomArbitrary(range.min, range.max);
            
            const loc = getRandomLocation(GANDIA_CENTER_LAT, GANDIA_CENTER_LNG, MAX_RADIUS_DEG);

            try {
                await fetch(`${BASE_URL}/lecturas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombreNodo: NODO_CENTRO_ID,
                        propietarioId: PROPIETARIO_ID,
                        lecturas: [{ tipo: sensor.toUpperCase(), valor: valor }],
                        latitud: loc.lat,
                        longitud: loc.lng,
                    }),
                });
                count++;
                if (count % 10 === 0) console.log(`Centro: ${count}/60 lecturas...`);
            } catch (e) {
                console.error(`Error enviando lectura centro ${sensor} ${i}`, e);
            }
        }
    }
    console.log("✅ Carga de medidas CENTRO completada.");
}

export async function eliminarMedidasCentro() {
    console.log("🚀 Eliminando nodo de medidas CENTRO...");
    try {
        const response = await fetch(`${BASE_URL}/nodos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                nombreNodo: NODO_CENTRO_ID, 
                propietarioId: PROPIETARIO_ID 
            }),
        });

        if (response.ok) {
            console.log(`Nodo ${NODO_CENTRO_ID} eliminado.`);
        } else {
            throw new Error(response.statusText);
        }
    } catch (e) {
        console.error(`Excepción eliminando nodo ${NODO_CENTRO_ID}`, e);
        throw e;
    }
}

// --------------------------------------------------------------------------
// 2. LECTURAS ALREDEDOR DE LA ESTACIÓN OFICIAL (20 Lecturas)
// --------------------------------------------------------------------------
export async function agregarMedidasEstacion() {
    console.log("🚀 Iniciando carga de 20 medidas en Estación Oficial...");

    try {
        await fetch(`${BASE_URL}/nodos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: NODO_ESTACION_ID, propietarioId: PROPIETARIO_ID }),
        });
        console.log(`Nodo ${NODO_ESTACION_ID} asegurado.`);
    } catch (e) { console.warn("Nodo ya existe o error", e); }

    // Valores de referencia (Simulando lo que mide la estación)
    const STATION_REF = {
        'co': 0.3,   // mg/m3
        'no2': 12,   // µg/m3
        'o3': 50     // µg/m3
    };

    let stationCount = 0;
    for (let i = 0; i < 20; i++) {
        const sensor = SENSORS[i % 3]; // Rotar sensores
        
        // Distancia aleatoria centrada en la estación
        // Usamos la misma lógica manual para el radio cuadrado para concentrar en el centro
        const r = STATION_RADIUS_DEG * Math.pow(Math.random(), 2); 
        const theta = Math.random() * 2 * Math.PI;
        
        const lat = STATION_LAT + r * Math.cos(theta);
        const lng = STATION_LNG + r * Math.sin(theta);

        // Ruido según distancia
        const distRatio = r / STATION_RADIUS_DEG;
        const baseValue = STATION_REF[sensor];
        
        let maxNoise = 0;
        if (sensor === 'co') maxNoise = 2.0; 
        if (sensor === 'no2') maxNoise = 40;
        if (sensor === 'o3') maxNoise = 40;

        const noise = (Math.random() * 2 - 1) * maxNoise * distRatio;
        let finalValue = baseValue + noise;
        if (finalValue < 0) finalValue = 0;

        try {
            await fetch(`${BASE_URL}/lecturas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombreNodo: NODO_ESTACION_ID,
                    propietarioId: PROPIETARIO_ID,
                    lecturas: [{ tipo: sensor.toUpperCase(), valor: finalValue }],
                    latitud: lat,
                    longitud: lng,
                }),
            });
            stationCount++;
            if (stationCount % 5 === 0) console.log(`Estación: ${stationCount}/20 lecturas...`);
        } catch (e) {
            console.error(`Error enviando lectura estación ${i}`, e);
        }
    }
    console.log("✅ Carga de medidas ESTACIÓN completada.");
}

export async function eliminarMedidasEstacion() {
    console.log("🚀 Eliminando nodo de medidas ESTACIÓN...");
    try {
        const response = await fetch(`${BASE_URL}/nodos`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                nombreNodo: NODO_ESTACION_ID, 
                propietarioId: PROPIETARIO_ID 
            }),
        });

        if (response.ok) {
            console.log(`Nodo ${NODO_ESTACION_ID} eliminado.`);
        } else {
            throw new Error(response.statusText);
        }
    } catch (e) {
        console.error(`Excepción eliminando nodo ${NODO_ESTACION_ID}`, e);
        throw e;
    }
}

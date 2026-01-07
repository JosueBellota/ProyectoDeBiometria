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
        { min: 0, max: 440, label: 'Bueno' },
        { min: 450, max: 990, label: 'Regular' },
        { min: 1010, max: 1500, label: 'Malo' }
    ],
    'no2': [
        { min: 0, max: 90, label: 'Bueno' },
        { min: 100, max: 190, label: 'Regular' },
        { min: 210, max: 300, label: 'Malo' }
    ],
    'o3': [
        { min: 0, max: 110, label: 'Bueno' },
        { min: 120, max: 170, label: 'Regular' },
        { min: 190, max: 250, label: 'Malo' }
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

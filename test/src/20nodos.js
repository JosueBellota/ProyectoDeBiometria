// --------------------------------------------------------------------------
// Fichero: 20nodos.js
// Responsable: El Agente
//
// Descripción:
// Script para insertar 20 nodos formando una circunferencia.
// La separación entre nodos consecutivos es de aprox. 0.25 km.
// Patrón de colores: Rojo -> Amarillo -> Rojo.
// --------------------------------------------------------------------------

let fetch;
const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// 🔧 CONFIGURACIÓN
const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2"; 

// Centro en Gandia Playa
const CENTER_LAT = 39.00500;
const CENTER_LNG = -0.16500;

// Configuración Geométrica
const NUM_NODOS = 20;
const DISTANCIA_ENTRE_PUNTOS_KM = 0.25; 

// Cálculo del Perímetro y Radio necesarios
// Perímetro = NUM_NODOS * DISTANCIA
// Perímetro = 2 * PI * Radio  =>  Radio = (NUM_NODOS * DISTANCIA) / (2 * PI)
const perimetroTotal = NUM_NODOS * DISTANCIA_ENTRE_PUNTOS_KM;
const radiusKm = perimetroTotal / (2 * Math.PI);

const DEG_PER_KM = 0.009; // Aprox grados por km
const RADIUS_DEG = radiusKm * DEG_PER_KM;

console.log(`ℹ️ Configuración Circular:`)
console.log(`   - Distancia entre puntos: ${DISTANCIA_ENTRE_PUNTOS_KM} km`);
console.log(`   - Perímetro total: ${perimetroTotal} km`);
console.log(`   - Radio calculado: ${radiusKm.toFixed(3)} km`);

// Helper para API
async function callAPI(metodo, ruta, body = null) {
    if (!fetch) fetch = (await import('node-fetch')).default;

    try {
        const res = await fetch(`${BASE_URL}${ruta}`, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, data };
    } catch (err) {
        console.error(`❌ Error de red: ${err.message}`);
        return { ok: false, error: err.message };
    }
}

async function main() {
    console.log("🚀 Iniciando script de generación de 20 nodos...");

    for (let i = 1; i <= NUM_NODOS; i++) {
        const nodoId = `nodo_${i}`;
        
        // 1. Calcular Posición Circular
        const angle = ((i - 1) / NUM_NODOS) * 2 * Math.PI; 
        const lat = CENTER_LAT + RADIUS_DEG * Math.cos(angle);
        const lng = CENTER_LNG + RADIUS_DEG * Math.sin(angle);

        // 2. Determinar Valor (Color)
        // Patrón: Rojo (1-7) -> Amarillo (8-13) -> Rojo (14-20)
        let valorCO2;
        let colorLog;

        if (i <= 7) {
            valorCO2 = 1200 + Math.random() * 200; // Rojo
            colorLog = "🔴 Rojo";
        } else if (i <= 13) {
            valorCO2 = 600 + Math.random() * 200;  // Amarillo
            colorLog = "🟡 Amarillo";
        } else {
            valorCO2 = 1100 + Math.random() * 200; // Rojo
            colorLog = "🔴 Rojo";
        }
        
        valorCO2 = Math.round(valorCO2);

        // 3. Crear Nodo
        console.log(`\n📍 Procesando ${nodoId} (${colorLog})...`);
        await callAPI("POST", "/nodos", {
            nombre: nodoId,
            propietarioId: PROPIETARIO_ID,
        });

        // 4. Enviar Lecturas (2 por nodo)
        await callAPI("POST", "/lecturas", {
            nombreNodo: nodoId,
            propietarioId: PROPIETARIO_ID,
            lecturas: [{ tipo: 'CO', valor: valorCO2 }],
            latitud: lat,
            longitud: lng,
        });

        await callAPI("POST", "/lecturas", {
            nombreNodo: nodoId,
            propietarioId: PROPIETARIO_ID,
            lecturas: [{ tipo: 'CO', valor: valorCO2 + (Math.random() * 20 - 10) }],
            latitud: lat + 0.0001, 
            longitud: lng + 0.0001,
        });

        await new Promise(r => setTimeout(r, 50));
    }

    console.log("\n✅ Proceso completado.");
}

main();
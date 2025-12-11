// --------------------------------------------------------------------------
// Fichero: utils.js
// Responsable: El Agente
//
// Descripción:
// Este fichero contiene funciones de utilidad para interactuar con la API
// y realizar tareas administrativas como añadir datos de prueba o limpiar.
//
// USO:
// 1. Configura las variables PROPIETARIO_ID y NOMBRE_NODO.
// 2. Ejecuta desde la raíz del proyecto:
//    - node test/src/utils.js add
//    - node test/src/utils.js delete
// --------------------------------------------------------------------------

let fetch;

// --------------------------------------------------------------------------
// 🔧 CONFIGURACIÓN
// --------------------------------------------------------------------------
// ▼▼▼ RELLENA ESTOS VALORES ▼▼▼
const PROPIETARIO_ID = "mcJtObhq2iOpCnm6AT6xbFB8zYT2"; // Reemplaza con el ID del usuario propietario del nodo
const NOMBRE_NODO = "Nodo1"; // Reemplaza con el nombre del nodo
// ▲▲▲ FIN DE LA CONFIGURACIÓN ▲▲▲

const BASE_URL = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST";

// -----------------------------------------------------------------------------------
// callAPI(metodo, ruta, body)
//
// Función de ayuda para realizar llamadas a la API REST.
// -----------------------------------------------------------------------------------
async function callAPI(metodo, ruta, body = null) {
    // Importación dinámica de node-fetch para compatibilidad con Node.js
    if (!fetch) {
      fetch = (await import('node-fetch')).default;
    }

    try {
        console.log(`› ${metodo} ${ruta}`);
        const res = await fetch(`${BASE_URL}${ruta}`, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            console.log(`  ✅ Éxito: ${JSON.stringify(data)}`);
            return { ok: true, data };
        } else {
            console.error(`  ❌ Error ${res.status}: ${JSON.stringify(data.error || data)}`);
            return { ok: false, error: data.error || data };
        }
    } catch (err) {
        console.error(`  ❌ Error de red: ${err.message}`);
        return { ok: false, error: err.message };
    }
}

const offset = 0.00225; // Approximately 0.25 km
let idCounter = 0;
const gandiaCenterLat = 38.96667;
const gandiaCenterLng = -0.18333;


const generateReadings = (type, count, options) => {
    const readings = [];
    let range;
    // Values are generated to be around the color change thresholds
    switch (type) {
        case 'CO':
            range = { green: 400, yellow: 700, red: 1100 };
            break;
        case 'NO2':
            range = { green: 80, yellow: 150, red: 220 };
            break;
        case 'O3':
            range = { green: 100, yellow: 150, red: 190 };
            break;
        default:
            range = { green: 0, yellow: 0, red: 0 };
    }

    const side = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
        let lat, lng;
        const row = Math.floor(i / side);
        const col = i % side;

        lat = gandiaCenterLat + (row - side / 2) * offset * 0.5 + options.latOffset;
        lng = gandiaCenterLng + (col - side / 2) * offset * 0.5 + options.lngOffset;


        let medida;
        const third = count / 3;
        if (i < third) {
            medida = range.green + (Math.random() - 0.5) * 50;
        } else if (i < 2 * third) {
            medida = range.yellow + (Math.random() - 0.5) * 50;
        } else {
            medida = range.red + (Math.random() - 0.5) * 50;
        }
        medida = Math.max(0, Math.round(medida));

        const randomDate = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
        const fecha = randomDate.toLocaleString();

        readings.push({
            id: idCounter++,
            latitud: lat,
            longitud: lng,
            medida: medida,
            fecha: fecha,
            tipoSensor: type,
        });
    }

    const extraPoints = 10;
    const awayOffset = offset * 4; // 1km

    for (let i = 0; i < extraPoints; i++) {
        let lat, lng;
        const angle = (i / extraPoints) * 2 * Math.PI;
        lat = gandiaCenterLat + options.latOffset + Math.cos(angle) * awayOffset;
        lng = gandiaCenterLng + options.lngOffset + Math.sin(angle) * awayOffset;

        let medida = range.green + (Math.random() - 0.5) * 20; // mostly green
        medida = Math.max(0, Math.round(medida));

        const randomDate = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);
        const fecha = randomDate.toLocaleString();

        readings.push({
            id: idCounter++,
            latitud: lat,
            longitud: lng,
            medida: medida,
            fecha: fecha,
            tipoSensor: type,
        });
    }


    return readings;
};

const mockLecturas = [
    ...generateReadings('CO', 30, { latOffset: 0, lngOffset: 0 }),
    ...generateReadings('NO2', 30, { latOffset: offset * 0.3, lngOffset: offset * 0.3 }),
    ...generateReadings('O3', 30, { latOffset: -offset * 0.3, lngOffset: -offset * 0.3 }),
];


/**
 * Crea el nodo y añade 20 lecturas de sensores al nodo configurado.
 * Las lecturas se envían una por una con un pequeño retardo.
 */
async function anadirNuevasLecturas() {
    if (PROPIETARIO_ID === "ID_DEL_PROPIETARIO_AQUI" || NOMBRE_NODO === "NOMBRE_DEL_NODO_AQUI") {
        console.error("❌ Por favor, configura las variables PROPIETARIO_ID y NOMBRE_NODO en el fichero utils.js");
        return;
    }

    // 1. Crear el nodo primero
    console.log(`Intentando crear el nodo "${NOMBRE_NODO}" para el propietario ${PROPIETARIO_ID}...`);
    const resCreacion = await callAPI("POST", "/nodos", {
        nombre: NOMBRE_NODO,
        propietarioId: PROPIETARIO_ID,
    });

    // Si la creación del nodo falla (ej. porque ya existe), lo notificamos pero continuamos,
    // ya que el objetivo principal es añadir lecturas.
    if (!resCreacion.ok) {
        console.warn(`  ⚠️  No se pudo crear el nodo (puede que ya exista). Continuando con la adición de lecturas...`);
    }

    console.log(`Iniciando la adición de ${mockLecturas.length} lecturas...`);

    for (const lectura of mockLecturas) {
        await callAPI("POST", "/lecturas", {
            nombreNodo: NOMBRE_NODO,
            propietarioId: PROPIETARIO_ID,
            lecturas: [{ tipo: lectura.tipoSensor, valor: lectura.medida }],
            latitud: lectura.latitud,
            longitud: lectura.longitud,
        });

        // Pequeña pausa para asegurar timestamps diferentes
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log("🎉 Proceso completado.");
}

/**
 * Elimina el nodo configurado.
 */
async function eliminarElNodo() {
     if (PROPIETARIO_ID === "ID_DEL_PROPIETARIO_AQUI" || NOMBRE_NODO === "NOMBRE_DEL_NODO_AQUI") {
        console.error("❌ Por favor, configura las variables PROPIETARIO_ID y NOMBRE_NODO en el fichero utils.js");
        return;
    }
    console.log(`Iniciando la eliminación del nodo "${NOMBRE_NODO}"...`);
    await callAPI("DELETE", "/nodos", {
        nombreNodo: NOMBRE_NODO,
        propietarioId: PROPIETARIO_ID
    });
     console.log("🎉 Proceso completado.");
}


// --------------------------------------------------------------------------
// 🏃‍♂️ Ejecutor de comandos
// --------------------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'add') {
        await anadirNuevasLecturas();
    } else if (command === 'delete') {
        await eliminarElNodo();
    } else {
        console.log("Comando no reconocido. Usa 'add' o 'delete'.");
        console.log("Ejemplo: node test/src/utils.js add");
    }
}

// Solo se ejecuta si el fichero es llamado directamente desde la línea de comandos
if (require.main === module) {
    main();
}

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
const NOMBRE_NODO = "Nodo0"; // Reemplaza con el nombre del nodo
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

/**
 * Crea el nodo y añade 20 lecturas de sensores al nodo configurado.
 * Las lecturas se envían una por una con un pequeño retardo.
 */
async function anadir20Lecturas() {
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

    // 2. Añadir las 20 lecturas
    console.log(`Iniciando la adición de 20 lecturas al nodo "${NOMBRE_NODO}"...`);
    const lat = 38.96667; // Latitud de Gandia
    const lon = -0.18333; // Longitud de Gandia

    for (let i = 0; i < 20; i++) {
        const lecturas = [
            { tipo: "co2", valor: 400 + Math.floor(Math.random() * 150) },
            { tipo: "temperatura", valor: 20 + Math.random() * 5 },
            { tipo: "humedad", valor: 50 + Math.random() * 15 },
        ];
        
        // Añadimos una pequeña variación a la latitud y longitud
        const currentLat = lat + (Math.random() - 0.5) * 0.01;
        const currentLon = lon + (Math.random() - 0.5) * 0.01;

        await callAPI("POST", "/lecturas", {
            nombreNodo: NOMBRE_NODO,
            propietarioId: PROPIETARIO_ID,
            lecturas: lecturas,
            latitud: currentLat,
            longitud: currentLon,
        });

        // Pequeña pausa para asegurar timestamps diferentes
        await new Promise(resolve => setTimeout(resolve, 500)); 
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
        await anadir20Lecturas();
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

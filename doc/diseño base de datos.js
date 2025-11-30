
// =============================
// ==== AUTHENTICATION =========
// =============================
// {
//   "authId": "texto", 
//   "uid_usuario": "texto",
//   "correo": "texto", 
//   "contraseña": "hash-texto",
//   "creadoEn": "timestamp",
//   "ultimoLogin": "timestamp | null"
// }



// =========================
// ==== USUARIOS ===========
// =========================
// {
//   "uid": "texto",  
//   "nombre": "texto",
//   "correo": "texto",
//   "rol": "texto",     
//   "monedas": "número",
//   "premios": ["texto"],
//   "distancia": "número",
//   "creadoEn": "timestamp"
// }


// =========================
// ==== NODOS ===========
// =========================
// {
//   "propietarioId": "texto",
//   "nombre": "texto",
//   "ubicacion": "texto",
//   "sensores": {
//     "co2": "número | null",
//     "temperatura": "número | null",
//     "humedad": "número | null"
//   },
//   "tiempo": "timestamp"  
// }




// FORMATO SQL


// =========================
// ==== USUARIOS ===========
// =========================
//
//   uid: texto (clave primaria)  
//   nombre: texto
//   correo: texto (único)  
//   rol: texto (ej: "admin", "usuario")     
//   monedas: número
//   distancia: número
//   creado_en: timestamp

//   usuarios 1 ── N premios

// =========================
// ==== PREMIOS ===========
// =========================
//
//   id: número (clave primaria autoincremental)
//   uid_usuario: texto (FK → usuarios.uid)
//   premio: texto
//
// Relación:
//   usuarios 1 ── N premios

// ======================
// ==== NODOS ===========
// ======================
//   id: número (clave primaria autoincremental)
//   propietario_id: texto (FK → usuarios.uid)
//   nombre: texto
//   ubicacion: texto
//   co2: número | null
//   temperatura: número | null
//   humedad: número | null
//   tiempo: timestamp
//
// Relación:
//   usuarios 1 ── N nodos



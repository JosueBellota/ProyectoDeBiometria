
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
//   "id": "texto",
//   "propietarioId": "texto",
//   "nombre": "texto",
//   "creadoEn": "timestamp"
// }


// =========================
// ==== LECTURAS ===========
// =========================
// {
//   "id": "texto",
//   "idNodo": "texto",
//   "tiposensor": "texto",
//   "valor": "numero",
//   "latitud": "numero",
//   "longitud": "numero",
//   "timestamp": "timestamp"
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
//   id: texto (clave primaria)
//   propietario_id: texto (FK → usuarios.uid)
//   nombre: texto
//   creado_en: timestamp
//
// Relación:
//   usuarios 1 ── N nodos


// ======================
// ==== LECTURAS ========
// ======================
//   id: número (clave primaria autoincremental)
//   id_nodo: texto (FK → nodos.id)
//   tipo_sensor: texto (ej: "co2", "temperatura", "humedad")
//   valor: número
//   latitud: número
//   longitud: número
//   timestamp: timestamp
//
// Relación:
//   nodos 1 ── N lecturas



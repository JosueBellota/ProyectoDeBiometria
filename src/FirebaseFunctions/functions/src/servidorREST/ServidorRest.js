// -----------------------------------------------------------------------------------
// Fichero: ServidorREST.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero implementa el servidor RESTful para la aplicación.
// Maneja las rutas de la API, procesa las solicitudes HTTP y llama a la
// lógica de negocio correspondiente.
// -----------------------------------------------------------------------------------

const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const LogicaDeNegocio = require("../LogicaDeNegocio/LogicaDeNegocio");

const logica = new LogicaDeNegocio();

// -----------------------------------------------------------------------------------
// ServidorREST (función principal de Firebase)
//
// Parámetros:
//   - req: objeto de solicitud HTTP
//   - res: objeto de respuesta HTTP
//
// Lógica:
//   - Utiliza CORS para permitir solicitudes desde cualquier origen.
//   - Enruta las solicitudes según el método HTTP (GET, POST, PUT, DELETE)
//     y la ruta de la solicitud.
//   - Llama a los métodos correspondientes en la clase LogicaDeNegocio.
//   - Devuelve respuestas JSON con los resultados o errores.
// -----------------------------------------------------------------------------------
exports.ServidorREST = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const ruta = req.path;
      const rutaLower = ruta.toLowerCase();

      // ===================================================================================
      // ============================== RUTAS DE LECTURAS ================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /lecturas
      //
      // Endpoint unificado para obtener lecturas con filtros flexibles.
      // Acepta query params:
      // - Para nodo: nombreNodo, propietarioId
      // - Para ubicación: latitud, longitud, radio
      // - Para filtros de fecha: fechaInicio, fechaFin
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/lecturas")) {
        const opciones = {};

        // Extraer filtros de los query parameters
        if (req.query.nombreNodo) opciones.nombreNodo = req.query.nombreNodo;
        if (req.query.propietarioId) opciones.propietarioId = req.query.propietarioId;
        if (req.query.latitud) opciones.latitud = parseFloat(req.query.latitud);
        if (req.query.longitud) opciones.longitud = parseFloat(req.query.longitud);
        if (req.query.radio) opciones.radio = parseFloat(req.query.radio);
        if (req.query.fechaInicio) opciones.fechaInicio = new Date(req.query.fechaInicio);
        if (req.query.fechaFin) opciones.fechaFin = new Date(req.query.fechaFin);
        if (req.query.tipoSensor) opciones.tipoSensor = req.query.tipoSensor;

        const resultado = await logica.obtenerLecturas(opciones);
        return res.status(200).json(resultado);
      }

      // -----------------------------------------------------------------------------------
      // POST /lecturas
      //
      // Guarda nuevas lecturas para un nodo.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombreNodo": "...",
      //     "propietarioId": "...",
      //     "lecturas": [{ "tipo": "co2", "valor": 450 }, ...],
      //     "latitud": 40.7128,
      //     "longitud": -74.0060
      //   }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/lecturas") {
        const { nombreNodo, propietarioId, lecturas, latitud, longitud } = req.body;
        if (!nombreNodo || !propietarioId || !lecturas || latitud === undefined || longitud === undefined) {
          return res.status(400).json({
            error: "Se esperaba { nombreNodo, propietarioId, lecturas: [...], latitud, longitud }",
          });
        }

        await logica.GuardarLecturas(nombreNodo, propietarioId, lecturas, latitud, longitud);
        return res.status(200).json({ mensaje: "✅ Lecturas guardadas correctamente" });
      }

      // -----------------------------------------------------------------------------------
      // POST /lecturas/delete
      //
      // Elimina lecturas según un filtro, usando POST para permitir un cuerpo de solicitud.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombreNodo": "...",
      //     "propietarioId": "...",
      //     "opciones": { "fechaInicio": "...", "tipoSensor": "..." }
      //   }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/lecturas/delete") {
        const { nombreNodo, propietarioId, opciones } = req.body;
        if (!nombreNodo || !propietarioId || !opciones) {
          return res.status(400).json({
            error: "Se esperaba { nombreNodo, propietarioId, opciones: {...} }",
          });
        }
        const numEliminadas = await logica.eliminarLecturas(nombreNodo, propietarioId, opciones);
        return res.status(200).json({ mensaje: `🗑️ ${numEliminadas} lecturas eliminadas` });
      }

      // ===================================================================================
      // ================================ RUTAS DE USUARIOS ================================
      // ===================================================================================
      // -----------------------------------------------------------------------------------
      // GET /admin/nodos/:idAdmin
      // Devuelve todos los nodos con info del usuario y si están activos en las últimas 24h
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/admin/nodos/")) {
        const idAdmin = ruta.split("/")[3];
        const nodos = await logica.obtenerNodosDesdeAdmin(idAdmin);

        return nodos
          ? res.status(200).json(nodos)
          : res.status(403).json({ error: "No autorizado" });
      }

      // -----------------------------------------------------------------------------------
      // GET /usuarios/completo/:uid
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/usuarios/completo/")) {
        const uid = ruta.split("/")[3];
        const usuario = await logica.obtenerUsuario(uid);
        return usuario
          ? res.status(200).json(usuario)
          : res.status(404).json({ error: "Usuario no encontrado" });
      }

      // -----------------------------------------------------------------------------------
      // GET /usuarios/:idUsuario
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/usuarios/") && !rutaLower.startsWith("/usuarios/admin/")) {
        const idUsuario = ruta.split("/")[2];
        const usuario = await logica.obtenerUsuario(idUsuario);
        return usuario
          ? res.status(200).json(usuario)
          : res.status(404).json({ error: "Usuario no encontrado" });
      }

      // -----------------------------------------------------------------------------------
      // GET /usuarios/admin/:idAdmin
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/usuarios/admin/")) {
        const idAdmin = ruta.split("/")[3];
        const usuarios = await logica.obtenerUsuariosDesdeAdmin(idAdmin);
        return usuarios
          ? res.status(200).json(usuarios)
          : res.status(403).json({ error: "No autorizado" });
      }

      // -----------------------------------------------------------------------------------
      // POST /usuarios
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/usuarios") {
        const { nombre, correo, rol, password } = req.body;
        if (!nombre || !correo || !rol || !password) {
          return res.status(400).json({ error: "Datos incompletos" });
        }
        const idUsuario = await logica.crearUsuario(nombre, correo, rol, password);
        return res.status(200).json({ mensaje: "✅ Usuario creado", idUsuario });
      }

      // -----------------------------------------------------------------------------------
      // PUT /usuarios/:idUsuario
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.actualizarUsuario(idUsuario, req.body);
        return res.status(200).json({ mensaje: "✅ Usuario actualizado" });
      }

      // -----------------------------------------------------------------------------------
      // DELETE /usuarios/:idUsuario
      // -----------------------------------------------------------------------------------
      if (req.method === "DELETE" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.eliminarUsuario(idUsuario);
        return res.status(200).json({ mensaje: "🗑️ Usuario eliminado" });
      }

      // ===================================================================================
      // ================================= RUTAS DE NODOS ==================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /admin/nodos/:idAdmin
      //
      // Devuelve todos los nodos (de todos los usuarios) con:
      // - datos del nodo
      // - datos del propietario (nombre/correo)
      // - última lectura
      // - activo24h (si hay lectura en las últimas 24h)
      //
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/admin/nodos/")) {
        const idAdmin = ruta.split("/")[3];
        const resultado = await logica.obtenerNodosDesdeAdmin(idAdmin);
        return resultado
        ? res.status(200).json(resultado)
        : res.status(403).json({ error: "No autorizado" });
      }

      // -----------------------------------------------------------------------------------
      // GET /nodos/ubicacion
      //
      // Busca nodos únicos en un área geográfica.
      // Acepta: ?latitud=...&longitud=...&radio=... (en metros)
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower === "/nodos/ubicacion") {
        const opciones = {};
        if (req.query.latitud && req.query.longitud && req.query.radio) {
            opciones.latitud = parseFloat(req.query.latitud);
            opciones.longitud = parseFloat(req.query.longitud);
            opciones.radio = parseFloat(req.query.radio);
        } else {
          return res.status(400).json({ error: "Se requieren los parámetros: latitud, longitud y radio." });
        }

        const resultado = await logica.obtenerNodosUnicosPorUbicacion(opciones);
        return res.status(200).json(resultado);
      }
      
      // -----------------------------------------------------------------------------------
      // GET /nodos/propietario/:idPropietario
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/nodos/propietario/")) {
        const idPropietario = ruta.split("/")[3];
        const nodos = await logica.obtenerNodos(idPropietario);
        return res.status(200).json(nodos);
      }

      // -----------------------------------------------------------------------------------
      // POST /nodos
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/nodos") {
        const { nombre, propietarioId } = req.body;
        if (!nombre || !propietarioId) {
          return res.status(400).json({ error: "Datos incompletos: se requiere nombre y propietarioId" });
        }
        await logica.crearNodo(nombre, propietarioId);
        return res.status(200).json({ mensaje: "✅ Nodo creado" });
      }

      // -----------------------------------------------------------------------------------
      // PUT /nodos
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && rutaLower === "/nodos") {
        const { nombreNodo, propietarioId, datos } = req.body;
        await logica.actualizarNodo(nombreNodo, propietarioId, datos);
        return res.status(200).json({ mensaje: "✅ Nodo actualizado" });
      }

      // -----------------------------------------------------------------------------------
      // DELETE /nodos
      // -----------------------------------------------------------------------------------
      if (req.method === "DELETE" && rutaLower === "/nodos") {
        const { nombreNodo, propietarioId } = req.body;
        await logica.eliminarNodo(nombreNodo, propietarioId);
        return res.status(200).json({ mensaje: "🗑️ Nodo eliminado" });
      }
      
      // ===================================================================================
      // ============================= RUTAS DE INCIDENCIAS ==============================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // POST /incidencias
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/incidencias") {
        const { usuarioId, titulo, descripcion } = req.body;
        if (!usuarioId || !titulo || !descripcion) {
          return res.status(400).json({ error: "Faltan datos: usuarioId, titulo, descripcion" });
        }
        const id = await logica.reportarIncidencia(usuarioId, titulo, descripcion);
        return res.status(200).json({ mensaje: "✅ Incidencia reportada", idIncidencia: id });
      }

      // -----------------------------------------------------------------------------------
      // GET /incidencias
      // Query Params: ?usuarioId=...&estado=...
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower === "/incidencias") {
        const filtro = {};
        if (req.query.usuarioId) filtro.usuarioId = req.query.usuarioId;
        if (req.query.estado) filtro.estado = req.query.estado;

        const incidencias = await logica.obtenerIncidencias(filtro);
        return res.status(200).json(incidencias);
      }

      // -----------------------------------------------------------------------------------
      // PUT /incidencias/asignar
      // Body: { incidenciaId, adminId }
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && rutaLower === "/incidencias/asignar") {
        const { incidenciaId, adminId } = req.body;
        if (!incidenciaId || !adminId) {
          return res.status(400).json({ error: "Faltan datos: incidenciaId, adminId" });
        }
        await logica.asignarIncidencia(incidenciaId, adminId);
        return res.status(200).json({ mensaje: "✅ Incidencia asignada" });
      }

      // -----------------------------------------------------------------------------------
      // PUT /incidencias/resolver
      // Body: { incidenciaId, adminId, respuesta }
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && rutaLower === "/incidencias/resolver") {
        const { incidenciaId, adminId, respuesta } = req.body;
        if (!incidenciaId || !adminId || !respuesta) {
          return res.status(400).json({ error: "Faltan datos: incidenciaId, adminId, respuesta" });
        }
        await logica.resolverIncidencia(incidenciaId, adminId, respuesta);
        return res.status(200).json({ mensaje: "✅ Incidencia resuelta" });
      }

      // ===================================================================================
      // =============================== AUTOLOGIN Y LOGOUT ================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /autologin/:uid
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/autologin/")) {
        const uid = ruta.split("/")[2];
        try {
          const link = await logica.generarTokenAutologin(uid);
          if (!link) return res.status(404).json({ error: "Usuario no encontrado" });

          return res.status(200).json({ link });
        } catch (e) {
          return res.status(500).json({ error: e.message });
        }
      }

      // -----------------------------------------------------------------------------------
      // GET /logout/:uid
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/logout/")) {
        const uid = ruta.split("/")[2];
        const ok = await logica.revocarSesion(uid);

        return ok
          ? res.status(200).json({ mensaje: "⛔ Sesión revocada. El usuario será desconectado." })
          : res.status(500).json({ error: "No se pudo revocar la sesión del usuario" });
      }

      // ===================================================================================
      // ================================ NOTIFICACIONES ===================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // POST /notificar
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/notificar") {
        const { mensaje, color, topic } = req.body;
        await logica.enviarNotificacion(mensaje, color, topic);
        return res.status(200).json({ mensaje: "🔔 Notificación enviada" });
      }

      // -----------------------------------------------------------------------------------
      // Ruta no encontrada
      // -----------------------------------------------------------------------------------
      return res.status(404).json({ error: "Ruta no encontrada", ruta, metodo: req.method });

    } catch (error) {
      functions.logger.error("❌ Error en ServidorREST:", error);
      return res.status(500).json({ error: "Error interno", detalle: error.message });
    }
  });
});


// gcloud functions deploy ServidorREST --region=us-central1 --runtime=nodejs22 --trigger-http --service-account=proyectodebiometria@appspot.gserviceaccount.com --allow-unauthenticated
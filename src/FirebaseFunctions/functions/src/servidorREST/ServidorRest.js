// -----------------------------------------------------------------------------------
// Fichero: ServidorREST.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
// Descripción general:
// -----------------------------------------------------------------------------------
// Este módulo define y exporta una única función HTTPS de Firebase que actúa como
// servidor REST unificado.
//
// Expone endpoints para:
//  - Gestión de usuarios
//  - Gestión de nodos
//  - Registro y obtención de mediciones
//  - Vinculación y desvinculación de nodos con usuarios
//  - Envío de notificaciones
//
// Incluye:
//  - Manejo de CORS
//  - Validación de métodos HTTP
//  - Control de errores
//  - Registro de actividad
// -----------------------------------------------------------------------------------

const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const LogicaDeNegocio = require("../LogicaDeNegocio/LogicaDeNegocio");

// -----------------------------------------------------------------------------------
// Instancia de la lógica de negocio
// -----------------------------------------------------------------------------------
const logica = new LogicaDeNegocio();

// -----------------------------------------------------------------------------------
// Función principal del servidor REST
// -----------------------------------------------------------------------------------
exports.ServidorREST = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      functions.logger.info(`🌐 Petición recibida: ${req.method} ${req.path}`);

      // ✅ Mantener mayúsculas originales (importante para IDs)
      const ruta = req.path;
      // Usar versión en minúsculas solo para comparar rutas fijas
      const rutaLower = ruta.toLowerCase();

      // ===================================================================================
      // ============================== RUTAS DE MEDICIONES ================================
      // ===================================================================================

      // GET /mediciones/:idNodo
      if (req.method === "GET" && rutaLower.startsWith("/mediciones/")) {
        const idNodo = ruta.split("/")[2]; // conserva mayúsculas reales
        if (!idNodo) {
          return res.status(400).json({ error: "Falta parámetro idNodo" });
        }
        const resultado = await logica.obtenerMedidas(idNodo);
        if (!resultado) {
          return res.status(404).json({ error: `No se encontraron medidas para nodo ${idNodo}` });
        }
        return res.status(200).json(resultado);
      }

      // POST /mediciones
      if (req.method === "POST" && rutaLower === "/mediciones") {
        const { idNodo, medidas } = req.body;
        if (!idNodo || !medidas || typeof medidas !== "object") {
          return res.status(400).json({
            error: "Datos inválidos: se esperaba { idNodo, medidas: { co2?, temperatura?, humedad? } }",
          });
        }
        await logica.guardarMedida(idNodo, medidas);
        return res.status(200).json({ mensaje: "✅ Medidas registradas correctamente" });
      }

      // ===================================================================================
      // ================================ RUTAS DE USUARIOS ================================
      // ===================================================================================

      // GET /usuarios/:id
      if (req.method === "GET" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        const usuario = await logica.obtenerUsuario(idUsuario);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        return res.status(200).json(usuario);
      }

      // POST /usuarios
      if (req.method === "POST" && rutaLower === "/usuarios") {
        const { nombre, correo, rol, password } = req.body;
        if (!nombre || !correo || !rol || !password) {
          return res.status(400).json({
            error: "Datos incompletos: se esperaba { nombre, correo, rol, password }",
          });
        }
        const idUsuario = await logica.crearUsuario(nombre, correo, rol, password);
        if (!idUsuario) {
          return res.status(500).json({ error: "Error al crear usuario" });
        }
        return res.status(200).json({ mensaje: "✅ Usuario creado correctamente", idUsuario });
      }

      // PUT /usuarios/:id
      if (req.method === "PUT" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.actualizarUsuario(idUsuario, req.body);
        return res.status(200).json({ mensaje: "✅ Usuario actualizado" });
      }

      // DELETE /usuarios/:id
      if (req.method === "DELETE" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.eliminarUsuario(idUsuario);
        return res.status(200).json({ mensaje: "🗑️ Usuario eliminado" });
      }

      // ===================================================================================
      // ================================= RUTAS DE NODOS =================================
      // ===================================================================================

      // GET /nodos/:id
      if (req.method === "GET" && rutaLower.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        const nodo = await logica.obtenerNodo(idNodo);
        if (!nodo) return res.status(404).json({ error: "Nodo no encontrado" });
        return res.status(200).json(nodo);
      }

      // POST /nodos
      if (req.method === "POST" && rutaLower === "/nodos") {
        const { nombre, ubicacion, propietarioId } = req.body;
        if (!nombre || !ubicacion?.lat || !ubicacion?.lng || !propietarioId) {
          return res.status(400).json({
            error: "Datos incompletos o inválidos: se esperaba { nombre, ubicacion:{lat,lng}, propietarioId }",
          });
        }
        const idNodo = await logica.crearNodo(nombre, ubicacion, propietarioId);
        return res.status(200).json({ mensaje: "✅ Nodo creado", idNodo });
      }

      // PUT /nodos/:id
      if (req.method === "PUT" && rutaLower.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        await logica.actualizarNodo(idNodo, req.body);
        return res.status(200).json({ mensaje: "✅ Nodo actualizado" });
      }

      // DELETE /nodos/:id
      if (req.method === "DELETE" && rutaLower.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        await logica.eliminarNodo(idNodo);
        return res.status(200).json({ mensaje: "🗑️ Nodo eliminado" });
      }

      // ===================================================================================
      // ============================== VINCULACIÓN DE NODOS ===============================
      // ===================================================================================

      if (req.method === "POST" && rutaLower.endsWith("/vincularnodo")) {
        const idUsuario = ruta.split("/")[2];
        const { idNodo } = req.body;
        if (!idNodo) return res.status(400).json({ error: "Falta idNodo" });
        await logica.vincularNodoAUsuario(idUsuario, idNodo);
        return res.status(200).json({ mensaje: "✅ Nodo vinculado correctamente" });
      }

      if (req.method === "POST" && rutaLower.endsWith("/desvincularnodo")) {
        const idUsuario = ruta.split("/")[2];
        const { idNodo } = req.body;
        if (!idNodo) return res.status(400).json({ error: "Falta idNodo" });
        await logica.desvincularNodoDeUsuario(idUsuario, idNodo);
        return res.status(200).json({ mensaje: "✅ Nodo desvinculado correctamente" });
      }

      // ===================================================================================
      // ================================ NOTIFICACIONES ===================================
      // ===================================================================================

      if (req.method === "POST" && rutaLower === "/notificar") {
        const { mensaje } = req.body;
        if (!mensaje) return res.status(400).json({ error: "Falta el mensaje" });
        await logica.enviarNotificacion(mensaje);
        return res.status(200).json({ mensaje: "🔔 Notificación enviada correctamente" });
      }

      // -----------------------------------------------------------------------------------
      // Ruta no encontrada
      // -----------------------------------------------------------------------------------
      return res.status(404).json({
        error: "Ruta no encontrada o método no permitido",
        ruta: req.path,
        metodo: req.method,
      });

    } catch (error) {
      functions.logger.error("❌ Error en ServidorREST:", error);
      return res.status(500).json({
        error: "Error interno del servidor",
        detalle: error.message,
      });
    }
  });
});

// -----------------------------------------------------------------------------------
// Fin del fichero ServidorREST.js
// -----------------------------------------------------------------------------------

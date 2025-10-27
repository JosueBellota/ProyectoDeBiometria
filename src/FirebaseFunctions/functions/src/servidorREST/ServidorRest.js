// -----------------------------------------------------------------------------------
// Fichero: ServidorREST.js
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Descripción general:
// -----------------------------------------------------------------------------------
// Este módulo define y exporta una única función HTTPS de Firebase que actúa como
// servidor REST unificado.
//
// Expone endpoints para:
//  - Gestión de usuarios
//  - Gestión de nodos
//  - Registro, actualización y eliminación de mediciones
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
      // Reemplazado console.log por logger para trazabilidad en Firebase
      functions.logger.info(`🌐 Petición recibida: ${req.method} ${req.path}`);

      const ruta = req.path.toLowerCase();

      // ===================================================================================
      // ============================== RUTAS DE MEDICIONES ================================
      // ===================================================================================

      // GET /mediciones/:idNodo/:tipoSensor
      if (req.method === "GET" && ruta.startsWith("/mediciones/")) {
        const [_, __, idNodo, tipoSensor] = ruta.split("/");
        if (!idNodo || !tipoSensor)
          return res.status(400).json({ error: "Falta idNodo o tipoSensor" });
        const resultado = await logica.obtenerMedida(idNodo, tipoSensor);
        return res.status(200).json(resultado);
      }

      // POST /mediciones
      if (req.method === "POST" && ruta === "/mediciones") {
        const { idNodo, tipoSensor, valor } = req.body;
        if (!idNodo || !tipoSensor || valor === undefined) {
          return res.status(400).json({
            error: "Datos inválidos: se esperaba { idNodo, tipoSensor, valor }",
          });
        }
        await logica.guardarMedida(idNodo, tipoSensor, valor);
        return res.status(200).json({ mensaje: "✅ Medición guardada correctamente" });
      }

      // PUT /mediciones/:idNodo/:tipoSensor/:idMedicion
      if (req.method === "PUT" && ruta.startsWith("/mediciones/")) {
        const [_, __, idNodo, tipoSensor, idMedicion] = ruta.split("/");
        if (!idNodo || !tipoSensor || !idMedicion)
          return res.status(400).json({ error: "Ruta inválida" });
        await logica.actualizarMedida(idNodo, tipoSensor, idMedicion, req.body);
        return res.status(200).json({ mensaje: "✅ Medición actualizada correctamente" });
      }

      // DELETE /mediciones/:idNodo/:tipoSensor/:idMedicion
      if (req.method === "DELETE" && ruta.startsWith("/mediciones/")) {
        const [_, __, idNodo, tipoSensor, idMedicion] = ruta.split("/");
        if (!idNodo || !tipoSensor || !idMedicion)
          return res.status(400).json({ error: "Ruta inválida" });
        await logica.eliminarMedida(idNodo, tipoSensor, idMedicion);
        return res.status(200).json({ mensaje: "🗑️ Medición eliminada correctamente" });
      }

      // ===================================================================================
      // ================================ RUTAS DE USUARIOS ================================
      // ===================================================================================

      // GET /usuarios/:id
      if (req.method === "GET" && ruta.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        const usuario = await logica.obtenerUsuario(idUsuario);
        return res.status(200).json(usuario);
      }

      // POST /usuarios
      // Crea usuario con correo y password en Authentication y Firestore
      if (req.method === "POST" && ruta === "/usuarios") {
        const { nombre, correo, rol, password } = req.body;
        if (!nombre || !correo || !rol || !password) {
          return res.status(400).json({
            error: "Datos incompletos: se esperaba { nombre, correo, rol, password }",
          });
        }
        const idUsuario = await logica.crearUsuario(nombre, correo, rol, password);
        return res.status(200).json({ mensaje: "✅ Usuario creado correctamente", idUsuario });
      }

      // PUT /usuarios/:id
      // Actualiza datos de usuario, incluyendo correo y password
      if (req.method === "PUT" && ruta.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.actualizarUsuario(idUsuario, req.body);
        return res.status(200).json({ mensaje: "✅ Usuario actualizado" });
      }

      // DELETE /usuarios/:id
      if (req.method === "DELETE" && ruta.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.eliminarUsuario(idUsuario);
        return res.status(200).json({ mensaje: "🗑️ Usuario eliminado" });
      }

      // ===================================================================================
      // ================================= RUTAS DE NODOS =================================
      // ===================================================================================

      // GET /nodos/:id
      if (req.method === "GET" && ruta.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        const nodo = await logica.obtenerNodo(idNodo);
        return res.status(200).json(nodo);
      }

      // POST /nodos
      if (req.method === "POST" && ruta === "/nodos") {
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
      if (req.method === "PUT" && ruta.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        await logica.actualizarNodo(idNodo, req.body);
        return res.status(200).json({ mensaje: "✅ Nodo actualizado" });
      }

      // DELETE /nodos/:id
      if (req.method === "DELETE" && ruta.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        await logica.eliminarNodo(idNodo);
        return res.status(200).json({ mensaje: "🗑️ Nodo eliminado" });
      }

      // ===================================================================================
      // ============================== VINCULACIÓN DE NODOS ===============================
      // ===================================================================================

      // POST /usuarios/:idUsuario/vincularNodo
      if (req.method === "POST" && ruta.endsWith("/vincularnodo")) {
        const idUsuario = ruta.split("/")[2];
        const { idNodo } = req.body;
        await logica.vincularNodoAUsuario(idUsuario, idNodo);
        return res.status(200).json({ mensaje: "✅ Nodo vinculado correctamente" });
      }

      // POST /usuarios/:idUsuario/desvincularNodo
      if (req.method === "POST" && ruta.endsWith("/desvincularnodo")) {
        const idUsuario = ruta.split("/")[2];
        const { idNodo } = req.body;
        await logica.desvincularNodoDeUsuario(idUsuario, idNodo);
        return res.status(200).json({ mensaje: "✅ Nodo desvinculado correctamente" });
      }

      // ===================================================================================
      // ================================ NOTIFICACIONES ===================================
      // ===================================================================================

      // POST /notificar
      if (req.method === "POST" && ruta === "/notificar") {
        const { mensaje } = req.body;
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

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
// Su objetivo es exponer todos los endpoints necesarios para:
//  - Gestión de usuarios
//  - Gestión de nodos
//  - Registro y lectura de mediciones
//
// Cada ruta HTTP se despacha en función del método y la ruta solicitada.
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
      console.log(`🌐 Petición recibida: ${req.method} ${req.path}`);

      // Normalizamos ruta
      const ruta = req.path.toLowerCase();

      // ===================================================================================
      // ============================== RUTAS DE MEDICIONES ================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /mediciones/:idNodo
      // Obtiene la última medición del nodo indicado
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && ruta.startsWith("/mediciones/")) {
        const idNodo = ruta.split("/")[2];
        const resultado = await logica.obtenerMedida(idNodo);
        return res.status(200).json(resultado);
      }

      // -----------------------------------------------------------------------------------
      // POST /mediciones
      // Guarda una nueva medición
      // Body esperado: { idNodo, temperatura, co2 }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && ruta === "/mediciones") {
        const { idNodo, temperatura, co2 } = req.body;

        if (!idNodo || isNaN(temperatura) || isNaN(co2)) {
          return res.status(400).json({
            error: "Datos inválidos: se esperaba { idNodo, temperatura, co2 }",
          });
        }

        const resultado = await logica.guardarMedida(idNodo, { temperatura, co2 });
        return res.status(200).json(resultado);
      }

      // ===================================================================================
      // ================================ RUTAS DE USUARIOS ================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /usuarios/:id
      // Obtiene un usuario por su ID
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && ruta.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        const usuario = await logica.obtenerUsuario(idUsuario);
        return res.status(200).json(usuario);
      }

      // -----------------------------------------------------------------------------------
      // POST /usuarios
      // Crea un nuevo usuario
      // Body esperado: { nombre, correo, contraseña, rol }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && ruta === "/usuarios") {
        const { nombre, correo, contraseña, rol } = req.body;

        if (!nombre || !correo || !contraseña) {
          return res.status(400).json({
            error: "Datos incompletos: se esperaba { nombre, correo, contraseña, rol }",
          });
        }

        const resultado = await logica.crearUsuario(nombre, correo, contraseña, rol);
        if (!resultado.exito) {
          return res.status(400).json({
            error: "Error al crear usuario",
            detalle: resultado.error,
          });
        }

        return res.status(200).json({
          mensaje: "Usuario creado correctamente",
          uid: resultado.uid,
        });
      }

      // -----------------------------------------------------------------------------------
      // PUT /usuarios/:id
      // Actualiza datos del usuario
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && ruta.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        const resultado = await logica.actualizarUsuario(idUsuario, req.body);
        return res.status(200).json({ mensaje: "Usuario actualizado", resultado });
      }

      // -----------------------------------------------------------------------------------
      // DELETE /usuarios/:id
      // Elimina un usuario
      // -----------------------------------------------------------------------------------
      if (req.method === "DELETE" && ruta.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        const resultado = await logica.eliminarUsuario(idUsuario);
        return res.status(200).json({ mensaje: "Usuario eliminado", resultado });
      }

      // ===================================================================================
      // ================================= RUTAS DE NODOS =================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /nodos/:id
      // Obtiene un nodo por su ID
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && ruta.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        const nodo = await logica.obtenerNodo(idNodo);
        return res.status(200).json(nodo);
      }

      // -----------------------------------------------------------------------------------
      // POST /nodos
      // Crea un nuevo nodo y lo vincula al usuario propietario
      // Body esperado: { nombre, ubicacion, propietarioId }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && ruta === "/nodos") {
        const { nombre, ubicacion, propietarioId } = req.body;
        if (!nombre || !ubicacion || !propietarioId) {
          return res.status(400).json({
            error: "Datos incompletos: se esperaba { nombre, ubicacion, propietarioId }",
          });
        }

        const resultado = await logica.crearNodo(nombre, ubicacion, propietarioId);
        return res.status(200).json({ mensaje: "Nodo creado", idNodo: resultado });
      }

      // -----------------------------------------------------------------------------------
      // PUT /nodos/:id
      // Actualiza datos de un nodo
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && ruta.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        const resultado = await logica.actualizarNodo(idNodo, req.body);
        return res.status(200).json({ mensaje: "Nodo actualizado", resultado });
      }

      // -----------------------------------------------------------------------------------
      // DELETE /nodos/:id
      // Elimina un nodo
      // -----------------------------------------------------------------------------------
      if (req.method === "DELETE" && ruta.startsWith("/nodos/")) {
        const idNodo = ruta.split("/")[2];
        const resultado = await logica.eliminarNodo(idNodo);
        return res.status(200).json({ mensaje: "Nodo eliminado", resultado });
      }

      // ===================================================================================
      // ============================== VINCULACIÓN DE NODOS ===============================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // POST /usuarios/:idUsuario/vincularNodo
      // Body esperado: { idNodo }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && ruta.endsWith("/vincularnodo")) {
        const idUsuario = ruta.split("/")[2];
        const { idNodo } = req.body;
        if (!idNodo) {
          return res.status(400).json({ error: "Falta el parámetro idNodo" });
        }
        const resultado = await logica.vincularNodoAUsuario(idUsuario, idNodo);
        return res.status(200).json({ mensaje: "Nodo vinculado", resultado });
      }

      // -----------------------------------------------------------------------------------
      // POST /usuarios/:idUsuario/desvincularNodo
      // Body esperado: { idNodo }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && ruta.endsWith("/desvincularnodo")) {
        const idUsuario = ruta.split("/")[2];
        const { idNodo } = req.body;
        if (!idNodo) {
          return res.status(400).json({ error: "Falta el parámetro idNodo" });
        }
        const resultado = await logica.desvincularNodoDelUsuario(idUsuario, idNodo);
        return res.status(200).json({ mensaje: "Nodo desvinculado", resultado });
      }

      // ===================================================================================
      // ================================ NOTIFICACIONES ===================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // POST /notificar
      // Body esperado: { mensaje }
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && ruta === "/notificar") {
        const { mensaje } = req.body;
        if (!mensaje) {
          return res.status(400).json({ error: "Falta el campo mensaje" });
        }
        const resultado = await logica.enviarNotificacion(mensaje);
        return res.status(200).json({ mensaje: "Notificación enviada", resultado });
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
      // -----------------------------------------------------------------------------------
      // Manejo global de errores
      // -----------------------------------------------------------------------------------
      console.error("❌ Error en ServidorREST:", error);
      return res.status(500).json({
        error: "Error interno del servidor",
        detalle: error.message,
      });
    }
  });
}); // ServidorREST()

// -----------------------------------------------------------------------------------
// Fin del fichero ServidorREST.js
// -----------------------------------------------------------------------------------

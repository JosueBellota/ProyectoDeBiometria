// -----------------------------------------------------------------------------------
// Fichero: ServidorREST.js
// Responsable: Josue Bellota Ichaso
// -----------------------------------------------------------------------------------

const cors = require("cors")({ origin: true });
const functions = require("firebase-functions");
const LogicaDeNegocio = require("../LogicaDeNegocio/LogicaDeNegocio");

const logica = new LogicaDeNegocio();

exports.ServidorREST = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const ruta = req.path;
      const rutaLower = ruta.toLowerCase();

      // ===================================================================================
      // ============================== RUTAS DE MEDICIONES ================================
      // ===================================================================================

      // GET /mediciones/:propietarioId/:nombreNodo
      if (req.method === "GET" && rutaLower.startsWith("/mediciones/")) {
        const partes = ruta.split("/");
        const propietarioId = partes[2];
        const nombreNodo = partes[3];

        if (!propietarioId || !nombreNodo) {
          return res.status(400).json({ error: "Faltan parámetros propietarioId y nombreNodo" });
        }

        const resultado = await logica.obtenerMedidas(nombreNodo, propietarioId);
        return resultado
          ? res.status(200).json(resultado)
          : res.status(404).json({ error: `No se encontraron medidas para nodo "${nombreNodo}"` });
      }

      // POST /mediciones
      if (req.method === "POST" && rutaLower === "/mediciones") {
        const { nombreNodo, propietarioId, medidas } = req.body;
        if (!nombreNodo || !propietarioId || !medidas) {
          return res.status(400).json({
            error: "Se esperaba { nombreNodo, propietarioId, medidas: {...} }",
          });
        }

        await logica.guardarMedidas(nombreNodo, propietarioId, medidas);
        return res.status(200).json({ mensaje: "✅ Medidas guardadas correctamente" });
      }

      // ===================================================================================
      // ================================ RUTAS DE USUARIOS ================================
      // ===================================================================================

      // ✅ NUEVO ENDPOINT UNIVERSAL: GET /usuarios/completo/:uid
      if (req.method === "GET" && rutaLower.startsWith("/usuarios/completo/")) {
        const uid = ruta.split("/")[3];
        const usuario = await logica.obtenerUsuario(uid);
        return usuario
          ? res.status(200).json(usuario)
          : res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (req.method === "GET" && rutaLower.startsWith("/usuarios/") && !rutaLower.startsWith("/usuarios/admin/")) {
        const idUsuario = ruta.split("/")[2];
        const usuario = await logica.obtenerUsuario(idUsuario);
        return usuario
          ? res.status(200).json(usuario)
          : res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (req.method === "GET" && rutaLower.startsWith("/usuarios/admin/")) {
        const idAdmin = ruta.split("/")[3];
        const usuarios = await logica.obtenerUsuariosDesdeAdmin(idAdmin);
        return usuarios
          ? res.status(200).json(usuarios)
          : res.status(403).json({ error: "No autorizado" });
      }

      if (req.method === "POST" && rutaLower === "/usuarios") {
        const { nombre, correo, rol, password } = req.body;
        if (!nombre || !correo || !rol || !password) {
          return res.status(400).json({ error: "Datos incompletos" });
        }
        const idUsuario = await logica.crearUsuario(nombre, correo, rol, password);
        return res.status(200).json({ mensaje: "✅ Usuario creado", idUsuario });
      }

      if (req.method === "PUT" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.actualizarUsuario(idUsuario, req.body);
        return res.status(200).json({ mensaje: "✅ Usuario actualizado" });
      }

      if (req.method === "DELETE" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.eliminarUsuario(idUsuario);
        return res.status(200).json({ mensaje: "🗑️ Usuario eliminado" });
      }

      // ===================================================================================
      // ================================= RUTAS DE NODOS =================================
      // ===================================================================================

      // GET /nodos/propietario/:idPropietario
      if (req.method === "GET" && rutaLower.startsWith("/nodos/propietario/")) {
        const idPropietario = ruta.split("/")[3];
        const nodos = await logica.obtenerNodos(idPropietario);
        return res.status(200).json(nodos);
      }

      // POST /nodos   { nombreNodo, ubicacion, propietarioId }
      if (req.method === "POST" && rutaLower === "/nodos") {
        const { nombre, ubicacion, propietarioId } = req.body;
        if (!nombre || !ubicacion || !propietarioId) {
          return res.status(400).json({ error: "Datos incompletos" });
        }
        await logica.crearNodo(nombre, ubicacion, propietarioId);
        return res.status(200).json({ mensaje: "✅ Nodo creado" });
      }

      // PUT /nodos   { nombreNodo, propietarioId, datos }
      if (req.method === "PUT" && rutaLower === "/nodos") {
        const { nombreNodo, propietarioId, datos } = req.body;
        await logica.actualizarNodo(nombreNodo, propietarioId, datos);
        return res.status(200).json({ mensaje: "✅ Nodo actualizado" });
      }

      // DELETE /nodos   { nombreNodo, propietarioId }
      if (req.method === "DELETE" && rutaLower === "/nodos") {
        const { nombreNodo, propietarioId } = req.body;
        await logica.eliminarNodo(nombreNodo, propietarioId);
        return res.status(200).json({ mensaje: "🗑️ Nodo eliminado" });
      }

    // GET /autologin/:uid
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


      // ===================================================================================
      // ================================ NOTIFICACIONES ===================================
      // ===================================================================================

      if (req.method === "POST" && rutaLower === "/notificar") {
        const { mensaje, color, topic } = req.body;
        await logica.enviarNotificacion(mensaje, color, topic);
        return res.status(200).json({ mensaje: "🔔 Notificación enviada" });
      }

      return res.status(404).json({ error: "Ruta no encontrada", ruta, metodo: req.method });

    } catch (error) {
      functions.logger.error("❌ Error en ServidorREST:", error);
      return res.status(500).json({ error: "Error interno", detalle: error.message });
    }
  });
});


// deploy
// gcloud functions deploy ServidorREST --region=us-central1 --runtime=nodejs22 --trigger-http --service-account=proyectodebiometria@appspot.gserviceaccount.com --allow-unauthenticated


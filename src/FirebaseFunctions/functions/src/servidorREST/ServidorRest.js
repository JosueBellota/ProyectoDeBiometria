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
      // ============================== RUTAS DE MEDICIONES ================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /mediciones/:propietarioId/:nombreNodo
      //
      // Obtiene las últimas mediciones de un nodo específico.
      //
      // Parámetros en URL:
      //   - propietarioId: ID del usuario propietario del nodo.
      //   - nombreNodo: Nombre del nodo.
      //
      // Respuesta:
      //   - 200 OK: JSON con las mediciones { sensores, tiempo }.
      //   - 404 Not Found: Si el nodo no se encuentra.
      // -----------------------------------------------------------------------------------
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

      // -----------------------------------------------------------------------------------
      // POST /mediciones
      //
      // Guarda nuevas mediciones para un nodo.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombreNodo": "...",
      //     "propietarioId": "...",
      //     "medidas": { "co2": ..., "temperatura": ..., "humedad": ... }
      //   }
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      //   - 400 Bad Request: Si faltan datos en el cuerpo.
      // -----------------------------------------------------------------------------------
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

      // -----------------------------------------------------------------------------------
      // GET /usuarios/completo/:uid
      //
      // Obtiene los datos completos de un usuario, incluyendo su rol.
      //
      // Parámetros en URL:
      //   - uid: ID del usuario.
      //
      // Respuesta:
      //   - 200 OK: JSON con los datos del usuario.
      //   - 404 Not Found: Si el usuario no se encuentra.
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
      //
      // Obtiene los datos de un usuario específico.
      //
      // Parámetros en URL:
      //   - idUsuario: ID del usuario a obtener.
      //
      // Respuesta:
      //   - 200 OK: JSON con los datos del usuario.
      //   - 404 Not Found: Si el usuario no se encuentra.
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
      //
      // Obtiene una lista de todos los usuarios (solo para administradores).
      //
      // Parámetros en URL:
      //   - idAdmin: ID del usuario administrador que realiza la solicitud.
      //
      // Respuesta:
      //   - 200 OK: Array de objetos de usuario.
      //   - 403 Forbidden: Si el solicitante no es un administrador.
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
      //
      // Crea un nuevo usuario en el sistema.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombre": "...",
      //     "correo": "...",
      //     "rol": "...",
      //     "password": "..."
      //   }
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación y el ID del nuevo usuario.
      //   - 400 Bad Request: Si faltan datos.
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
      //
      // Actualiza los datos de un usuario.
      //
      // Parámetros en URL:
      //   - idUsuario: ID del usuario a actualizar.
      //
      // Cuerpo de la solicitud (JSON):
      //   - Objeto con los campos a actualizar.
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && rutaLower.startsWith("/usuarios/")) {
        const idUsuario = ruta.split("/")[2];
        await logica.actualizarUsuario(idUsuario, req.body);
        return res.status(200).json({ mensaje: "✅ Usuario actualizado" });
      }

      // -----------------------------------------------------------------------------------
      // DELETE /usuarios/:idUsuario
      //
      // Elimina un usuario del sistema.
      //
      // Parámetros en URL:
      //   - idUsuario: ID del usuario a eliminar.
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
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
      // GET /nodos/propietario/:idPropietario
      //
      // Obtiene todos los nodos de un propietario específico.
      //
      // Parámetros en URL:
      //   - idPropietario: ID del usuario propietario.
      //
      // Respuesta:
      //   - 200 OK: Array de objetos de nodo.
      // -----------------------------------------------------------------------------------
      if (req.method === "GET" && rutaLower.startsWith("/nodos/propietario/")) {
        const idPropietario = ruta.split("/")[3];
        const nodos = await logica.obtenerNodos(idPropietario);
        return res.status(200).json(nodos);
      }

      // -----------------------------------------------------------------------------------
      // POST /nodos
      //
      // Crea un nuevo nodo.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombre": "...",
      //     "ubicacion": "...",
      //     "propietarioId": "..."
      //   }
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      //   - 400 Bad Request: Si faltan datos.
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/nodos") {
        const { nombre, ubicacion, propietarioId } = req.body;
        if (!nombre || !ubicacion || !propietarioId) {
          return res.status(400).json({ error: "Datos incompletos" });
        }
        await logica.crearNodo(nombre, ubicacion, propietarioId);
        return res.status(200).json({ mensaje: "✅ Nodo creado" });
      }

      // -----------------------------------------------------------------------------------
      // PUT /nodos
      //
      // Actualiza un nodo existente.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombreNodo": "...",
      //     "propietarioId": "...",
      //     "datos": { ... } // Campos a actualizar
      //   }
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      // -----------------------------------------------------------------------------------
      if (req.method === "PUT" && rutaLower === "/nodos") {
        const { nombreNodo, propietarioId, datos } = req.body;
        await logica.actualizarNodo(nombreNodo, propietarioId, datos);
        return res.status(200).json({ mensaje: "✅ Nodo actualizado" });
      }

      // -----------------------------------------------------------------------------------
      // DELETE /nodos
      //
      // Elimina un nodo.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "nombreNodo": "...",
      //     "propietarioId": "..."
      //   }
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      // -----------------------------------------------------------------------------------
      if (req.method === "DELETE" && rutaLower === "/nodos") {
        const { nombreNodo, propietarioId } = req.body;
        await logica.eliminarNodo(nombreNodo, propietarioId);
        return res.status(200).json({ mensaje: "🗑️ Nodo eliminado" });
      }
      
      // ===================================================================================
      // =============================== AUTOLOGIN Y LOGOUT ================================
      // ===================================================================================

      // -----------------------------------------------------------------------------------
      // GET /autologin/:uid
      //
      // Genera un enlace de inicio de sesión automático para un usuario.
      //
      // Parámetros en URL:
      //   - uid: ID del usuario.
      //
      // Respuesta:
      //   - 200 OK: JSON con el enlace de autologin.
      //   - 404 Not Found: Si el usuario no se encuentra.
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
      //
      // Revoca los tokens de refresco de un usuario, forzando el cierre de sesión.
      //
      // Parámetros en URL:
      //   - uid: ID del usuario.
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      //   - 500 Internal Server Error: Si la sesión no pudo ser revocada.
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
      //
      // Envía una notificación a un tópico específico.
      //
      // Cuerpo de la solicitud (JSON):
      //   {
      //     "mensaje": "...",
      //     "color": "...",
      //     "topic": "..."
      //   }
      //
      // Respuesta:
      //   - 200 OK: Mensaje de confirmación.
      // -----------------------------------------------------------------------------------
      if (req.method === "POST" && rutaLower === "/notificar") {
        const { mensaje, color, topic } = req.body;
        await logica.enviarNotificacion(mensaje, color, topic);
        return res.status(200).json({ mensaje: "🔔 Notificación enviada" });
      }

      // -----------------------------------------------------------------------------------
      // Ruta no encontrada
      //
      // Si ninguna de las rutas anteriores coincide, devuelve un error 404.
      // -----------------------------------------------------------------------------------
      return res.status(404).json({ error: "Ruta no encontrada", ruta, metodo: req.method });

    } catch (error) {
      functions.logger.error("❌ Error en ServidorREST:", error);
      return res.status(500).json({ error: "Error interno", detalle: error.message });
    }
  });
});


// deploy
// gcloud functions deploy ServidorREST --region=us-central1 --runtime=nodejs22 --trigger-http --service-account=proyectodebiometria@appspot.gserviceaccount.com --allow-unauthenticated


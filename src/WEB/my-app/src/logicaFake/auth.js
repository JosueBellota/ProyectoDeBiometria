// logicaFake/auth.js
import { API_BASE, firebaseConfig } from "./config";
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------------------------------------------------
// Registrar ciudadano
// ---------------------------------------------------------
export async function registrarCiudadano(nombre, correo, password) {
  try {
    console.log("🟦 Registrando usuario en backend:", correo);

    // Llamada al Servidor REST (tu API)
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        correo,
        rol: "ciudadano",
        password,
      }),
    });

    const data = await res.json();
    console.log("🟢 Respuesta del ServidorREST:", data);

    if (!res.ok) throw new Error(data.error || "Error al registrar en backend");

    // Iniciamos sesión con Firebase (para obtener token)
    const authRes = await signInWithEmailAndPassword(auth, correo, password);
    const user = authRes.user;
    const token = await user.getIdToken();

    console.log("✅ Usuario autenticado con Firebase:");
    console.log("   UID:", user.uid);
    console.log("   Token JWT:", token.substring(0, 40) + "..."); // truncamos por seguridad

    const usuario = { uid: user.uid, correo, token, nombre };
    localStorage.setItem("usuario", JSON.stringify(usuario));

    return usuario;
  } catch (error) {
    console.error("❌ Error en registrarCiudadano:", error);
    return null;
  }
}

// ---------------------------------------------------------
// Iniciar sesión
// ---------------------------------------------------------
export async function loginUsuario(correo, password) {
  try {
    console.log("🟦 Iniciando sesión en Firebase:", correo);

    const userCredential = await signInWithEmailAndPassword(auth, correo, password);
    const user = userCredential.user;
    const token = await user.getIdToken();

    console.log("✅ Sesión iniciada con Firebase:");
    console.log("   UID:", user.uid);
    console.log("   Token JWT:", token.substring(0, 40) + "...");

    const usuario = { uid: user.uid, correo: user.email, token };
    localStorage.setItem("usuario", JSON.stringify(usuario));

    return usuario;
  } catch (error) {
    console.error("❌ Error en loginUsuario:", error.code, error.message);
    return null;
  }
}

// ---------------------------------------------------------
// Actualizar usuario en backend
// ---------------------------------------------------------
export async function actualizarUsuario(idUsuario, nuevosDatos) {
  try {
    console.log(`🟨 Actualizando usuario ${idUsuario} en ServidorREST...`);

    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevosDatos),
    });

    const data = await res.json();
    console.log("🟢 Respuesta del ServidorREST:", data);

    if (!res.ok) throw new Error(data.error || "Error al actualizar usuario");

    const usuarioActualizado = { ...obtenerUsuarioLogueado(), ...nuevosDatos };
    localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

    console.log("✅ Usuario actualizado en localStorage:", usuarioActualizado);
    return usuarioActualizado;
  } catch (error) {
    console.error("❌ Error en actualizarUsuario:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// Escuchar sesión persistente (Firebase)
// ---------------------------------------------------------
export function escucharSesion(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      console.log("🟩 Sesión detectada (persistente):");
      console.log("   UID:", user.uid);
      console.log("   Token JWT:", token.substring(0, 40) + "...");

      const usuario = { uid: user.uid, correo: user.email, token };
      localStorage.setItem("usuario", JSON.stringify(usuario));
      callback(usuario);
    } else {
      console.log("🟥 No hay sesión activa");
      localStorage.removeItem("usuario");
      callback(null);
    }
  });
}

// ---------------------------------------------------------
export function obtenerUsuarioLogueado() {
  const user = localStorage.getItem("usuario");
  return user ? JSON.parse(user) : null;
}

// ---------------------------------------------------------
export async function cerrarSesion() {
  try {
    console.log("🟠 Cerrando sesión en Firebase...");
    await signOut(auth);
  } catch (e) {
    console.error("⚠️ Error cerrando sesión:", e);
  }
  localStorage.removeItem("usuario");
}

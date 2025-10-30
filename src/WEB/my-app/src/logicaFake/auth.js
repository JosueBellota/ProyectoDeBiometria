import { API_BASE, firebaseConfig } from "./config";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword} from "firebase/auth";

// ---------------------------------------------------------
// Inicialización de Firebase
// ---------------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------------------------------------------------
// Registro de usuario (solo backend)
// ---------------------------------------------------------
export async function registrarCiudadano(nombre, correo, password) {
  try {
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        correo,
        rol: "ciudadano",
        password
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrar en backend");

    console.log("✅ Usuario registrado correctamente en backend:", data.idUsuario);
    return data.idUsuario;
  } catch (error) {
    console.error("❌ Error en registrarCiudadano:", error);
    return null;
  }
}


// ---------------------------------------------------------
// Login directo con Firebase Auth
// ---------------------------------------------------------
export async function loginUsuario(correo, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, correo, password);
    const user = userCredential.user;

    console.log("✅ Login exitoso:", user.uid);

    const usuario = {
      uid: user.uid,
      correo: user.email,
      nombre: user.displayName || correo.split("@")[0],
    };

    localStorage.setItem("usuario", JSON.stringify(usuario));
    return user.uid;
  } catch (error) {
    console.error("❌ Error en loginUsuario:", error.code, error.message);
    return null;
  }
}

// ---------------------------------------------------------
// Verificar sesión actual
// ---------------------------------------------------------
export function obtenerUsuarioLogueado() {
  const user = localStorage.getItem("usuario");
  return user ? JSON.parse(user) : null;
}

// ---------------------------------------------------------
// Actualizar datos de usuario
// ---------------------------------------------------------
export async function actualizarUsuario(idUsuario, nuevosDatos) {
  try {
    const res = await fetch(`${API_BASE}/usuarios/${idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevosDatos),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al actualizar usuario");

    // Si se actualiza correctamente, también actualizamos localStorage
    const usuarioActualizado = { ...obtenerUsuarioLogueado(), ...nuevosDatos };
    localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

    console.log("✅ Usuario actualizado correctamente:", usuarioActualizado);
    return usuarioActualizado;
  } catch (error) {
    console.error("❌ Error en actualizarUsuario:", error);
    throw error;
  }
}

// ---------------------------------------------------------
// Logout
// ---------------------------------------------------------
export async function cerrarSesion() {
  try {
    await auth.signOut();
  } catch (e) {
    console.error("⚠️ Error cerrando sesión:", e);
  }
  localStorage.removeItem("usuario");
}

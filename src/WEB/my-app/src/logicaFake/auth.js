import { API_BASE, firebaseConfig } from "./config";


import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// ---------------------------------------------------------
// Inicialización de Firebase
// ---------------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------------------------------------------------
// Registro de usuario (crea cuenta en Firebase Auth)
// ---------------------------------------------------------
export async function registrarCiudadano(nombre, correo, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, correo, password);
    const user = userCredential.user;

    // Guardar también en tu backend
    const res = await fetch(`${API_BASE}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, rol: "ciudadano", uid: user.uid }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al registrar en backend");

    console.log("✅ Usuario registrado:", user.uid);
    return user.uid;
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

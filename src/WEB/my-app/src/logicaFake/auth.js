// src/logicaFake/auth.js
import { API_BASE, firebaseConfig } from "./config";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { obtenerUsuarioCompleto } from "./logicaFake"; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ---------------------------------------------------------
// Reautenticar usuario
// ---------------------------------------------------------
export async function reautenticarUsuario(currentPassword) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No hay usuario autenticado.");
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  console.log("✅ Usuario re-autenticado correctamente.");
}

// ---------------------------------------------------------
// Reautenticar y actualizar contraseña
// ---------------------------------------------------------
export async function actualizarPasswordConReautenticacion(currentPassword, newPassword) {
  try {
    await reautenticarUsuario(currentPassword);
    const user = auth.currentUser;
    await updatePassword(user, newPassword);
    console.log("✅ Contraseña actualizada en Firebase Auth.");
  } catch (error) {
    console.error("❌ Error en el proceso de actualización de contraseña:", error);
    throw error; // Re-lanzar para que el componente lo maneje
  }
}

// ---------------------------------------------------------
// Registrar ciudadano
// ---------------------------------------------------------
export async function registrarCiudadano(nombre, correo, password) {
  try {
    console.log("🟦 Registrando usuario en backend:", correo);

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

    const authRes = await signInWithEmailAndPassword(auth, correo, password);
    const user = authRes.user;

    console.log("✅ Usuario autenticado con Firebase:");
    console.log("   UID:", user.uid);

    // Guardar en localStorage (por conveniencia)
    const usuario = { uid: user.uid, correo, rol: "ciudadano", nombre };
    localStorage.setItem("usuario", JSON.stringify(usuario));


    //Enviar correo de verificación
    try {
      await sendEmailVerification(user);
      console.log("📧 Email de verificación enviado automáticamente");
    } catch (err) {
      console.error("⚠️ Error enviando verificación automática:", err);
    }
    // Devolver solo el UID para consistencia
    return user.uid;
  } catch (error) {
    console.error("❌ Error en registrarCiudadano:", error);
    return null;
  }
}

// ---------------------------------------------------------
// Enviar email de verificación (independiente del registro)
// ---------------------------------------------------------
export async function enviarVerificacionCorreo() {
  try {
    const user = auth.currentUser;

    if (!user) {
      console.warn("⚠️ No hay usuario autenticado para enviar verificación.");
      return { ok: false, error: "No hay sesión activa" };
    }

    await sendEmailVerification(user);

    console.log("📧 Email de verificación enviado a:", user.email);
    return { ok: true };

  } catch (error) {
    console.error("❌ Error al enviar email de verificación:", error);
    return { ok: false, error: error.message };
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

    console.log("✅ Sesión iniciada con Firebase:");
    console.log("   UID:", user.uid);

    // Guardar temporalmente (para futuras consultas)
    localStorage.setItem(
      "usuario",
      JSON.stringify({ uid: user.uid, correo: user.email })
    );

    // 🟢 Devolver solo el UID
    return user.uid;
  } catch (error) {
    console.error("❌ Error en loginUsuario:", error.code, error.message);
    return null;
  }
}

// ---------------------------------------------------------
// (las demás funciones igual)
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

    const usuarioActualizado = {
      ...obtenerUsuarioLogueado(),
      ...nuevosDatos,
    };
    localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));

    console.log("✅ Usuario actualizado en localStorage:", usuarioActualizado);
    return usuarioActualizado;
  } catch (error) {
    console.error("❌ Error en actualizarUsuario:", error);
    throw error;
  }
}

export function escucharSesion(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("🟩 Sesión detectada en Firebase:");
      console.log("   UID:", user.uid);
      console.log("   Correo:", user.email);

      try {
        // 🔹 Intentar obtener el usuario completo desde el backend
        const usuarioCompleto = await obtenerUsuarioCompleto(user.uid);

        if (usuarioCompleto && !usuarioCompleto.error) {
          const usuarioFinal = {
            ...usuarioCompleto,
            uid: user.uid,
            correo: usuarioCompleto.correo || user.email,
          };

          localStorage.setItem("usuario", JSON.stringify(usuarioFinal));

          console.log("✅ Usuario completo obtenido desde backend:", usuarioFinal.rol);
          callback(usuarioFinal);
        } else {
          // Si el backend falla, usar fallback "ciudadano"
          console.warn("⚠️ No se pudo obtener usuario desde backend, usando ciudadano por defecto");
          const usuario = { uid: user.uid, correo: user.email, rol: "ciudadano" };
          localStorage.setItem("usuario", JSON.stringify(usuario));
          callback(usuario);
        }
      } catch (err) {
        console.error("❌ Error al obtener usuario desde backend:", err);
        const usuario = { uid: user.uid, correo: user.email, rol: "ciudadano" };
        localStorage.setItem("usuario", JSON.stringify(usuario));
        callback(usuario);
      }
    } else {
      console.log("🟥 No hay sesión activa");
      localStorage.removeItem("usuario");
      callback(null);
    }
  });
}

export function obtenerUsuarioLogueado() {
  const user = localStorage.getItem("usuario");
  return user ? JSON.parse(user) : null;
}

export async function cerrarSesion() {
  try {
    const usuario = obtenerUsuarioLogueado();
    if (usuario?.uid) {
      console.log("🟠 Enviando revocación de sesión al backend…");

      // 🔥 Llamar al nuevo endpoint que revoca la sesión en Firebase Auth
      await fetch(`${API_BASE}/logout/${usuario.uid}`, {
        method: "GET"
      });
    }

    console.log("🟠 Cerrando sesión localmente en Firebase…");
    await signOut(auth);

  } catch (e) {
    console.error("⚠️ Error cerrando sesión:", e);
  }

  // 🔥 Limpieza final
  localStorage.removeItem("usuario");
}


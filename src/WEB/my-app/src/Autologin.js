// --------------------------------------------------------------------------
// Fichero: Autologin.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero se encarga de gestionar el inicio de sesión automático
// a través de un token personalizado.
// --------------------------------------------------------------------------

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import { obtenerUsuarioCompleto } from "./logicaFake/logicaFake";

// --------------------------------------------------------------------------
// ✅ Componente Autologin
// --------------------------------------------------------------------------
function Autologin() {
  const navigate = useNavigate();

  useEffect(() => {
    const doAutologin = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        console.error("❌ No se encontró token en la URL");
        navigate("/login");
        return;
      }

      try {
        console.log("🟦 Iniciando sesión con token...");
        const auth = getAuth();
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;

        console.log("✅ Sesión iniciada con UID:", user.uid);

        // Obtener usuario completo desde backend
        const usuarioCompleto = await obtenerUsuarioCompleto(user.uid);
        const usuarioFinal = { ...usuarioCompleto, uid: user.uid };

        localStorage.setItem("usuario", JSON.stringify(usuarioFinal));

        if (usuarioFinal.rol === "admin") navigate("/admin/intranet");
        else navigate("/ciudadano/intranet");
      } catch (e) {
        console.error("❌ Error en autologin:", e);
        navigate("/login");
      }
    };

    doAutologin();
  }, [navigate]);

  return <p>🔐 Iniciando sesión automáticamente...</p>;
}

export default Autologin;

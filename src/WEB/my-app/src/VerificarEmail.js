import React, { useState } from "react";
import { enviarVerificacionCorreo } from "./logicaFake/auth";
import "./css/main.css"; // Reutilizamos un CSS existente para estilos básicos

function VerificarEmail({ usuario }) {
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const reenviarCorreo = async () => {
    setEnviando(true);
    setMensaje("");
    try {
      const res = await enviarVerificacionCorreo();
      if (res.ok) {
        setMensaje("Se ha enviado un nuevo correo de verificación. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).");
      } else {
        setMensaje(`Error: ${res.error}`);
      }
    } catch (error) {
      setMensaje("Ha ocurrido un error inesperado al intentar reenviar el correo.");
    }
    setEnviando(false);
  };

  return (
    <div className="container mt-5 text-center">
      <div className="card p-4">
        <h2>Verifica tu Correo Electrónico</h2>
        <p>
          Gracias por registrarte. Hemos enviado un enlace de verificación a tu
          correo: <strong>{usuario?.correo || "..."}</strong>.
        </p>
        <p>
          Por favor, haz clic en ese enlace para activar tu cuenta. Si no lo
          encuentras, revisa tu carpeta de spam.
        </p>
        <button
          className="btn btn-primary"
          onClick={reenviarCorreo}
          disabled={enviando}
        >
          {enviando ? "Enviando..." : "Reenviar correo de verificación"}
        </button>
        {mensaje && (
          <div className="alert alert-info mt-3" role="alert">
            {mensaje}
          </div>
        )}
         <p className="mt-3">
          Una vez verificado, por favor, <strong>refresca esta página</strong> para continuar.
        </p>
      </div>
    </div>
  );
}

export default VerificarEmail;

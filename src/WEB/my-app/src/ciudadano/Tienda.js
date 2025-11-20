// src/ciudadano/Tienda.js
import React, { useEffect, useState } from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import { obtenerUsuarioCompleto } from "../logicaFake/logicaFake";
import { recompensas, canjearRecompensa } from "../logicaFake/premios";
import "./css/tienda.css";

function Tienda() {
  const [usuario, setUsuario] = useState(null);
  const [desbloqueados, setDesbloqueados] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = obtenerUsuarioLogueado?.();
      if (user) {
        const fullUser = await obtenerUsuarioCompleto(user.uid);
        setUsuario(fullUser);
        // Initialize unlocked rewards based on user's prizes
        const userPremios = fullUser.premios || [];
        const unlocked = recompensas.reduce((acc, recompensa) => {
          if (userPremios.includes(recompensa.codigo)) {
            acc[recompensa.id] = true;
          }
          return acc;
        }, {});
        setDesbloqueados(unlocked);
      }
    };
    loadUser();
  }, []);

  const monedas = usuario?.monedas ?? 0;

  const manejarClickRecompensa = (recompensa) => {
    if (desbloqueados[recompensa.id]) {
      alert("Ya has canjeado esta recompensa.");
      return;
    }
    if (monedas < recompensa.costeMonedas) {
      alert(
        `Necesitas ${recompensa.costeMonedas} monedas para canjear esta recompensa. Actualmente tienes ${monedas}.`
      );
      return;
    }
    setSelectedReward(recompensa);
    setShowConfirm(true);
  };

  const confirmarCanje = async () => {
    if (!selectedReward || !usuario) return;

    const result = await canjearRecompensa(usuario.uid, selectedReward);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      alert("¡Recompensa canjeada con éxito!");
      setUsuario({
        ...usuario,
        monedas: result.monedas,
        premios: result.premios,
      });
      setDesbloqueados((prev) => ({
        ...prev,
        [selectedReward.id]: true,
      }));
    }

    setShowConfirm(false);
    setSelectedReward(null);
  };

  const ConfirmationModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirmar Compra</h2>
        <p>
          ¿Estás seguro de que quieres canjear "{selectedReward?.titulo}" por{" "}
          {selectedReward?.costeMonedas} monedas?
        </p>
        <div className="modal-actions">
          <button onClick={confirmarCanje} className="modal-confirm">
            Confirmar
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="modal-cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="home-page">
      {showConfirm && <ConfirmationModal />}
      <HeaderRegistrado />

      <main className="home-content tienda-page">
        <section className="tienda-header">
          <h1>Tienda de recompensas</h1>
          <p className="tienda-monedas">
            Monedas disponibles:{" "}
            <span className="tienda-monedas-numero">{monedas}</span>
          </p>
          <p className="tienda-subtexto">
            Canjea tus monedas obtenidas por usar el nodo y descubre los
            descuentos disponibles en la ciudad.
          </p>
        </section>

        <section className="tienda-grid">
          {recompensas.map((r) => {
            const estaDesbloqueada = !!desbloqueados[r.id];

            return (
              <article
                key={r.id}
                className={`tienda-card ${
                  estaDesbloqueada ? "desbloqueada" : ""
                }`}
                onClick={() => manejarClickRecompensa(r)}
              >
                <img
                  src={r.img}
                  alt={r.titulo}
                  className="tienda-card-imagen"
                />

                <div className="tienda-card-contenido">
                  <h3 className="tienda-card-titulo">{r.titulo}</h3>
                  <p className="tienda-card-descripcion">{r.descripcion}</p>

                  <p className="tienda-card-coste">
                    Coste:{" "}
                    <strong>
                      {r.costeMonedas} moneda{r.costeMonedas !== 1 && "s"}
                    </strong>
                  </p>

                  <div
                    className={`tienda-card-codigo ${
                      estaDesbloqueada ? "visible" : "oculto"
                    }`}
                  >
                    {estaDesbloqueada ? (
                      <span className="tienda-card-codigo-texto">
                        {r.codigo}
                      </span>
                    ) : (
                      <>
                        <span className="tienda-card-codigo-tapado" />
                        <span className="tienda-card-codigo-mensaje">
                          Haz clic para gastar {r.costeMonedas} monedas y ver el
                          código
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default Tienda;

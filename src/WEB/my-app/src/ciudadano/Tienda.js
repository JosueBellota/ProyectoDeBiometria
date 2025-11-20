// src/ciudadano/Tienda.js
import React, { useEffect, useState } from "react";
import HeaderRegistrado from "./templates/HeaderRegistrado";
import { obtenerUsuarioLogueado } from "../logicaFake/auth";
import "./css/tienda.css";

const recompensas = [
  {
    id: 1,
    titulo: "Gimnasio Municipal de Gandia",
    descripcion:
      "Consigue un 20% de descuento durante un mes en la cuota del gimnasio municipal.",
    costeMonedas: 5,
    codigo: "GANDIA-GYM20",
    img: "/gimnasio-gandia.jpeg", // pon aquí la imagen que tengas
  },
  {
    id: 2,
    titulo: "Entrada al Museo Local",
    descripcion:
      "Entrada gratuita para una persona al museo local de Gandia.",
    costeMonedas: 3,
    codigo: "MUSEO-GANDIA1",
    img: "/museo_gandia.jpg",
  },
  {
    id: 3,
    titulo: "Descuento en transporte",
    descripcion:
      "10% de descuento en tu bono mensual de transporte público.",
    costeMonedas: 4,
    codigo: "BUS-GANDIA10",
    img: "/transporte_gandia.jpg",
  },
];

function Tienda() {
  const [usuario, setUsuario] = useState(null);
  const [desbloqueados, setDesbloqueados] = useState({});

  useEffect(() => {
    const user = obtenerUsuarioLogueado?.();
    setUsuario(user || null);
  }, []);

  const monedas = usuario?.monedas ?? 0;

  const manejarClickRecompensa = (recompensa) => {
    if (monedas < recompensa.costeMonedas) {
      alert(
        `Necesitas ${recompensa.costeMonedas} monedas para canjear esta recompensa. Actualmente tienes ${monedas}.`
      );
      return;
    }

    setDesbloqueados((prev) => ({
      ...prev,
      [recompensa.id]: true,
    }));

    // Aquí, si quieres, podrías llamar a una función tipo
    // actualizarUsuario({ ...usuario, monedas: monedas - recompensa.costeMonedas })
    // para guardar el nuevo saldo en tu "backend fake".
  };

  return (
    <div className="home-page">
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
                className="tienda-card"
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
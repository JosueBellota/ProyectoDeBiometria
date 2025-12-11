// --------------------------------------------------------------------------
// Fichero: Informacion.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la información sobre la calidad del aire para el ciudadano,
// sincronizada con los rangos y contaminantes del mapa de Intranet.
// --------------------------------------------------------------------------

import React from "react";
import "./css/intranet.css";
import HeaderRegistrado from "./templates/HeaderRegistrado";

const contaminantes = [
  {
    id: "co",
    nombre: "Monóxido de carbono",
    abreviatura: "CO",
    descripcionCorta: "Gas incoloro e inodoro, subproducto de la respiración y combustión.",
    resumenRapido: "En interiores mal ventilados causa fatiga y falta de concentración. Es el principal gas de efecto invernadero.",
    fuentes: ["Respiración humana y animal", "Combustión de combustibles fósiles (tráfico, calefacción)", "Incendios forestales"],
    efectos: ["Dolor de cabeza y mareos", "Fatiga y somnolencia", "Falta de concentración", "Desplazamiento del oxígeno a niveles muy altos"],
    rangos: [
      { color: "green", texto: "Recomendable: < 450 ppm" },
      { color: "yellow", texto: "Máximo Permitido: 450 - 1000 ppm" },
      { color: "red", texto: "Peligroso: > 1000 ppm" }
    ],
    consejos: ["Ventila las habitaciones frecuentemente.", "Mantén plantas en interiores.", "Revisa los sistemas de calefacción."]
  },
  {
    id: "no2",
    nombre: "Dióxido de nitrógeno",
    abreviatura: "NO₂",
    descripcionCorta: "Gas irritante asociado principalmente al tráfico.",
    resumenRapido: "Riesgo alto en calles con mucho tráfico. Afecta sobre todo a niños, personas con asma y mayores.",
    fuentes: ["Vehículos diésel", "Calefacciones de gas", "Algunas industrias"],
    efectos: ["Aumenta las crisis de asma", "Irritación de vías respiratorias", "Problemas respiratorios en niños"],
    rangos: [
      { color: "green", texto: "Recomendable: < 100 µg/m³" },
      { color: "yellow", texto: "Máximo Permitido: 100 - 200 µg/m³" },
      { color: "red", texto: "Peligroso: > 200 µg/m³" }
    ],
    consejos: ["Evita esperar junto al tubo de escape de los coches.", "Siempre que puedas, elige rutas más alejadas de avenidas principales."]
  },
  {
    id: "o3",
    nombre: "Ozono troposférico",
    abreviatura: "O₃",
    descripcionCorta: "Gas oxidante que se forma por reacción del sol con otros contaminantes.",
    resumenRapido: "Riesgo mayor en días calurosos y soleados. Afecta a personas activas al aire libre y con problemas respiratorios.",
    fuentes: ["No se emite directamente", "Se forma a partir de NOx y COVs con sol y calor"],
    efectos: ["Irritación de ojos y garganta", "Reducción temporal de la función pulmonar", "Mayor molestia al hacer ejercicio intenso"],
    rangos: [
      { color: "green", texto: "Recomendable: < 120 µg/m³" },
      { color: "yellow", texto: "Máximo Permitido: 120 - 180 µg/m³" },
      { color: "red", texto: "Peligroso: > 180 µg/m³" }
    ],
    consejos: ["En días calurosos, mejor hacer deporte temprano por la mañana.", "Evita correr al aire libre por la tarde en episodios de ozono."]
  }
];

export default function Informacion() {
  return (
    <>
      <HeaderRegistrado />

      <div className="intranet-container">
        <div className="intranet-content-block">
          <h1 className="intranet-title">
            Guía de calidad del aire
          </h1>

          <p className="intranet-subtitle">
            Consulta los principales contaminantes, sus efectos en la salud y los rangos de calidad utilizados en nuestro mapa.
          </p>

          <div className="contaminantes-grid">
            {contaminantes.map((c) => (
              <div key={c.id} className="medida-card">
                <h2>
                  {c.nombre}{" "}
                  <span className="abreviatura-span">
                    {c.abreviatura}
                  </span>
                </h2>

                <p className="descripcion-corta">
                  {c.descripcionCorta}
                </p>

                <p className="resumen-rapido">
                  <strong>Resumen rápido: </strong>
                  {c.resumenRapido}
                </p>

                <h3>🌬 Fuentes típicas</h3>
                <ul>
                  {c.fuentes.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>

                <h3>❤️ Efectos en la salud</h3>
                <ul>
                  {c.efectos.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>

                <div className="rangos-card">
                    <h3>📊 Rangos permitidos en España</h3>
                    <ul style={{listStyle: 'none', paddingLeft: 0}}>
                      {c.rangos.map((r, i) => (
                        <li key={i} style={{display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '1.05rem'}}>
                           <span style={{
                               width: '24px', 
                               height: '24px', 
                               backgroundColor: r.color === 'green' ? 'rgba(0, 128, 0, 0.6)' : r.color === 'yellow' ? 'rgba(255, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.6)', 
                               marginRight: '12px',
                               borderRadius: '4px',
                               display: 'inline-block',
                               border: '1px solid #ccc'
                           }}></span>
                           {r.texto}
                        </li>
                      ))}
                    </ul>
                </div>

                <h3>💡 Consejos prácticos</h3>
                <ul>
                  {c.consejos.map((consejo, i) => (
                    <li key={i}>{consejo}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <section className="home-contact">
          <p>contacto@mail.com</p>
        </section>

        <footer className="home-footer">
          <span>GTI 2025©</span>
        </footer>
      </div>
    </>
  );
}
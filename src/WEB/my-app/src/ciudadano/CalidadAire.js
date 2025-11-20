// src/CalidadAire.js
import React from "react";
import "../css/main.css";
import HeaderRegistrado from "./templates/HeaderRegistrado";

const contaminantes = [
  {
    id: "no2",
    nombre: "Dióxido de nitrógeno",
    abreviatura: "NO₂",
    descripcionCorta: "Gas irritante asociado principalmente al tráfico.",
    resumenRapido:
      "Riesgo alto en calles con mucho tráfico. Afecta sobre todo a niños, personas con asma y mayores.",
    fuentes: ["Vehículos diésel", "Calefacciones de gas", "Algunas industrias"],
    efectos: [
      "Aumenta las crisis de asma",
      "Irritación de vías respiratorias",
      "Problemas respiratorios en niños",
    ],
    valoresRecomendados: [
      {
        tipo: "Recomendado (anual)",
        valor: "10",
        unidad: "µg/m³",
        periodo: "1 año",
        fuente: "OMS 2021 (guía)",
      },
      {
        tipo: "Recomendado (diario)",
        valor: "25",
        unidad: "µg/m³",
        periodo: "24 h",
        fuente: "OMS 2021 (guía)",
      },
    ],
    valoresMaximos: [
      {
        tipo: "Límite UE (anual)",
        valor: "40",
        unidad: "µg/m³",
        periodo: "1 año",
        fuente: "Directiva calidad del aire",
      },
      {
        tipo: "Límite UE (1 h)",
        valor: "200",
        unidad: "µg/m³",
        periodo: "1 h",
        extra: "no más de 18 superaciones/año",
        fuente: "Directiva calidad del aire",
      },
    ],
    consejos: [
      "Evita esperar junto al tubo de escape de los coches.",
      "Siempre que puedas, elige rutas más alejadas de avenidas principales.",
    ],
  },
  {
    id: "o3",
    nombre: "Ozono troposférico",
    abreviatura: "O₃",
    descripcionCorta:
      "Gas oxidante que se forma por reacción del sol con otros contaminantes.",
    resumenRapido:
      "Riesgo mayor en días calurosos y soleados. Afecta a personas activas al aire libre y con problemas respiratorios.",
    fuentes: [
      "No se emite directamente",
      "Se forma a partir de NOx y COVs con sol y calor",
    ],
    efectos: [
      "Irritación de ojos y garganta",
      "Reducción temporal de la función pulmonar",
      "Mayor molestia al hacer ejercicio intenso",
    ],
    valoresRecomendados: [
      {
        tipo: "Recomendado (máx. 8 h)",
        valor: "100",
        unidad: "µg/m³",
        periodo: "8 h",
        fuente: "OMS 2021 (guía)",
      },
    ],
    valoresMaximos: [
      {
        tipo: "Valor objetivo UE (máx. 8 h)",
        valor: "120",
        unidad: "µg/m³",
        periodo: "8 h",
        extra: "media sobre 3 años",
        fuente: "Directiva calidad del aire",
      },
    ],
    consejos: [
      "En días calurosos, mejor hacer deporte temprano por la mañana.",
      "Evita correr al aire libre por la tarde en episodios de ozono.",
    ],
  },
  {
    id: "co",
    nombre: "Monóxido de carbono",
    abreviatura: "CO",
    descripcionCorta:
      "Gas tóxico que reduce la capacidad de la sangre para transportar oxígeno.",
    resumenRapido:
      "Riesgo alto en espacios cerrados mal ventilados con motores o combustión. Peligroso para todo el mundo.",
    fuentes: [
      "Motores de gasolina",
      "Calderas y estufas en mal estado",
      "Incendios y combustión incompleta",
    ],
    efectos: [
      "Dolor de cabeza, mareos",
      "Náuseas, debilidad",
      "A niveles altos: riesgo grave para la vida",
    ],
    valoresRecomendados: [
      {
        tipo: "Recomendado (8 h)",
        valor: "10",
        unidad: "mg/m³",
        periodo: "8 h",
        fuente: "OMS (guía)",
      },
    ],
    valoresMaximos: [
      {
        tipo: "Valor guía típico (1 h)",
        valor: "30",
        unidad: "mg/m³",
        periodo: "1 h",
        fuente: "Referencias sanitarias",
      },
    ],
    consejos: [
      "Evita zonas poco ventiladas con motores encendidos (garajes, túneles).",
      "En casa, revisa periódicamente calderas y estufas.",
    ],
  },
  {
    id: "so2",
    nombre: "Dióxido de azufre",
    abreviatura: "SO₂",
    descripcionCorta:
      "Gas procedente de combustibles con azufre y algunas actividades industriales.",
    resumenRapido:
      "Riesgo localizado cerca de zonas industriales. Afecta sobre todo a personas con asma.",
    fuentes: ["Centrales térmicas", "Algunas industrias", "Volcanes"],
    efectos: [
      "Tos y dificultad respiratoria",
      "Empeoramiento del asma",
      "Irritación de ojos y garganta",
    ],
    valoresRecomendados: [
      {
        tipo: "Recomendado (24 h)",
        valor: "40",
        unidad: "µg/m³",
        periodo: "24 h",
        fuente: "OMS 2021 (guía)",
      },
    ],
    valoresMaximos: [
      {
        tipo: "Límite UE (1 h)",
        valor: "350",
        unidad: "µg/m³",
        periodo: "1 h",
        extra: "no más de 24 superaciones/año",
        fuente: "Directiva calidad del aire",
      },
      {
        tipo: "Valor límite (24 h)",
        valor: "125",
        unidad: "µg/m³",
        periodo: "24 h",
        extra: "no más de 3 superaciones/año",
        fuente: "Directiva calidad del aire",
      },
    ],
    consejos: [
      "Evita ejercicio intenso cerca de zonas industriales en días de mala dispersión.",
      "Consulta los avisos locales si vives cerca de un área industrial.",
    ],
  },
];

export default function CalidadAire() {
  return (
    <>
      <HeaderRegistrado />

      {/* Contenedor a pantalla completa con fondo */}
      <div
        className="container"
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
          minHeight: "100vh",
          backgroundImage: "url(/Fondo.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "40px 16px",
          boxSizing: "border-box",
        }}
      >
        {/* Bloque central con contenido organizado */}
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "30px 20px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.15)",
          }}
        >
          <h1 style={{ textAlign: "center", marginBottom: "16px" }}>
            Guía de calidad del aire
          </h1>

          <p
            style={{
              textAlign: "center",
              marginBottom: "28px",
              maxWidth: "700px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Consulta los principales contaminantes, sus efectos en la salud, los
            valores recomendados, los valores máximos permitidos y consejos para
            protegerte en tu día a día.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "16px",
            }}
          >
            {contaminantes.map((c) => (
              <div key={c.id} className="medida-card">
                <h2 style={{ marginTop: 0 }}>
                  {c.nombre}{" "}
                  <span
                    style={{
                      fontSize: "0.8rem",
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      marginLeft: "6px",
                    }}
                  >
                    {c.abreviatura}
                  </span>
                </h2>

                <p
                  style={{
                    marginTop: "4px",
                    marginBottom: "8px",
                    color: "#555",
                  }}
                >
                  {c.descripcionCorta}
                </p>

                {/* 🌟 Resumen rápido */}
                <p
                  style={{
                    marginTop: 0,
                    marginBottom: "12px",
                    fontSize: "0.9rem",
                    backgroundColor: "#f3f6ff",
                    borderRadius: "8px",
                    padding: "8px 10px",
                  }}
                >
                  <strong>Resumen rápido: </strong>
                  {c.resumenRapido}
                </p>

                {/* 🌬 Fuentes + ❤️ Efectos */}
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

                {/* 📏 Valores en dos columnas */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "10px",
                    marginTop: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "8px",
                      padding: "8px 10px",
                      backgroundColor: "#f7f9ff",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>📏 Valores recomendados</h3>
                    <ul>
                      {c.valoresRecomendados.map((v, i) => (
                        <li key={i}>
                          <strong>{v.tipo}:</strong> {v.valor} {v.unidad} (
                          {v.periodo}) {" – "}
                          {v.fuente}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      borderRadius: "8px",
                      padding: "8px 10px",
                      backgroundColor: "#fff7f7",
                    }}
                  >
                    <h3 style={{ marginTop: 0 }}>⚠️ Valores máximos permitidos</h3>
                    <ul>
                      {c.valoresMaximos.map((v, i) => (
                        <li key={i}>
                          <strong>{v.tipo}:</strong> {v.valor} {v.unidad} (
                          {v.periodo})
                          {v.extra ? ` – ${v.extra}` : ""} {" – "}
                          {v.fuente}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 💡 Consejos */}
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
        {/* Contacto */}
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

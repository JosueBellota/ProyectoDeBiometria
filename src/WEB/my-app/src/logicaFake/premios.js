// --------------------------------------------------------------------------
// Fichero: premios.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la lógica para la gestión de premios.
// --------------------------------------------------------------------------

import { obtenerUsuarioCompleto, actualizarMonedasUsuario, actualizarDatosUsuario } from "./logicaFake";

export const recompensas = [
  {
    id: 1,
    titulo: "Gimnasio Municipal de Gandia",
    descripcion:
      "Consigue un 20% de descuento durante un mes en la cuota del gimnasio municipal.",
    costeMonedas: 5,
    codigo: "GANDIA-GYM20",
    img: "/gimnasio-gandia.jpeg",
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

export async function canjearRecompensa(idUsuario, recompensa) {
  try {
    const usuario = await obtenerUsuarioCompleto(idUsuario);
    if (usuario.error) {
      throw new Error(usuario.error);
    }

    if (usuario.monedas < recompensa.costeMonedas) {
      throw new Error("No tienes suficientes monedas.");
    }

    const nuevasMonedas = usuario.monedas - recompensa.costeMonedas;
    const nuevosPremios = [...(usuario.premios || []), recompensa.codigo];

    // I need a function to update both at the same time.
    // I will add it to logicaFake.js
    const result = await actualizarDatosUsuario(idUsuario, {
      monedas: nuevasMonedas,
      premios: nuevosPremios,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    return { success: true, monedas: nuevasMonedas, premios: nuevosPremios };
  } catch (error) {
    console.error("Error al canjear la recompensa:", error);
    return { error: error.message };
  }
}

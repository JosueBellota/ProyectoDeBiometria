import { recibirDatosDeIBeacon } from "./recibirDatosDeIBeacon";

export async function main() {
  const iBeacon = new recibirDatosDeIBeacon();
  const datos = await iBeacon.obtenerDatos();
  return datos;
}

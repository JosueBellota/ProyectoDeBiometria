import { recibirDatosDeIBeacon } from "./recibirDatosDeIBeacon";
import { testeos } from "./testeos";


export async function main() {


  const iBeacon = new recibirDatosDeIBeacon();
  const datos = await iBeacon.obtenerDatos();


  
  const tester = new testeos();
  datos.forEach((item) => {
    tester.testNombreEmisora(item.nombre);
  });


  return datos;

}

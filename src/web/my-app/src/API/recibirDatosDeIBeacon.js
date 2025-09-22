// API/recibirDatosDeIBeacon.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseManager";

export class recibirDatosDeIBeacon {

//   constructor() {}

  // Obtiene los datos de la colección 'medidas' (puedes adaptarlo luego)
  async obtenerDatos() {
    try {
      const querySnapshot = await getDocs(collection(db, "emisoras"));
      const datos = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      return datos;
    } catch (error) {
      console.error("Error al obtener datos de IBeacon:", error);
      return [];
    }
  }
}
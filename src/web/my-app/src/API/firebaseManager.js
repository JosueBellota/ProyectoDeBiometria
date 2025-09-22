// API/firebaseManager.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYvrCfTAJn0irG23qF3gTDCTMT9TGZQNk",
  authDomain: "proyectodebiometria.firebaseapp.com",
  projectId: "proyectodebiometria",
  storageBucket: "proyectodebiometria.firebasestorage.app",
  messagingSenderId: "174840664338",
  appId: "1:174840664338:web:8cd5fec4b879df480423cb"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

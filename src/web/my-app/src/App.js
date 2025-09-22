import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDYvrCfTAJn0irG23qF3gTDCTMT9TGZQNk",
  authDomain: "proyectodebiometria.firebaseapp.com",
  projectId: "proyectodebiometria",
  storageBucket: "proyectodebiometria.firebasestorage.app",
  messagingSenderId: "174840664338",
  appId: "1:174840664338:web:8cd5fec4b879df480423cb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "medidas"));
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,          // ejemplo: "placa_1"
        ...doc.data(),       // ejemplo: { placa: 1234, timestamp: ... }
      }));
      setData(docs);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h2>Datos</h2>
      {data.map((item) => (
        <div key={item.id}>
          {item.id}: {item.placa}
        </div>
      ))}
    </div>
  );
}

export default App;

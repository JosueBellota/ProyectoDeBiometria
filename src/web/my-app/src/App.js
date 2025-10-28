import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Registro from "./Registro";
import Intranet from "./ciudadano/Intranet";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/intranet" element={<Intranet />} />
    </Routes>
  );
}

export default App;

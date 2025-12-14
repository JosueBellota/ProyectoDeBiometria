// --------------------------------------------------------------------------
// Fichero: index.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero es el punto de entrada de la aplicación React.
// --------------------------------------------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { MonedasProvider } from "./logicaFake/MonedasContext";
import "./css/main.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <MonedasProvider>
        <App />
      </MonedasProvider>
    </BrowserRouter>
  </React.StrictMode>
);

import React from "react";
import HeaderNoRegistrado from "./templates/HeaderNoRegistrado";

function Home() {
  return (
    <div
      className="home-background"
      style={{
        backgroundImage: 'url(/Fondo.png)', // mismo path que en el CSS
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
      }}
    >
      <HeaderNoRegistrado />
      {/* Aquí luego meterás el resto de la landing */}
    </div>
  );
}

export default Home;

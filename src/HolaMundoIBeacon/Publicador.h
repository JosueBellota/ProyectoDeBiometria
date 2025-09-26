// -*- mode: c++ -*-

// --------------------------------------------------------------
// Jordi Bataller i Mascarell
// --------------------------------------------------------------

#ifndef PUBLICADOR_H_INCLUIDO
#define PUBLICADOR_H_INCLUIDO

// Clase Publicador:
// ----------------------------------------------------------
// Esta clase se encarga de publicar mediciones ambientales
// (como CO2 y temperatura) utilizando una emisora BLE en
// formato iBeacon. Define un identificador único de beacon,
// inicializa la emisora y ofrece métodos para anunciar datos
// durante un tiempo determinado.
// ----------------------------------------------------------

class Publicador {

private:

  // UUID de 16 bytes que identifica a la baliza (beacon)
  uint8_t beaconUUID[16] = { 
	'E', 'P', 'S', 'G', '-', 'G', 'T', 'I', 
	'-', 'P', 'R', 'O', 'Y', '-', '3', 'A'
	};

public:
  // Emisora BLE configurada con nombre, fabricante y potencia de transmisión
  EmisoraBLE laEmisora {
	"Josue", // caracteres (nombre emisora)
	0x004c,   // numeros (fabricanteID, Apple)
	4         // numeros (txPower)
  };
  
  const int RSSI = -53; // numeros (valor de intensidad de señal, no usado todavía)

public:

  // Identificadores de los distintos tipos de mediciones
  enum MedicionesID  {
	CO2 = 11,
	TEMPERATURA = 12,
	RUIDO = 13
  };

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // Publicador() --> (constructor vacío, no enciende la emisora aquí)
  // -->
  // objeto Publicador
  //------------------------------------------------------------------------------------
  Publicador( ) {
	// ATENCION: no hacerlo aquí. (*this).laEmisora.encenderEmisora();
	// Pondremos un método para llamarlo desde el setup() más tarde
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // encenderEmisora() --> (enciende la emisora BLE asociada al publicador)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void encenderEmisora() {
	(*this).laEmisora.encenderEmisora();
  } // ()

  //------------------------------------------------------------------------------------
  // valorCO2: numeros, contador: numeros, tiempoEspera: numeros (de entrada)
  // -->
  // publicarCO2() --> (publica el valor de CO2 como anuncio iBeacon durante cierto tiempo)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void publicarCO2( int16_t valorCO2, uint8_t contador,
					long tiempoEspera ) {

	// 1. configuramos anuncio con tipo CO2
	uint16_t major = (MedicionesID::CO2 << 8) + contador;
	(*this).laEmisora.emitirAnuncioIBeacon( (*this).beaconUUID, 
											major,
											valorCO2, // minor
											(*this).RSSI // rssi
									);

	// 2. esperamos el tiempo indicado
	esperar( tiempoEspera );

	// 3. detenemos anuncio
	(*this).laEmisora.detenerAnuncio();
  } // ()

  //------------------------------------------------------------------------------------
  // valorTemperatura: numeros, contador: numeros, tiempoEspera: numeros (de entrada)
  // -->
  // publicarTemperatura() --> (publica el valor de temperatura como anuncio iBeacon durante cierto tiempo)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void publicarTemperatura( int16_t valorTemperatura,
							uint8_t contador, long tiempoEspera ) {

	uint16_t major = (MedicionesID::TEMPERATURA << 8) + contador;
	(*this).laEmisora.emitirAnuncioIBeacon( (*this).beaconUUID, 
											major,
											valorTemperatura, // minor
											(*this).RSSI // rssi
									);
	esperar( tiempoEspera );

	(*this).laEmisora.detenerAnuncio();
  } // ()
	
}; // class

// --------------------------------------------------------------
// --------------------------------------------------------------
// --------------------------------------------------------------
// --------------------------------------------------------------
#endif

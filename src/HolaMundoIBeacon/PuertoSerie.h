// -*- mode: c++ -*-

// ----------------------------------------------------------
// Jordi Bataller i Mascarell
// 2019-07-07
// ----------------------------------------------------------

#ifndef PUERTO_SERIE_H_INCLUIDO
#define PUERTO_SERIE_H_INCLUIDO

// Clase PuertoSerie:
// ----------------------------------------------------------
// Esta clase es un envoltorio (wrapper) sencillo para la
// comunicación serie. Permite inicializar el puerto serie,
// esperar a que esté disponible y escribir mensajes genéricos
// en él. Está pensada para facilitar el uso de Serial.
// ----------------------------------------------------------

class PuertoSerie  {

public:

  //------------------------------------------------------------------------------------
  // baudios: numeros (de entrada)
  // -->
  // PuertoSerie() --> (constructor que inicializa el puerto serie con la velocidad indicada)
  // -->
  // objeto PuertoSerie
  //------------------------------------------------------------------------------------
  PuertoSerie (long baudios) {
	Serial.begin( baudios );
	// mejor no poner esto aquí: while ( !Serial ) delay(10);   
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // esperarDisponible() --> (espera hasta que el puerto serie esté disponible)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void esperarDisponible() {
	while ( !Serial ) {
	  delay(10);   
	}
  } // ()

  //------------------------------------------------------------------------------------
  // mensaje: texto o numeros (genérico, gracias a template) (de entrada)
  // -->
  // escribir() --> (escribe el mensaje en el puerto serie)
  // -->
  // void
  //------------------------------------------------------------------------------------
  template<typename T>
  void escribir (T mensaje) {
	Serial.print( mensaje );
  } // ()
  
}; // class PuertoSerie

// ----------------------------------------------------------
// ----------------------------------------------------------
// ----------------------------------------------------------
// ----------------------------------------------------------
#endif

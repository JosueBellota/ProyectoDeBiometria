// -*- mode: c++ -*-

#ifndef MEDIDOR_H_INCLUIDO
#define MEDIDOR_H_INCLUIDO

// Clase Medidor:
// ----------------------------------------------------------
// Esta clase representa un dispositivo de medición que puede
// registrar valores de diferentes parámetros ambientales.
// En este ejemplo se simulan las lecturas de CO2 y temperatura,
// devolviendo valores fijos. También se incluye un método para
// iniciar el medidor (para inicializaciones posteriores al constructor).
// ----------------------------------------------------------

class Medidor {

private:
  // (sin atributos privados en esta versión)

public:

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // Medidor() --> (constructor vacío)
  // -->
  // objeto Medidor
  //------------------------------------------------------------------------------------
  Medidor(  ) {
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // iniciarMedidor() --> (realiza inicialización adicional del medidor si es necesario)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void iniciarMedidor() {
	// las cosas que no se puedan hacer en el constructor, if any
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // medirCO2() --> (devuelve el nivel de CO2 medido)
  // -->
  // numeros
  //------------------------------------------------------------------------------------
  int medirCO2() {
	return 1234;
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // medirTemperatura() --> (devuelve la temperatura medida)
  // -->
  // numeros
  //------------------------------------------------------------------------------------
  int medirTemperatura() {
	return -12; // qué frío !
  } // ()
	
}; // class

// ------------------------------------------------------
// ------------------------------------------------------
// ------------------------------------------------------
// ------------------------------------------------------
#endif

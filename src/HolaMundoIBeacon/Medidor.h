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
/**
 * @brief Clase que representa un dispositivo de medición de parámetros ambientales.
 */
class Medidor {

private:
  // (sin atributos privados en esta versión)

public:

  /**
   * @brief Constructor de la clase Medidor.
   */
  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // Medidor() --> (constructor vacío)
  // -->
  // objeto Medidor
  //------------------------------------------------------------------------------------
  Medidor(  ) {
  } // ()

  /**
   * @brief Realiza inicializaciones adicionales del medidor si son necesarias.
   */
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

  /**
   * @brief Mide el nivel de CO2.
   * @return Devuelve el nivel de CO2 medido (valor simulado).
   */
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

  /**
   * @brief Mide la temperatura.
   * @return Devuelve la temperatura medida (valor simulado).
   */
  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // medirTemperatura() --> (devuelve la temperatura medida)
  // -->
  // numeros
  //------------------------------------------------------------------------------------
  int medirTemperatura() {
	return 4321; // qué frío !
  } // ()
	
}; // class

// ------------------------------------------------------
// ------------------------------------------------------
// ------------------------------------------------------
// ------------------------------------------------------
#endif

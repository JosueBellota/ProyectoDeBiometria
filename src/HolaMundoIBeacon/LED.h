// -*- mode: c++ -*-

#ifndef LED_H_INCLUIDO
#define LED_H_INCLUIDO

// ----------------------------------------------------------
// Jordi Bataller i Mascarell
// 2019-07-07
// ----------------------------------------------------------

// Clase LED:
// ----------------------------------------------------------
// Esta clase representa un LED físico conectado a un pin digital
// de una placa (por ejemplo Arduino). Permite encender, apagar,
// alternar el estado y hacerlo brillar durante un tiempo determinado.
// Internamente guarda el estado (encendido/apagado) y el número de pin.
// ----------------------------------------------------------

/**
 * @brief Pausa la ejecución del programa durante un tiempo determinado en milisegundos.
 * @param tiempo El tiempo a esperar.
 */
// ----------------------------------------------------------
// tiempo: numeros (de entrada)
// -->
// esperar() --> (pausa el programa durante cierto tiempo en ms)
// -->
// void
// ----------------------------------------------------------
void esperar (long tiempo) {
  delay (tiempo);
}

// ----------------------------------------------------------
// Clase LED
// ----------------------------------------------------------
/**
 * @brief Clase que representa un LED físico conectado a un pin digital.
 */
class LED {
private:
  int numeroLED;   // numeros (pin digital asociado al LED)
  bool encendido;  // boleano (estado del LED)

public:

  /**
   * @brief Constructor de la clase LED. Inicializa el pin y apaga el LED.
   * @param numero El pin digital al que está conectado el LED.
   */
  //------------------------------------------------------------------------------------
  // numero: numeros (de entrada)
  // -->
  // LED() --> (constructor: inicializa el pin como salida y apaga el LED)
  // -->
  // objeto LED
  //------------------------------------------------------------------------------------
  LED (int numero)
	: numeroLED (numero), encendido(false)
  {
	pinMode(numeroLED, OUTPUT);
	apagar ();
  }

  /**
   * @brief Enciende el LED.
   */
  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // encender() --> (enciende el LED y actualiza estado interno)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void encender () {
	digitalWrite(numeroLED, HIGH); 
	encendido = true;
  }

  /**
   * @brief Apaga el LED.
   */
  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // apagar() --> (apaga el LED y actualiza estado interno)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void apagar () {
	digitalWrite(numeroLED, LOW);
	encendido = false;
  }

  /**
   * @brief Alterna el estado del LED (si está encendido lo apaga, y viceversa).
   */
  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // alternar() --> (cambia el estado: si está encendido lo apaga, si está apagado lo enciende)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void alternar () {
	if (encendido) {
	  apagar();
	} else {
	  encender ();
	}
  } // ()

  /**
   * @brief Enciende el LED, espera un tiempo y lo apaga.
   * @param tiempo El tiempo en milisegundos que el LED permanecerá encendido.
   */
  //------------------------------------------------------------------------------------
  // tiempo: numeros (de entrada)
  // -->
  // brillar() --> (enciende el LED, espera cierto tiempo y luego lo apaga)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void brillar (long tiempo) {
	encender ();
	esperar(tiempo); 
	apagar ();
  }
}; // class

// ----------------------------------------------------------
// ----------------------------------------------------------
// ----------------------------------------------------------
// ----------------------------------------------------------
#endif

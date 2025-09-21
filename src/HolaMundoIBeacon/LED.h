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
class LED {
private:
  int numeroLED;   // numeros (pin digital asociado al LED)
  bool encendido;  // boleano (estado del LED)

public:

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

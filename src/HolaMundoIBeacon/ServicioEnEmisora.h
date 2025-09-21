// -*- mode: c++ -*-

// ----------------------------------------------------------
// Jordi Bataller i Mascarell
// 2019-07-17
// ----------------------------------------------------------
#ifndef SERVICIO_EMISORA_H_INCLUIDO
#define SERVICIO_EMISORA_H_INCLUIDO

#include <vector>

// ----------------------------------------------------------
// Utilidades auxiliares
// ----------------------------------------------------------

//------------------------------------------------------------------------------------
// p: array de elementos, n: numeros (tamaño del array) (de entrada)
// -->
// alReves() --> (invierte en su lugar el contenido de un array)
// -->
// puntero al array invertido
//------------------------------------------------------------------------------------
template< typename T >
T * alReves( T * p, int n ) {
  T aux;
  for( int i=0; i < n/2; i++ ) {
	aux = p[i];
	p[i] = p[n-i-1];
	p[n-i-1] = aux;
  }
  return p;
} // ()

//------------------------------------------------------------------------------------
// pString: texto, pUint: array de numeros sin signo, tamMax: numeros (de entrada)
// -->
// stringAUint8AlReves() --> (convierte un string a un array de uint8_t, copiándolo al revés)
// -->
// puntero al array uint8_t con el string copiado
//------------------------------------------------------------------------------------
uint8_t * stringAUint8AlReves( const char * pString, uint8_t * pUint, int tamMax ) {

	int longitudString =  strlen( pString );
	int longitudCopiar = ( longitudString > tamMax ? tamMax : longitudString );

	for( int i=0; i<=longitudCopiar-1; i++ ) {
	  pUint[ tamMax-i-1 ] = pString[ i ];
	}
	return pUint;
} // ()

// ----------------------------------------------------------
// Clase ServicioEnEmisora
// ----------------------------------------------------------
// Esta clase representa un servicio BLE (Bluetooth Low Energy)
// que contiene varias características. Facilita la creación,
// configuración y activación de un servicio BLE completo con
// su UUID, características asociadas y callbacks.
// ----------------------------------------------------------

class ServicioEnEmisora {

public:

  //------------------------------------------------------------------------------------
  // Tipo de callback para notificar cuando se escribe en una característica
  //------------------------------------------------------------------------------------
  using CallbackCaracteristicaEscrita = void ( uint16_t conn_handle,
											   BLECharacteristic * chr,
											   uint8_t * data,
											   uint16_t len); 

  // --------------------------------------------------------
  // Clase interna Caracteristica
  // --------------------------------------------------------
  // Representa una característica de un servicio BLE.
  // Cada característica tiene un UUID, propiedades,
  // permisos, tamaño y callbacks configurables.
  // --------------------------------------------------------
  class Caracteristica {
  private:
	uint8_t uuidCaracteristica[16] = { 
	  '0','1','2','3','4','5','6','7',
	  '8','9','A','B','C','D','E','F'
	};

	BLECharacteristic laCaracteristica;

  public:

	//------------------------------------------------------------------------------------
	// nombreCaracteristica_: texto (de entrada)
	// -->
	// Caracteristica() --> (constructor, crea característica a partir del nombre en string)
	// -->
	// objeto Caracteristica
	//------------------------------------------------------------------------------------
	Caracteristica( const char * nombreCaracteristica_ )
	  :
	  laCaracteristica( stringAUint8AlReves( nombreCaracteristica_, &uuidCaracteristica[0], 16 ) )
	{ } // ()

	//------------------------------------------------------------------------------------
	// nombreCaracteristica_: texto, props: numeros, permisoRead: enumerado,
	// permisoWrite: enumerado, tam: numeros (de entrada)
	// -->
	// Caracteristica() --> (constructor completo que define propiedades, permisos y tamaño)
	// -->
	// objeto Caracteristica
	//------------------------------------------------------------------------------------
	Caracteristica( const char * nombreCaracteristica_ ,
					uint8_t props,
					SecureMode_t permisoRead,
					SecureMode_t permisoWrite, 
					uint8_t tam ) 
	  :
	  Caracteristica( nombreCaracteristica_ ) // llamada al otro constructor
	{
	  (*this).asignarPropiedadesPermisosYTamanyoDatos( props, permisoRead, permisoWrite, tam );
	} // ()

  private:

	//------------------------------------------------------------------------------------
	// props: numeros (de entrada)
	// -->
	// asignarPropiedades() --> (configura las propiedades de la característica: lectura, escritura, notificación)
	// -->
	// void
	//------------------------------------------------------------------------------------
	void asignarPropiedades ( uint8_t props ) {
	  (*this).laCaracteristica.setProperties( props );
	} // ()

	//------------------------------------------------------------------------------------
	// permisoRead: enumerado, permisoWrite: enumerado (de entrada)
	// -->
	// asignarPermisos() --> (configura permisos de lectura y escritura de la característica)
	// -->
	// void
	//------------------------------------------------------------------------------------
	void asignarPermisos( SecureMode_t permisoRead, SecureMode_t permisoWrite ) {
	  (*this).laCaracteristica.setPermission( permisoRead, permisoWrite );
	} // ()

	//------------------------------------------------------------------------------------
	// tam: numeros (de entrada)
	// -->
	// asignarTamanyoDatos() --> (establece el tamaño máximo de los datos de la característica)
	// -->
	// void
	//------------------------------------------------------------------------------------
	void asignarTamanyoDatos( uint8_t tam ) {
	  (*this).laCaracteristica.setMaxLen( tam );
	} // ()

  public:

	//------------------------------------------------------------------------------------
	// props: numeros, permisoRead: enumerado, permisoWrite: enumerado, tam: numeros (de entrada)
	// -->
	// asignarPropiedadesPermisosYTamanyoDatos() --> (configura todo de golpe: props, permisos y tamaño)
	// -->
	// void
	//------------------------------------------------------------------------------------
	void asignarPropiedadesPermisosYTamanyoDatos( uint8_t props,
												 SecureMode_t permisoRead,
												 SecureMode_t permisoWrite, 
												 uint8_t tam ) {
	  asignarPropiedades( props );
	  asignarPermisos( permisoRead, permisoWrite );
	  asignarTamanyoDatos( tam );
	} // ()
												 
	//------------------------------------------------------------------------------------
	// str: texto (de entrada)
	// -->
	// escribirDatos() --> (escribe datos en la característica BLE)
	// -->
	// cantidad de bytes escritos: numero N
	//------------------------------------------------------------------------------------
	uint16_t escribirDatos( const char * str ) {
	  return (*this).laCaracteristica.write( str );
	} // ()

	//------------------------------------------------------------------------------------
	// str: texto (de entrada)
	// -->
	// notificarDatos() --> (envía notificación BLE con los datos de la característica)
	// -->
	// cantidad de bytes notificados: numero N
	//------------------------------------------------------------------------------------
	uint16_t notificarDatos( const char * str ) {
	  return laCaracteristica.notify( &str[0] );
	} //  ()

	//------------------------------------------------------------------------------------
	// cb: función callback (de entrada)
	// -->
	// instalarCallbackCaracteristicaEscrita() --> (instala un callback que se ejecuta al escribir en la característica)
	// -->
	// void
	//------------------------------------------------------------------------------------
	void instalarCallbackCaracteristicaEscrita( CallbackCaracteristicaEscrita cb ) {
	  (*this).laCaracteristica.setWriteCallback( cb );
	} // ()

	//------------------------------------------------------------------------------------
	// sin parámetros (de entrada)
	// -->
	// activar() --> (inicia la característica BLE y la hace disponible)
	// -->
	// void
	//------------------------------------------------------------------------------------
	void activar() {
	  err_t error = (*this).laCaracteristica.begin();
	  Globales::elPuerto.escribir(  " (*this).laCaracteristica.begin(); error = " );
	  Globales::elPuerto.escribir(  error );
	} // ()
  }; // class Caracteristica
  

private:
  
  uint8_t uuidServicio[16] = { 
	'0','1','2','3','4','5','6','7',
	'8','9','A','B','C','D','E','F'
  };

  BLEService elServicio;
  std::vector< Caracteristica * > lasCaracteristicas;

public:
  
  //------------------------------------------------------------------------------------
  // nombreServicio_: texto (de entrada)
  // -->
  // ServicioEnEmisora() --> (constructor que inicializa un servicio BLE con el nombre dado)
  // -->
  // objeto ServicioEnEmisora
  //------------------------------------------------------------------------------------
  ServicioEnEmisora( const char * nombreServicio_ )
	:
	elServicio( stringAUint8AlReves( nombreServicio_, &uuidServicio[0], 16 ) )
  { } // ()
  
  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // escribeUUID() --> (muestra el UUID del servicio por Serial)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void escribeUUID() {
	Serial.println ( "**********" );
	for (int i=0; i<= 15; i++) {
	  Serial.print( (char) uuidServicio[i] );
	}
	Serial.println ( "\n**********" );
  } // ()

  //------------------------------------------------------------------------------------
  // car: referencia a Caracteristica (de entrada)
  // -->
  // anyadirCaracteristica() --> (añade una característica al servicio)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void anyadirCaracteristica( Caracteristica & car ) {
	(*this).lasCaracteristicas.push_back( & car );
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // activarServicio() --> (activa el servicio y todas sus características asociadas)
  // -->
  // void
  //------------------------------------------------------------------------------------
  void activarServicio( ) {
	err_t error = (*this).elServicio.begin();
	Serial.print( " (*this).elServicio.begin(); error = " );
	Serial.println( error );

	for( auto pCar : (*this).lasCaracteristicas ) {
	  (*pCar).activar();
	}
  } // ()

  //------------------------------------------------------------------------------------
  // sin parámetros (de entrada)
  // -->
  // conversión a BLEService& --> (permite usar un ServicioEnEmisora donde se espere un BLEService)
  // -->
  // referencia a BLEService
  //------------------------------------------------------------------------------------
  operator BLEService&() {
	return elServicio;
  } // ()
	
}; // class

#endif

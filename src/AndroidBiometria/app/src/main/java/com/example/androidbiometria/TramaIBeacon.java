package com.example.androidbiometria;

import java.util.Arrays;

// -----------------------------------------------------------------------------------
// Fichero: TramaIBeacon.java
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Clase TramaIBeacon
// -----------------------------------------------------------------------------------
// Representa la estructura completa de una trama iBeacon a partir de los bytes
// capturados en una publicidad BLE (Bluetooth Low Energy).
//
// Divide los bytes en campos significativos:
//   - prefijo (cabecera de la trama iBeacon)
//   - uuid (identificador único del beacon)
//   - major y minor (subidentificadores de aplicación)
//   - txPower (nivel de potencia estimada)
//   - además de banderas, cabecera de anuncio y metadatos
//
// Esta clase únicamente consulta y organiza los datos recibidos,
// no modifica el estado de la trama original.
// -----------------------------------------------------------------------------------
public class TramaIBeacon {

    // --------------------------------------------------------------------------------
// Campos principales de la trama
// --------------------------------------------------------------------------------
    private byte[] prefijo = null;      // 9 bytes (cabecera y metadatos)
    private byte[] uuid = null;         // 16 bytes (identificador único, puede interpretarse como texto o número)
    private byte[] major = null;        // 2 bytes (número natural)
    private byte[] minor = null;        // 2 bytes (número natural)
    private byte txPower = 0;           // 1 byte (número entero, potencia)
    private byte[] losBytes;            // array completo de bytes recibidos

    // --------------------------------------------------------------------------------
// Subcampos del prefijo
// --------------------------------------------------------------------------------
    private byte[] advFlags = null;     // 3 bytes (flags de la trama, generalmente bits)
    private byte[] advHeader = null;    // 2 bytes (cabecera del anuncio)
    private byte[] companyID = new byte[2]; // 2 bytes (identificador de compañía, número natural)
    private byte iBeaconType = 0 ;      // 1 byte (número natural, tipo de iBeacon)
    private byte iBeaconLength = 0 ;    // 1 byte (número natural, longitud de la trama iBeacon)


    // --------------------------------------------------------------------------------
    // Getters de los campos
    // --------------------------------------------------------------------------------
    // getPrefijo() --> bytes (9, cabecera y metadatos)
    public byte[] getPrefijo() { return prefijo; }

    // getUUID() --> bytes (16, identificador único, puede interpretarse como texto o número)
    public byte[] getUUID() { return uuid; }

    // getMajor() --> bytes (2, número natural)
    public byte[] getMajor() { return major; }

    // getMinor() --> bytes (2, número natural)
    public byte[] getMinor() { return minor; }

    // getTxPower() --> byte (1, número entero, potencia estimada)
    public byte getTxPower() { return txPower; }

    // getLosBytes() --> bytes (array completo de la trama)
    public byte[] getLosBytes() { return losBytes; }

    // getAdvFlags() --> bytes (3, flags de la trama)
    public byte[] getAdvFlags() { return advFlags; }

    // getAdvHeader() --> bytes (2, cabecera del anuncio)
    public byte[] getAdvHeader() { return advHeader; }

    // getCompanyID() --> bytes (2, número natural, identificador de compañía)
    public byte[] getCompanyID() { return companyID; }

    // getiBeaconType() --> byte (1, número natural, tipo de iBeacon)
    public byte getiBeaconType() { return iBeaconType; }

    // getiBeaconLength() --> byte (1, número natural, longitud de la trama iBeacon)
    public byte getiBeaconLength() { return iBeaconLength; }

    // --------------------------------------------------------------------------------
    // Constructor
    // --------------------------------------------------------------------------------
    // bytes: [ bytes ]
    // -->
    // TramaIBeacon() --> separa los campos de una trama iBeacon según su posición
    // -->
    // objeto TramaIBeacon con todos los subcampos accesibles
    // --------------------------------------------------------------------------------
    public TramaIBeacon(byte[] bytes ) {
        this.losBytes = bytes;

        // Campo principal (prefijo + uuid + major + minor + txPower)
        prefijo = Arrays.copyOfRange(losBytes, 0, 9 );   // 9 bytes
        uuid = Arrays.copyOfRange(losBytes, 9, 25 );     // 16 bytes
        major = Arrays.copyOfRange(losBytes, 25, 27 );   // 2 bytes
        minor = Arrays.copyOfRange(losBytes, 27, 29 );   // 2 bytes
        txPower = losBytes[29];                          // 1 byte

        // Subcampos del prefijo
        advFlags = Arrays.copyOfRange( prefijo, 0, 3 );   // 3 bytes
        advHeader = Arrays.copyOfRange( prefijo, 3, 5 );  // 2 bytes
        companyID = Arrays.copyOfRange( prefijo, 5, 7 );  // 2 bytes
        iBeaconType = prefijo[ 7 ];                       // 1 byte
        iBeaconLength = prefijo[ 8 ];                     // 1 byte
    } // ()
} // class

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

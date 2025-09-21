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
    private byte[] prefijo = null;      // 9 bytes
    private byte[] uuid = null;         // 16 bytes
    private byte[] major = null;        // 2 bytes
    private byte[] minor = null;        // 2 bytes
    private byte txPower = 0;           // 1 byte
    private byte[] losBytes;            // array completo

    // --------------------------------------------------------------------------------
    // Subcampos del prefijo
    // --------------------------------------------------------------------------------
    private byte[] advFlags = null;     // 3 bytes
    private byte[] advHeader = null;    // 2 bytes
    private byte[] companyID = new byte[2]; // 2 bytes
    private byte iBeaconType = 0 ;      // 1 byte
    private byte iBeaconLength = 0 ;    // 1 byte

    // --------------------------------------------------------------------------------
    // Getters de los campos
    // --------------------------------------------------------------------------------
    // getPrefijo() --> número (9 bytes)
    public byte[] getPrefijo() { return prefijo; }

    // getUUID() --> número (16 bytes)
    public byte[] getUUID() { return uuid; }

    // getMajor() --> número natural (2 bytes)
    public byte[] getMajor() { return major; }

    // getMinor() --> número natural (2 bytes)
    public byte[] getMinor() { return minor; }

    // getTxPower() --> número entero (1 byte)
    public byte getTxPower() { return txPower; }

    // getLosBytes() --> número (array completo)
    public byte[] getLosBytes() { return losBytes; }

    // getAdvFlags() --> número (3 bytes)
    public byte[] getAdvFlags() { return advFlags; }

    // getAdvHeader() --> número (2 bytes)
    public byte[] getAdvHeader() { return advHeader; }

    // getCompanyID() --> número natural (2 bytes)
    public byte[] getCompanyID() { return companyID; }

    // getiBeaconType() --> número natural (1 byte)
    public byte getiBeaconType() { return iBeaconType; }

    // getiBeaconLength() --> número natural (1 byte)
    public byte getiBeaconLength() { return iBeaconLength; }

    // --------------------------------------------------------------------------------
    // Constructor
    // --------------------------------------------------------------------------------
    // bytes: array de bytes (entrada)
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

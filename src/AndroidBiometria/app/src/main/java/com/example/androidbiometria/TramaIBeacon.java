package com.example.androidbiometria;

import java.util.Arrays;

/**
 * @file TramaIBeacon.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Clase que representa la estructura de una trama iBeacon.
 *
 * Esta clase procesa los bytes capturados en una publicidad BLE (Bluetooth Low Energy)
 * y los organiza en los campos estándar del protocolo iBeacon:
 * prefijo, UUID, Major, Minor y TxPower.
 * También extrae información adicional como flags y cabeceras de anuncio.
 *
 * La clase es de solo lectura respecto a los datos procesados.
 */
public class TramaIBeacon {

    // Campos principales de la trama
    private byte[] prefijo = null;      ///< 9 bytes (cabecera y metadatos)
    private byte[] uuid = null;         ///< 16 bytes (identificador único)
    private byte[] major = null;        ///< 2 bytes (subidentificador mayor)
    private byte[] minor = null;        ///< 2 bytes (subidentificador menor)
    private byte txPower = 0;           ///< 1 byte (potencia de transmisión a 1 metro)
    private byte[] losBytes;            ///< Array completo de bytes originales

    // Subcampos del prefijo
    private byte[] advFlags = null;     ///< 3 bytes (flags de publicidad)
    private byte[] advHeader = null;    ///< 2 bytes (cabecera del anuncio)
    private byte[] companyID = new byte[2]; ///< 2 bytes (ID de compañía, e.g., Apple 0x004C)
    private byte iBeaconType = 0 ;      ///< 1 byte (tipo de beacon, 0x02 para iBeacon)
    private byte iBeaconLength = 0 ;    ///< 1 byte (longitud de datos restantes, 0x15)

    /**
     * @brief Obtiene el prefijo de la trama.
     * @return Array de 9 bytes con cabecera y metadatos.
     */
    public byte[] getPrefijo() { return prefijo; }

    /**
     * @brief Obtiene el UUID del beacon.
     * @return Array de 16 bytes representando el identificador único.
     */
    public byte[] getUUID() { return uuid; }

    /**
     * @brief Obtiene el valor Major.
     * @return Array de 2 bytes.
     */
    public byte[] getMajor() { return major; }

    /**
     * @brief Obtiene el valor Minor.
     * @return Array de 2 bytes.
     */
    public byte[] getMinor() { return minor; }

    /**
     * @brief Obtiene la potencia de transmisión calibrada (TxPower).
     * @return Byte con el valor de potencia.
     */
    public byte getTxPower() { return txPower; }

    /**
     * @brief Obtiene la trama completa en bytes.
     * @return Array de bytes originales.
     */
    public byte[] getLosBytes() { return losBytes; }

    /**
     * @brief Obtiene los flags de publicidad (AdvFlags).
     * @return Array de 3 bytes.
     */
    public byte[] getAdvFlags() { return advFlags; }

    /**
     * @brief Obtiene la cabecera del anuncio (AdvHeader).
     * @return Array de 2 bytes.
     */
    public byte[] getAdvHeader() { return advHeader; }

    /**
     * @brief Obtiene el identificador de la compañía.
     * @return Array de 2 bytes.
     */
    public byte[] getCompanyID() { return companyID; }

    /**
     * @brief Obtiene el tipo de iBeacon.
     * @return Byte que indica el tipo.
     */
    public byte getiBeaconType() { return iBeaconType; }

    /**
     * @brief Obtiene la longitud de los datos del iBeacon.
     * @return Byte con la longitud.
     */
    public byte getiBeaconLength() { return iBeaconLength; }

    /**
     * @brief Constructor de la clase TramaIBeacon.
     *
     * Descompone el array de bytes recibido en sus componentes lógicos según
     * la especificación iBeacon.
     *
     * @param bytes Array de bytes capturados del escaneo BLE.
     */
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
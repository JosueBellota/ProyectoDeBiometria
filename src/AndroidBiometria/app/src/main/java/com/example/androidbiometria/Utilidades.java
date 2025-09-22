package com.example.androidbiometria;

import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.util.UUID;

// -----------------------------------------------------------------------------------
// Fichero: Ultilidades.java
// Responsable: Josue Bellota Ichaso
//
// -----------------------------------------------------------------------------------
//
// Clase Utilidades
// -----------------------------------------------------------------------------------
// Esta clase contiene métodos estáticos de conversión entre diferentes tipos de datos:
// cadenas de texto, bytes, enteros, long, UUID y representaciones hexadecimales.
// Ninguno de los métodos modifica la clase ni mantiene estado interno,
// simplemente realizan cálculos y transformaciones sobre los parámetros de entrada.
// -----------------------------------------------------------------------------------
public class Utilidades {

    // -----------------------------------------------------------------------------------
    // texto: caracteres (de entrada)
    // -->
    // stringToBytes() --> (convierte un String en un array de bytes)
    // -->
    // array de bytes
    // -----------------------------------------------------------------------------------
    public static byte[] stringToBytes ( String texto ) {
        return texto.getBytes();
        // byte[] b = string.getBytes(StandardCharsets.UTF_8); // Ja
    } // ()

    // -----------------------------------------------------------------------------------
    // uuid: caracteres (16 de entrada)
    // -->
    // stringToUUID() --> (convierte un String de 16 caracteres en un objeto UUID)
    // -->
    // objeto UUID
    // -----------------------------------------------------------------------------------
    public static UUID stringToUUID( String uuid ) {
        if ( uuid.length() != 16 ) {
            throw new Error( "stringUUID: string no tiene 16 caracteres ");
        }
        byte[] comoBytes = uuid.getBytes();

        String masSignificativo = uuid.substring(0, 8);
        String menosSignificativo = uuid.substring(8, 16);
        UUID res = new UUID(
                Utilidades.bytesToLong( masSignificativo.getBytes() ),
                Utilidades.bytesToLong( menosSignificativo.getBytes() )
        );

        return res;
    } // ()

    // -----------------------------------------------------------------------------------
    // uuid: objeto UUID (de entrada)
    // -->
    // uuidToString() --> (convierte un UUID en cadena de texto)
    // -->
    // texto (String)
    // -----------------------------------------------------------------------------------
    public static String uuidToString ( UUID uuid ) {
        return bytesToString(
                dosLongToBytes( uuid.getMostSignificantBits(), uuid.getLeastSignificantBits() )
        );
    } // ()

    // -----------------------------------------------------------------------------------
    // uuid: objeto UUID (de entrada)
    // -->
    // uuidToHexString() --> (convierte un UUID en cadena de texto hexadecimal)
    // -->
    // texto (String en formato hex)
    // -----------------------------------------------------------------------------------
    public static String uuidToHexString ( UUID uuid ) {
        return bytesToHexString(
                dosLongToBytes( uuid.getMostSignificantBits(), uuid.getLeastSignificantBits() )
        );
    } // ()

    // -----------------------------------------------------------------------------------
    // bytes: array de bytes (de entrada)
    // -->
    // bytesToString() --> (convierte un array de bytes en un String interpretando cada byte como carácter)
    // -->
    // texto (String)
    // -----------------------------------------------------------------------------------
    public static String bytesToString( byte[] bytes ) {
        if (bytes == null ) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append( (char) b );
        }
        return sb.toString();
    } // ()

    // -----------------------------------------------------------------------------------
    // masSignificativos: número entero largo
    // menosSignificativos: número entero largo
    // -->
    // dosLongToBytes() --> (convierte dos valores long en un array de 16 bytes)
    // -->
    // array de bytes
    // -----------------------------------------------------------------------------------
    public static byte[] dosLongToBytes( long masSignificativos, long menosSignificativos ) {
        ByteBuffer buffer = ByteBuffer.allocate( 2 * Long.BYTES );
        buffer.putLong( masSignificativos );
        buffer.putLong( menosSignificativos );
        return buffer.array();
    } // ()

    // -----------------------------------------------------------------------------------
    // bytes: array de bytes (de entrada)
    // -->
    // bytesToInt() --> (convierte un array de bytes en un número entero int)
    // -->
    // número entero (int)
    // -----------------------------------------------------------------------------------
    public static int bytesToInt( byte[] bytes ) {
        return new BigInteger(bytes).intValue();
    } // ()

    // -----------------------------------------------------------------------------------
    // bytes: array de bytes (de entrada)
    // -->
    // bytesToLong() --> (convierte un array de bytes en un número entero largo long)
    // -->
    // número entero largo (long)
    // -----------------------------------------------------------------------------------
    public static long bytesToLong( byte[] bytes ) {
        return new BigInteger(bytes).longValue();
    } // ()

    // -----------------------------------------------------------------------------------
    // bytes: array de bytes (máx 4 de entrada)
    // -->
    // bytesToIntOK() --> (convierte un array de hasta 4 bytes en un número entero int, con control de signo)
    // -->
    // número entero (int)
    // -----------------------------------------------------------------------------------
    public static int bytesToIntOK( byte[] bytes ) {
        if (bytes == null ) {
            return 0;
        }

        if ( bytes.length > 4 ) {
            throw new Error( "demasiados bytes para pasar a int ");
        }
        int res = 0;

        for( byte b : bytes ) {
            res =  (res << 8) + (b & 0xFF);
        } // for

        if ( (bytes[ 0 ] & 0x8) != 0 ) {
            res = -(~(byte)res)-1;
        }

        return res;
    } // ()

    // -----------------------------------------------------------------------------------
    // bytes: array de bytes (de entrada)
    // -->
    // bytesToHexString() --> (convierte un array de bytes en una cadena de texto en formato hexadecimal)
    // -->
    // texto (String en formato hex con separadores ":")
    // -----------------------------------------------------------------------------------
    public static String bytesToHexString( byte[] bytes ) {
        if (bytes == null ) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
            sb.append(':');
        }
        return sb.toString();
    } // ()
} // class
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

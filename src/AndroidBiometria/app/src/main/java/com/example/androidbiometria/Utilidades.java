package com.example.androidbiometria;

import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.util.UUID;

/**
 * @file Utilidades.java
 * @author josue bellota ichaso
 * @date 11/23/2025
 * @brief Clase de utilidades para conversiones de tipos de datos.
 *
 * Esta clase contiene métodos estáticos de conversión entre diferentes tipos de datos:
 * cadenas de texto, bytes, enteros, long, UUID y representaciones hexadecimales.
 * Ninguno de los métodos modifica la clase ni mantiene estado interno.
 */
public class Utilidades {

    /**
     * @brief Convierte un String en un array de bytes.
     * @param texto Cadena de texto a convertir.
     * @return Array de bytes resultante.
     */
    public static byte[] stringToBytes ( String texto ) {
        return texto.getBytes();
        // byte[] b = string.getBytes(StandardCharsets.UTF_8); // Ja
    } // ()

    /**
     * @brief Convierte un String de 16 caracteres en un objeto UUID.
     * @param uuid Cadena de 16 caracteres.
     * @return Objeto UUID generado.
     * @throws Error Si la cadena no tiene 16 caracteres.
     */
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

    /**
     * @brief Convierte un objeto UUID en una cadena de texto.
     * @param uuid Objeto UUID a convertir.
     * @return Representación en cadena del UUID.
     */
    public static String uuidToString ( UUID uuid ) {
        return bytesToString(
                dosLongToBytes( uuid.getMostSignificantBits(), uuid.getLeastSignificantBits() )
        );
    } // ()

    /**
     * @brief Convierte un UUID en una cadena de texto hexadecimal.
     * @param uuid Objeto UUID a convertir.
     * @return Cadena hexadecimal del UUID.
     */
    public static String uuidToHexString ( UUID uuid ) {
        return bytesToHexString(
                dosLongToBytes( uuid.getMostSignificantBits(), uuid.getLeastSignificantBits() )
        );
    } // ()

    /**
     * @brief Convierte un array de bytes en un String interpretando cada byte como carácter.
     * @param bytes Array de bytes a convertir.
     * @return Cadena de texto resultante.
     */
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

    /**
     * @brief Convierte dos valores long en un array de 16 bytes.
     * @param masSignificativos Parte más significativa.
     * @param menosSignificativos Parte menos significativa.
     * @return Array de 16 bytes.
     */
    public static byte[] dosLongToBytes( long masSignificativos, long menosSignificativos ) {
        ByteBuffer buffer = ByteBuffer.allocate( 2 * Long.BYTES );
        buffer.putLong( masSignificativos );
        buffer.putLong( menosSignificativos );
        return buffer.array();
    } // ()

    /**
     * @brief Convierte un array de bytes en un número entero int.
     * @param bytes Array de bytes.
     * @return Valor entero resultante.
     */
    public static int bytesToInt( byte[] bytes ) {
        return new BigInteger(bytes).intValue();
    } // ()

    /**
     * @brief Convierte un array de bytes en un número entero largo long.
     * @param bytes Array de bytes.
     * @return Valor long resultante.
     */
    public static long bytesToLong( byte[] bytes ) {
        return new BigInteger(bytes).longValue();
    } // ()

    /**
     * @brief Convierte un array de hasta 4 bytes en un entero con control de signo.
     * @param bytes Array de bytes (máximo 4).
     * @return Valor entero resultante.
     * @throws Error Si el array tiene más de 4 bytes.
     */
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

    /**
     * @brief Convierte un array de bytes en una cadena hexadecimal.
     * @param bytes Array de bytes.
     * @return Cadena en formato hexadecimal separada por dos puntos.
     */
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
package com.example.androidbiometria;
// ------------------------------------------------------------------
// ------------------------------------------------------------------

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.Arrays;
import java.util.List;

// -----------------------------------------------------------------------------------
//
// Fichero:MainActivity.java
// Responsable: Josue Bellota Ichaso
//
// Funcionalidad:
//  - Inicializa Bluetooth y el escáner BLE
//  - Gestiona permisos necesarios
//  - Permite buscar todos los dispositivos BLE o un dispositivo específico
//  - Muestra información detallada de cada dispositivo detectado
// -----------------------------------------------------------------------------------


public class MainActivity extends AppCompatActivity {

// ---------------------------------------------------------------------------
// Constantes y variables globales
// ---------------------------------------------------------------------------

    // ETIQUETA_LOG: texto (String)
    private static final String ETIQUETA_LOG = ">>>>";

    // CODIGO_PETICION_PERMISOS: número N
    private static final int CODIGO_PETICION_PERMISOS = 11223344;

    // firebaseManager: objeto
    private EnviarDatosDeIBeacon enviarDatosDeIBeacon;

    // elEscanner: objeto
    private BluetoothLeScanner elEscanner;

    // callbackDelEscaneo: objeto
    private ScanCallback callbackDelEscaneo = null;

    private boolean testeado = false;

    private boolean enviadoAFirebase = false;

    // ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Log.d(ETIQUETA_LOG, "onCreate(): empieza");

        // Inicializar Bluetooth y obtener el escáner
        inicializarBlueTooth();

        // Crear el objeto que enviará datos a Firebase
        enviarDatosDeIBeacon = new EnviarDatosDeIBeacon();

        // Test inicial de Firebase: solo verifica que el objeto no sea null
        Testeos.testFirebase(enviarDatosDeIBeacon);

        Log.d(ETIQUETA_LOG, "onCreate(): termina");
    } // onCreate()

    // --------------------------------------------------------------------------------
    // Sin parámetros de entrada
    // -->
    // buscarTodosLosDispositivosBTLE() --> inicia el escaneo BLE
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    private void buscarTodosLosDispositivosBTLE() {
        Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): empieza ");

        // AÑADIR: Verificación de permisos BLUETOOTH_SCAN
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
            Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): Sin permiso BLUETOOTH_SCAN");
            return;
        }

        Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): instalamos scan callback ");

        this.callbackDelEscaneo = new ScanCallback() {
            @Override
            public void onScanResult( int callbackType, ScanResult resultado ) {
                super.onScanResult(callbackType, resultado);
                Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): onScanResult() ");

                mostrarInformacionDispositivoBTLE( resultado );
            }

            @Override
            public void onBatchScanResults(List<ScanResult> results) {
                super.onBatchScanResults(results);
                Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): onBatchScanResults() ");

            }

            @Override
            public void onScanFailed(int errorCode) {
                super.onScanFailed(errorCode);
                Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): onScanFailed() ");

            }
        };

        Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): empezamos a escanear ");

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
            Log.d(ETIQUETA_LOG, " buscarTodosLosDispositivosBTL(): Sin permiso BLUETOOTH_SCAN");
            return;
        }
        this.elEscanner.startScan( this.callbackDelEscaneo);

    } // ()

    // --------------------------------------------------------------------------------
    // resultado: ScanResult (escaneo de dispositivo detectado)
    // -->
    // mostrarInformacionDispositivoBTLE(resultado) --> procesa y muestra información del dispositivo
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    private void mostrarInformacionDispositivoBTLE( ScanResult resultado ) {

        BluetoothDevice bluetoothDevice = resultado.getDevice();
        byte[] bytes = resultado.getScanRecord().getBytes();
        int rssi = resultado.getRssi();

        Log.d(ETIQUETA_LOG, " ****************************************************");
        Log.d(ETIQUETA_LOG, " ****** DISPOSITIVO DETECTADO BTLE ****************** ");
        Log.d(ETIQUETA_LOG, " ****************************************************");

        // AÑADIR: Verificación de permisos BLUETOOTH_CONNECT para getName()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
            Log.d(ETIQUETA_LOG, " nombre = " + bluetoothDevice.getName());
        } else {
            Log.d(ETIQUETA_LOG, " nombre = [Sin permiso BLUETOOTH_CONNECT]");
        }

        Log.d(ETIQUETA_LOG, " toString = " + bluetoothDevice.toString());

        /*
        ParcelUuid[] puuids = bluetoothDevice.getUuids();
        if ( puuids.length >= 1 ) {
            //Log.d(ETIQUETA_LOG, " uuid = " + puuids[0].getUuid());
           // Log.d(ETIQUETA_LOG, " uuid = " + puuids[0].toString());
        }*/

        // AÑADIR: Verificación de permisos BLUETOOTH_CONNECT para getAddress()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
            Log.d(ETIQUETA_LOG, " dirección = " + bluetoothDevice.getAddress());
        } else {
            Log.d(ETIQUETA_LOG, " dirección = [Sin permiso BLUETOOTH_CONNECT]");
        }

        Log.d(ETIQUETA_LOG, " rssi = " + rssi );

        Log.d(ETIQUETA_LOG, " bytes = " + new String(bytes));
        Log.d(ETIQUETA_LOG, " bytes (" + bytes.length + ") = " + Utilidades.bytesToHexString(bytes));

        TramaIBeacon tib = new TramaIBeacon(bytes);

        Log.d(ETIQUETA_LOG, " ----------------------------------------------------");
        Log.d(ETIQUETA_LOG, " prefijo  = " + Utilidades.bytesToHexString(tib.getPrefijo()));
        Log.d(ETIQUETA_LOG, "          advFlags = " + Utilidades.bytesToHexString(tib.getAdvFlags()));
        Log.d(ETIQUETA_LOG, "          advHeader = " + Utilidades.bytesToHexString(tib.getAdvHeader()));
        Log.d(ETIQUETA_LOG, "          companyID = " + Utilidades.bytesToHexString(tib.getCompanyID()));
        Log.d(ETIQUETA_LOG, "          iBeacon type = " + Integer.toHexString(tib.getiBeaconType()));
        Log.d(ETIQUETA_LOG, "          iBeacon length 0x = " + Integer.toHexString(tib.getiBeaconLength()) + " ( "
                + tib.getiBeaconLength() + " ) ");
        Log.d(ETIQUETA_LOG, " uuid  = " + Utilidades.bytesToHexString(tib.getUUID()));
        Log.d(ETIQUETA_LOG, " uuid  = " + Utilidades.bytesToString(tib.getUUID()));
        Log.d(ETIQUETA_LOG, " major  = " + Utilidades.bytesToHexString(tib.getMajor()) + "( "
                + Utilidades.bytesToInt(tib.getMajor()) + " ) ");
        Log.d(ETIQUETA_LOG, " minor  = " + Utilidades.bytesToHexString(tib.getMinor()) + "( "
                + Utilidades.bytesToInt(tib.getMinor()) + " ) ");
        Log.d(ETIQUETA_LOG, " txPower  = " + Integer.toHexString(tib.getTxPower()) + " ( " + tib.getTxPower() + " )");
        Log.d(ETIQUETA_LOG, " ****************************************************");

    } // ()

    // --------------------------------------------------------------------------------
    // dispositivoBuscado: String (nombre del dispositivo a buscar)
    // -->
    // buscarEsteDispositivoBTLE() --> inicia escaneo filtrado por nombre
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    private void buscarEsteDispositivoBTLE(final String dispositivoBuscado ) {
        Log.d(ETIQUETA_LOG, " buscarEsteDispositivoBTLE(): empieza ");

        // AÑADIR: Verificación de permisos BLUETOOTH_SCAN
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
            Log.d(ETIQUETA_LOG, " buscarEsteDispositivoBTLE(): Sin permiso BLUETOOTH_SCAN");
            return;
        }

        Log.d(ETIQUETA_LOG, "  buscarEsteDispositivoBTLE(): instalamos scan callback ");

        this.callbackDelEscaneo = new ScanCallback() {
            @Override
            public void onScanResult( int callbackType, ScanResult resultado ) {
                super.onScanResult(callbackType, resultado);
                Log.d(ETIQUETA_LOG, "  buscarEsteDispositivoBTLE(): onScanResult() ");

                mostrarInformacionDispositivoBTLE( resultado );


                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.BLUETOOTH_CONNECT)
                        == PackageManager.PERMISSION_GRANTED) {

                    String nombreDetectado = resultado.getDevice().getName();

                    if (nombreDetectado != null && !testeado) {
                        testeado = true;

                        // 🔹 Solo test de filtro
                        boolean filtroOk = Testeos.testFiltrarDispositivo(nombreDetectado);

                        // 🔹 Solo si pasó el test, enviamos a Firebase
                        if (filtroOk && !enviadoAFirebase) {
                            enviadoAFirebase = true;
                            Testeos.testEnviarAFirebase(nombreDetectado, enviarDatosDeIBeacon);
                        }
                    }
                }

            }

            @Override
            public void onBatchScanResults(List<ScanResult> results) {
                super.onBatchScanResults(results);
                Log.d(ETIQUETA_LOG, "  buscarEsteDispositivoBTLE(): onBatchScanResults() ");

            }

            @Override
            public void onScanFailed(int errorCode) {
                super.onScanFailed(errorCode);
                Log.d(ETIQUETA_LOG, "  buscarEsteDispositivoBTLE(): onScanFailed() ");

            }
        };

        // Crear el filtro (aunque Android a veces ignora los filtros de nombre)
        ScanFilter sf = new ScanFilter.Builder()
                .setDeviceName(dispositivoBuscado)
                .build();
        // Configuración del escaneo
        ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();


        try {
            // ✅ Aplicar el filtro CORRECTAMENTE
            this.elEscanner.startScan(Arrays.asList(sf), settings, this.callbackDelEscaneo);
            Log.d(ETIQUETA_LOG, "Escaneando específicamente para: " + dispositivoBuscado);
        } catch (Exception e) {
            Log.e(ETIQUETA_LOG, "Error al iniciar escaneo filtrado: " + e.getMessage());

            // Fallback: escanear todo y filtrar manualmente
            this.elEscanner.startScan(this.callbackDelEscaneo);
            Log.d(ETIQUETA_LOG, "Usando escaneo general con filtro manual");
        }
    } // ()

    // --------------------------------------------------------------------------------
    // Sin parámetros de entrada
    // -->
    // detenerBusquedaDispositivosBTLE() --> detiene escaneo BLE activo
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    private void detenerBusquedaDispositivosBTLE() {

        // AÑADIR: Verificar si el escáner es nulo
        if (this.elEscanner == null) {
            Log.d(ETIQUETA_LOG, "detenerBusquedaDispositivosBTLE(): elEscanner es null");
            return;
        }

        if (this.callbackDelEscaneo == null) {
            Log.d(ETIQUETA_LOG, "detenerBusquedaDispositivosBTLE(): No hay escaneo activo");
            return;
        }

        // AÑADIR: Verificación de permisos BLUETOOTH_SCAN
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
            Log.d(ETIQUETA_LOG, "detenerBusquedaDispositivosBTLE(): Sin permiso BLUETOOTH_SCAN");
            return;
        }

        try {
            this.elEscanner.stopScan(this.callbackDelEscaneo);
            Log.d(ETIQUETA_LOG, "detenerBusquedaDispositivosBTLE(): Escaneo detenido exitosamente");
        } catch (SecurityException e) {
            Log.e(ETIQUETA_LOG, "detenerBusquedaDispositivosBTLE(): Error de seguridad: " + e.getMessage());
        } catch (Exception e) {
            Log.e(ETIQUETA_LOG, "detenerBusquedaDispositivosBTLE(): Error inesperado: " + e.getMessage());
        } finally {
            this.callbackDelEscaneo = null;
        }
    } // ()

    // --------------------------------------------------------------------------------
    // v: View (botón pulsado)
    // -->
    // botonBuscarDispositivosBTLEPulsado(v) --> lanza búsqueda de todos los dispositivos
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    public void botonBuscarDispositivosBTLEPulsado( View v ) {
        Log.d(ETIQUETA_LOG, " boton buscar dispositivos BTLE Pulsado" );
        this.buscarTodosLosDispositivosBTLE();
    } // ()

    // --------------------------------------------------------------------------------
    // v: View (botón pulsado)
    // -->
    // botonBuscarNuestroDispositivoBTLEPulsado(v) --> lanza búsqueda filtrada por nombre
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    public void botonBuscarNuestroDispositivoBTLEPulsado( View v ) {
        Log.d(ETIQUETA_LOG, " boton nuestro dispositivo BTLE Pulsado" );
        this.buscarEsteDispositivoBTLE( "LE_WH-1000XM5" );

    } // ()

    // --------------------------------------------------------------------------------
    // v: View (botón pulsado)
    // -->
    // botonDetenerBusquedaDispositivosBTLEPulsado(v) --> detiene escaneo activo
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    public void botonDetenerBusquedaDispositivosBTLEPulsado( View v ) {
        Log.d(ETIQUETA_LOG, " boton detener busqueda dispositivos BTLE Pulsado" );
        this.detenerBusquedaDispositivosBTLE();
    } // ()

    // --------------------------------------------------------------------------------
    // Sin parámetros de entrada
    // -->
    // inicializarBlueTooth() --> habilita adaptador BT y solicita permisos necesarios
    // -->
    // void (sin valor de retorno)
    // --------------------------------------------------------------
    private void inicializarBlueTooth() {
        Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): obtenemos adaptador BT ");

        BluetoothAdapter bta = BluetoothAdapter.getDefaultAdapter();

        Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): habilitamos adaptador BT ");

        // AÑADIR: Verificación de permisos BLUETOOTH_CONNECT antes de enable()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
            bta.enable();
        } else {
            Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): Sin permiso BLUETOOTH_CONNECT para habilitar");
        }

        Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): habilitado =  " + bta.isEnabled() );

        Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): estado =  " + bta.getState() );

        Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): obtenemos escaner btle ");

        this.elEscanner = bta.getBluetoothLeScanner();

        if ( this.elEscanner == null ) {
            Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): Socorro: NO hemos obtenido escaner btle  !!!!");

        }

        Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): voy a perdir permisos (si no los tuviera) !!!!");

        // ACTUALIZAR: Incluir todos los permisos necesarios
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH) != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADMIN) != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED
                || ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED)
        {
            ActivityCompat.requestPermissions(
                    MainActivity.this,
                    new String[]{
                            Manifest.permission.BLUETOOTH,
                            Manifest.permission.BLUETOOTH_ADMIN,
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.BLUETOOTH_SCAN,
                            Manifest.permission.BLUETOOTH_CONNECT
                    },
                    CODIGO_PETICION_PERMISOS);
        }
        else {
            Log.d(ETIQUETA_LOG, " inicializarBlueTooth(): parece que YA tengo los permisos necesarios !!!!");
        }
    } // ()



    // -----------------------------------------------------------------------------------
    // requestCode: número N (código de la petición de permisos)
    // permissions: [ texto ] (permisos solicitados)
    // grantResults: [ numeros N ] (resultado de cada permiso: concedido o denegado)
    // -->
    // onRequestPermissionsResult(requestCode, permissions, grantResults) --> procesa la respuesta de los permisos solicitados por el usuario
    // -->
    // void (sin valor de retorno)
    // -----------------------------------------------------------------------------------
    public void onRequestPermissionsResult(int requestCode, String[] permissions,
                                           int[] grantResults) {
        super.onRequestPermissionsResult( requestCode, permissions, grantResults);

        switch (requestCode) {
            case CODIGO_PETICION_PERMISOS:
                // If request is cancelled, the result arrays are empty.
                if (grantResults.length > 0 &&
                        grantResults[0] == PackageManager.PERMISSION_GRANTED) {

                    Log.d(ETIQUETA_LOG, " onRequestPermissionResult(): permisos concedidos  !!!!");
                    // Permission is granted. Continue the action or workflow
                    // in your app.
                }  else {

                    Log.d(ETIQUETA_LOG, " onRequestPermissionResult(): Socorro: permisos NO concedidos  !!!!");

                }
                return;
        }
        // Other 'case' lines to check for other
        // permissions this app might request.
    } // ()

} // class
// --------------------------------------------------------------
// --------------------------------------------------------------
// --------------------------------------------------------------
// --------------------------------------------------------------
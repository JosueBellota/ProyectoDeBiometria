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
    import android.os.Build;
    import android.os.Bundle;
    import android.util.Log;
    import android.view.View;

    import androidx.appcompat.app.AppCompatActivity;
    import androidx.core.app.ActivityCompat;
    import androidx.core.content.ContextCompat;

    import java.util.Arrays;
    import java.util.List;
    import android.app.NotificationChannel;
    import android.app.NotificationManager;
    import android.graphics.Color;
    import android.media.AudioManager;
    import android.media.ToneGenerator;
    import android.os.Build;

    import androidx.core.app.NotificationCompat;
    import androidx.core.app.NotificationManagerCompat;
    import android.content.Intent;
    import android.widget.Button;
    import android.widget.Toast;

    import com.google.firebase.auth.FirebaseAuth;
    import com.google.firebase.messaging.FirebaseMessaging;

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


        // elEscanner: objeto
        private BluetoothLeScanner elEscanner;

        // callbackDelEscaneo: objeto
        private ScanCallback callbackDelEscaneo = null;

        private boolean testeado = false;

        private String nombreDispositivoQR = null;


        // ---------------------------------------------------------------------------
        // Ciclo de vida
        // ---------------------------------------------------------------------------
        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            setContentView(R.layout.activity_main);


            // ---- LOGOUT ----
            findViewById(R.id.logoutButton).setOnClickListener(v -> {
                FirebaseAuth.getInstance().signOut();  // 🔥 Cierra sesión en Firebase
                FirebaseMessaging.getInstance().unsubscribeFromTopic(
                        FirebaseAuth.getInstance().getUid() == null ? "" : FirebaseAuth.getInstance().getUid()
                );

                Intent intent = new Intent(MainActivity.this, Login.class); // <-- o tu pantalla de login
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish(); // 🏁 Evita volver atrás con el botón "atrás"
            });

            // Permiso de notificaciones para Android 13+
            if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                            != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 2001);
            }


            Log.d(ETIQUETA_LOG, "onCreate(): empieza");

            // Inicializar Bluetooth y obtener el escáner
            inicializarBlueTooth();

            //generarNotificacion("CO₂ alto", "#27F531");

            Log.d(ETIQUETA_LOG, "onCreate(): termina");

            // ✅ Obtener UID *dentro* de onCreate
            String uid;
            if (FirebaseAuth.getInstance().getCurrentUser() != null) {
                uid = FirebaseAuth.getInstance().getCurrentUser().getUid();
            } else {
                uid = null;
            }

            if (uid != null) {
                FirebaseMessaging.getInstance().subscribeToTopic(uid)
                        .addOnCompleteListener(task -> {
                            if (task.isSuccessful()) {
                                Log.d(">>>>", "✅ Suscrito al topic del usuario: " + uid);
                            } else {
                                Log.w(">>>>", "❌ Error al suscribirse al topic del usuario", task.getException());
                            }
                        });
            } else {
                Log.w(">>>>", "⚠️ No hay usuario logueado, NO se puede suscribir a topic.");
            }


            findViewById(R.id.botonLeerQR).setOnClickListener(v -> {
                Intent intent = new Intent("com.google.zxing.client.android.SCAN");
                intent.putExtra("SCAN_MODE", "QR_CODE_MODE");
                try {
                    startActivityForResult(intent, 1234);
                } catch (Exception e) {
                    // Si no está instalada la app de escaneo → llevar a Play Store
                    Intent marketIntent = new Intent(Intent.ACTION_VIEW);
                    marketIntent.setData(android.net.Uri.parse("https://play.google.com/store/apps/details?id=com.google.zxing.client.android"));
                    startActivity(marketIntent);
                }
            });


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
                public void onScanResult(int callbackType, ScanResult resultado) {
                    super.onScanResult(callbackType, resultado);




                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.BLUETOOTH_CONNECT)
                            == PackageManager.PERMISSION_GRANTED) {

                        String nombreDetectado = resultado.getDevice().getName();

                        if (nombreDetectado != null && !testeado) {
                            testeado = true;
                            mostrarInformacionDispositivoBTLE(resultado);
                            // 🔹 Convertir a objeto estructurado
                            LogicaFake TramaConvertido = convertirScanResult(resultado);
                            Log.d(ETIQUETA_LOG, "  buscarEsteDispositivoBTLE(): onScanResult() ");
                            // Mostrar información del dispositivo


                            // 🔹 Enviar medida a Firebase usando el objeto convertido
                            TramaConvertido.guardarMedida();
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


        private LogicaFake convertirScanResult(ScanResult resultado) {
            BluetoothDevice bluetoothDevice = resultado.getDevice();
            byte[] bytes = resultado.getScanRecord().getBytes();
            int rssi = resultado.getRssi();

            TramaIBeacon tib = new TramaIBeacon(bytes);

            String nombre = (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED)
                    ? bluetoothDevice.getName()
                    : "[Sin permiso BLUETOOTH_CONNECT]";

            String direccion = (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED)
                    ? bluetoothDevice.getAddress()
                    : "[Sin permiso BLUETOOTH_CONNECT]";

            return new LogicaFake(
                    nombre,
                    direccion,
                    rssi,
                    Utilidades.bytesToHexString(bytes),
                    Utilidades.bytesToHexString(tib.getPrefijo()),
                    Utilidades.bytesToHexString(tib.getAdvFlags()),
                    Utilidades.bytesToHexString(tib.getAdvHeader()),
                    Utilidades.bytesToHexString(tib.getCompanyID()),
                    tib.getiBeaconType(),
                    tib.getiBeaconLength(),
                    Utilidades.bytesToHexString(tib.getUUID()),
                    Utilidades.bytesToString(tib.getUUID()),
                    Utilidades.bytesToInt(tib.getMajor()),
                    Utilidades.bytesToInt(tib.getMinor()),
                    tib.getTxPower()
            );
        }

        // ===========================================================
    // METODO PARA GENERAR UNA NOTIFICACIÓN LOCAL
    // ===========================================================
        private void generarNotificacion(String mensaje, String colorTexto) {

            int color = Color.RED;

            // Crear el canal (solo una vez) para Android 8.0+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel canal = new NotificationChannel(
                        "canal_alertas",            // ID del canal
                        "Alertas",                  // Nombre visible del canal
                        NotificationManager.IMPORTANCE_HIGH
                );
                canal.setDescription("Canal de notificaciones de alertas");
                canal.enableLights(true);
                canal.setLightColor(color);
                canal.enableVibration(true);
                NotificationManager gestor = getSystemService(NotificationManager.class);
                if (gestor != null) gestor.createNotificationChannel(canal);
            }

            // Construir la notificación
            NotificationCompat.Builder noti = new NotificationCompat.Builder(this, "canal_alertas")
                    .setSmallIcon(android.R.drawable.stat_sys_warning)
                    .setContentTitle("Alerta")
                    .setContentText(mensaje)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(mensaje))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setColor(color)       // colorea el acento de la notificación
                    .setColorized(true)
                    .setAutoCancel(true);

            // Android 13+: comprobar permiso antes de notificar
            if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                            != PackageManager.PERMISSION_GRANTED) {
                Log.w("generarNotificacion", "Sin permiso POST_NOTIFICATIONS en Android 13+");
                return;
            }

            NotificationManagerCompat.from(this).notify(123, noti.build());

            // Sonido al aparecer la notificación
            new Thread(() -> {
                ToneGenerator tg = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
                for (int i = 0; i < 3; i++) {
                    tg.startTone(ToneGenerator.TONE_PROP_BEEP, 200);
                    try { Thread.sleep(250); } catch (InterruptedException ignored) {}
                }
                tg.release();
            }).start();

            Log.d(">>>>>>", "Notificación generada: " + mensaje);
        }


        protected void onNewIntent(Intent intent) {
            super.onNewIntent(intent);
            if (intent.hasExtra("mensaje")) {
                String mensaje = intent.getStringExtra("mensaje");
                String color = intent.getStringExtra("color");
                generarNotificacion(mensaje, color);
            }
        }


        @Override
        protected void onActivityResult(int requestCode, int resultCode, Intent data) {
            super.onActivityResult(requestCode, resultCode, data);

            if (requestCode == 1234 && resultCode == RESULT_OK) {
                nombreDispositivoQR = data.getStringExtra("SCAN_RESULT");
                Log.d(ETIQUETA_LOG, "📌 QR leído = " + nombreDispositivoQR);

                // ✅ Cambiar texto del botón automáticamente
                Button botonQR = findViewById(R.id.botonBuscarQRBTLE);
                botonQR.setText(nombreDispositivoQR);
            }
        }


        public void botonBuscarDispositivoQR(View v) {
            if (nombreDispositivoQR == null) {
                Toast.makeText(this, "⚠ Primero debes escanear un QR", Toast.LENGTH_SHORT).show();
                return;
            }

            Log.d(ETIQUETA_LOG, "🔍 Buscando dispositivo leído del QR: " + nombreDispositivoQR);
            this.buscarEsteDispositivoBTLE(nombreDispositivoQR);


            // ✅ Nueva URL hacia tu intranet
            String url = "https://proyectodebiometria.web.app/intranet/" + nombreDispositivoQR;

            Intent intent = new Intent(MainActivity.this, WebNodoActivity.class);
            intent.putExtra("url", url);
            startActivity(intent);
        }


    } // class
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------
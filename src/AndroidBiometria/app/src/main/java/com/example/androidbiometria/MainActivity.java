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
import com.google.firebase.auth.FirebaseUser;
    import com.google.firebase.messaging.FirebaseMessaging;

    import android.content.Context;
    import android.location.LocationManager;
    import android.provider.Settings;
    import android.os.Handler;
    import android.app.AlertDialog;
    import android.view.Menu;
    import android.view.MenuInflater;
    import android.view.MenuItem;
    import androidx.appcompat.widget.Toolbar;

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


    import android.widget.LinearLayout;
    import android.view.Gravity;
    import android.widget.TextView;
    import android.graphics.Typeface;

    public class MainActivity extends AppCompatActivity {

    // ---------------------------------------------------------------------------
    // Constantes y variables globales
    // ---------------------------------------------------------------------------
        private DistanciaManager distanciaManager;
        
        // UI del Radar
        private RadarView radarViewActual;
        private TextView textoRadarActual;

        // ETIQUETA_LOG: texto (String)
        private static final String ETIQUETA_LOG = ">>>>>>";

        // CODIGO_PETICION_PERMISOS: número N
        private static final int CODIGO_PETICION_PERMISOS = 11223344;


        // elEscanner: objeto
        private BluetoothLeScanner elEscanner;

        // callbackDelEscaneo: objeto
        private ScanCallback callbackDelEscaneo = null;
        private String codigoNodoQR = null;  // El código del dispositivo (del QR)
        private String nombreNodoUsuario = null;  // El nombre amigable asignado por el usuario

        private String uidGlobal;

        private LogicaFake logica;
        private boolean nodoObtenido = false;

        private Handler watchdogHandler = new Handler();
        private Runnable watchdogRunnable;
        private String dispositivoBuscadoActual = null;

        private static final long TIMEOUT_BEACON_MS = 5000; // 5 segundos para detectar desconexión
        private static final long COOLDOWN_NOTIFICACION_MS = 3000; // 3 segundos entre notificaciones
        private long ultimaDeteccionBeacon = 0;
        private boolean beaconConectado = false;
        private long ultimaNotificacion = 0;
        private boolean escaneoActivo = false;


        // ---------------------------------------------------------------------------
        // Ciclo de Vida de la app
        // ---------------------------------------------------------------------------

        @Override
        protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);

            // --- Verificación de estado de autenticación ---
            FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
            if (user == null) {
                goToLogin();
                return;
            } else if (!user.isEmailVerified()) {
                goToVerifyEmail();
                return;
            }
            // --- Si todo está OK, continuar ---

            setContentView(R.layout.activity_main);

            // --- Toolbar Setup ---
            Toolbar toolbar = findViewById(R.id.toolbar);
            setSupportActionBar(toolbar);

            // WATCHDOG CORREGIDO - VERSIÓN MEJORADA
            watchdogRunnable = new Runnable() {
                @Override
                public void run() {
                    if (!escaneoActivo) {
                        return; // No hacer nada si no hay escaneo activo
                    }

                    long tiempoActual = System.currentTimeMillis();
                    long tiempoDesdeUltimaDeteccion = ultimaDeteccionBeacon > 0 ?
                            tiempoActual - ultimaDeteccionBeacon : Long.MAX_VALUE;
                    long tiempoDesdeUltimaNotificacion = tiempoActual - ultimaNotificacion;

                    // Solo notificar si alguna vez se detectó el beacon (ultimaDeteccionBeacon > 0)
                    boolean algunaVezDetectado = ultimaDeteccionBeacon > 0;

                    // Si ha pasado más de 5 segundos desde la última detección Y alguna vez se detectó
                    if (algunaVezDetectado && tiempoDesdeUltimaDeteccion > TIMEOUT_BEACON_MS) {
                        // Y ha pasado el cooldown desde la última notificación
                        if (tiempoDesdeUltimaNotificacion > COOLDOWN_NOTIFICACION_MS) {
                            String nodeName = (nombreNodoUsuario != null) ? nombreNodoUsuario : codigoNodoQR;
                            if (nodeName != null && !nodeName.isEmpty()) {
                                generarNotificacion("El nodo " + nodeName + " está apagado o desconectado", "rojo");
                                ultimaNotificacion = tiempoActual;
                                beaconConectado = false;
                                Log.w(ETIQUETA_LOG, "⚠️ Watchdog: Beacon desconectado - " + nodeName);

                                // Opcional: Toast de desconexión
                                runOnUiThread(() ->
                                        Toast.makeText(MainActivity.this, "⚠️ " + nodeName + " desconectado",
                                                Toast.LENGTH_LONG).show()
                                );
                            }
                        }
                    } else if (algunaVezDetectado) {
                        // El beacon está conectado
                        if (!beaconConectado) {
                            beaconConectado = true;
                            String nodeName = (nombreNodoUsuario != null) ? nombreNodoUsuario : codigoNodoQR;
                            Log.d(ETIQUETA_LOG, "✅ Watchdog: Beacon conectado - " + nodeName);

                            // Opcional: Toast de reconexión
                            runOnUiThread(() ->
                                    Toast.makeText(MainActivity.this, "✅ " + nodeName + " conectado",
                                            Toast.LENGTH_SHORT).show()
                            );
                        }
                    }

                    // Programar siguiente verificación en 1 segundo
                    watchdogHandler.postDelayed(this, 1000);
                }
            };

            // ---------------------------------------------------------------------------
            // LISTENER GLOBAL → Fuerza Logout si el servidor revoca la sesión
            // ---------------------------------------------------------------------------
            FirebaseAuth.getInstance().addAuthStateListener(auth -> {
                if (auth.getCurrentUser() == null) {

                    // Desuscribir del topic anterior (si existía)
                    String lastUid = FirebaseAuth.getInstance().getUid();
                    if (lastUid != null) {
                        FirebaseMessaging.getInstance().unsubscribeFromTopic(lastUid);
                    }

                    // Redirigir al Login
                    Intent intent = new Intent(MainActivity.this, Login.class);
                    intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP |
                            Intent.FLAG_ACTIVITY_NEW_TASK |
                            Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                }
            });

            // ---------------------------------------------------------------------------
            // LOGOUT MANUAL (botón)
            // ---------------------------------------------------------------------------
            findViewById(R.id.logoutButton).setOnClickListener(v -> {
                forzarLogout();
            });

            // ---------------------------------------------------------------------------
            // Permisos de notificación Android 13+
            // ---------------------------------------------------------------------------
            if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                            != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 2001);
            }

            Log.d(ETIQUETA_LOG, "onCreate(): empieza");

            // Inicializar Bluetooth y obtener el escáner
            inicializarBlueTooth();

            Log.d(ETIQUETA_LOG, "onCreate(): termina");

            // ---------------------------------------------------------------------------
            // Suscripción al Topic del UID del usuario
            // ---------------------------------------------------------------------------
            uidGlobal = (FirebaseAuth.getInstance().getCurrentUser() != null) ? FirebaseAuth.getInstance().getCurrentUser().getUid() : null;
            if (uidGlobal != null) {
                FirebaseMessaging.getInstance().subscribeToTopic(uidGlobal)
                        .addOnCompleteListener(task -> {
                            if (task.isSuccessful()) {
                                Log.d(">>>>>>", "✅ Suscrito al topic del usuario: " + uidGlobal);
                            } else {
                                Log.w(">>>>>>", "❌ Error al suscribirse al topic del usuario", task.getException());
                            }
                        });
            } else {
                Log.w(">>>>>>", "⚠️ No hay usuario logueado, NO se puede suscribir a topic.");
            }

            // ---------------------------------------------------------------------------
            // Botón para añadir nodo (QR o código manual)
            // ---------------------------------------------------------------------------
            Button botonAñadirNodo = findViewById(R.id.botonLeerQR);
            botonAñadirNodo.setOnClickListener(v -> {
                android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this);
                builder.setTitle("Añadir nodo")
                        .setItems(new CharSequence[]{"📷 Escanear QR del nodo", "⌨️ Introducir código del nodo"}, (dialog, which) -> {
                            if (which == 0) {
                                // Escanear QR
                                Intent intent = new Intent("com.google.zxing.client.android.SCAN");
                                intent.putExtra("SCAN_MODE", "QR_CODE_MODE");
                                try {
                                    startActivityForResult(intent, 1234);
                                } catch (Exception e) {
                                    Intent marketIntent = new Intent(Intent.ACTION_VIEW);
                                    marketIntent.setData(android.net.Uri.parse("https://play.google.com/store/apps/details?id=com.google.zxing.client.android"));
                                    startActivity(marketIntent);
                                }
                            } else {
                                // Introducir código manual
                                android.widget.EditText input = new android.widget.EditText(this);
                                new android.app.AlertDialog.Builder(this)
                                        .setTitle("Introduce el código del nodo")
                                        .setView(input)
                                        .setPositiveButton("Aceptar", (d, w) -> {
                                            codigoNodoQR = input.getText().toString().trim();
                                            if (!codigoNodoQR.isEmpty()) {
                                                solicitarNombreNodo();

                                            } else {
                                                Toast.makeText(this, "⚠️ Código vacío", Toast.LENGTH_SHORT).show();
                                            }
                                        })
                                        .setNegativeButton("Cancelar", null)
                                        .show();
                            }
                        })
                        .show();
            });

            distanciaManager = new DistanciaManager(this, findViewById(R.id.textoDistancia));
            logica = new LogicaFake(null, null, 0, null, null, null, null, null, 0, 0, null, null, 0, 0, 0, uidGlobal, null);

            // ---------------------------------------------------------------------------
            // Botón para resetear la distancia
            // ---------------------------------------------------------------------------
            Button botonResetear = findViewById(R.id.botonResetearDistancia);
            botonResetear.setText("Resetear");
            botonResetear.setOnClickListener(v -> {
                if (distanciaManager != null) {
                    distanciaManager.resetearDistancia();
                    logica.actualizarDistancia(uidGlobal, 0, new okhttp3.Callback() {
                        @Override
                        public void onFailure(okhttp3.Call call, java.io.IOException e) {
                            runOnUiThread(() -> Toast.makeText(MainActivity.this, "Error al resetear la distancia", Toast.LENGTH_SHORT).show());
                        }

                        @Override
                        public void onResponse(okhttp3.Call call, okhttp3.Response response) throws java.io.IOException {
                            if (response.isSuccessful()) {
                                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Distancia reseteada", Toast.LENGTH_SHORT).show());
                            } else {
                                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Error al resetear la distancia", Toast.LENGTH_SHORT).show());
                            }
                        }
                    });
                }
            });



        } // onCreate()

        @Override
        public boolean onCreateOptionsMenu(Menu menu) {
            MenuInflater inflater = getMenuInflater();
            inflater.inflate(R.menu.main_menu, menu);
            return true;
        }

        @Override
        public boolean onOptionsItemSelected(MenuItem item) {
            if (item.getItemId() == R.id.action_intranet) {
                Log.d(ETIQUETA_LOG, "Botón Intranet pulsado");
                abrirIntranet();
                return true;
            }
            return super.onOptionsItemSelected(item);
        }

        private void abrirIntranet() {
            if (uidGlobal == null) {
                Toast.makeText(this, "❌ No hay usuario logueado", Toast.LENGTH_SHORT).show();
                return;
            }

            obtenerLinkAutologin(uidGlobal, new Callback() {
                @Override
                public void onSuccess(String link) {
                    if (link == null) {
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "❌ Error obteniendo enlace", Toast.LENGTH_SHORT).show());
                        return;
                    }
                    runOnUiThread(() -> {
                        Intent intent = new Intent(MainActivity.this, WebNodoActivity.class);
                        intent.putExtra("url", link);
                        // Pasamos un nombre genérico ya que no está asociado a un nodo específico
                        intent.putExtra("nombreNodo", "Intranet");
                        startActivity(intent);
                    });
                }

                @Override
                public void onError(String error) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "❌ Error API: " + error, Toast.LENGTH_SHORT).show());
                }
            });
        }



        // --------------------------------------------------------------------------------
        // Método auxiliar para calcular distancia (Modelo de pérdida de trayectoria log-normal)
        // --------------------------------------------------------------------------------
        private double calculateDistance(int rssi, int txPower) {
            if (rssi == 0) {
                return -1.0; // Desconocido
            }
            
            // Formula: Distance = 10 ^ ((TxPower - RSSI) / (10 * n))
            // n = Path Loss Exponent (2.0 for free space, 2.5 - 4.0 for indoor)
            // Usaremos n = 2.0 para una aproximación general
            
            double exponent = (double) (txPower - rssi) / 20.0;
            return Math.pow(10, exponent);
        }

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
        // --------------------------------------------------------------------------------
        // BUSCAR DISPOSITIVO - VERSIÓN CORREGIDA
        // --------------------------------------------------------------------------------
        private void buscarEsteDispositivoBTLE(final String dispositivoBuscado) {
            Log.d(ETIQUETA_LOG, "buscarEsteDispositivoBTLE(): empieza");

            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN)
                    != PackageManager.PERMISSION_GRANTED) {
                return;
            }

            this.nodoObtenido = false;
            this.escaneoActivo = true;
            this.dispositivoBuscadoActual = dispositivoBuscado;

            // INICIAR WATCHDOG
            iniciarWatchdog();

            this.callbackDelEscaneo = new ScanCallback() {
                @Override
                public void onScanResult(int callbackType, ScanResult resultado) {
                    super.onScanResult(callbackType, resultado);

                    String nombreDetectado = (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.BLUETOOTH_CONNECT)
                            == PackageManager.PERMISSION_GRANTED)
                            ? resultado.getDevice().getName()
                            : null;

                    if (nombreDetectado == null || !nombreDetectado.equals(dispositivoBuscado)) {
                        return; // No es el dispositivo que buscamos
                    }

                    // ✅ DISPOSITIVO CORRECTO DETECTADO
                    ultimaDeteccionBeacon = System.currentTimeMillis();

                    // --- ACTUALIZACIÓN DE RADAR Y DISTANCIA ---
                    TramaIBeacon tib = new TramaIBeacon(resultado.getScanRecord().getBytes());
                    double distancia = calculateDistance(resultado.getRssi(), tib.getTxPower());
                    
                    runOnUiThread(() -> {
                        if (radarViewActual != null && textoRadarActual != null) {
                            radarViewActual.setVisibility(View.VISIBLE);
                            textoRadarActual.setVisibility(View.VISIBLE);
                            
                            String nombreMostrar = (nombreNodoUsuario != null) ? nombreNodoUsuario : "Nodo";

                            if (distancia < 1.0) {
                                radarViewActual.setZone(0); // Cerca
                                textoRadarActual.setText(nombreMostrar + " está Cerca (" + String.format("%.2f", distancia) + "m)");
                                textoRadarActual.setTextColor(Color.parseColor("#006400")); // Dark Green
                            } else if (distancia <= 3.0) {
                                radarViewActual.setZone(1); // Media
                                textoRadarActual.setText(nombreMostrar + " está a Media distancia (" + String.format("%.2f", distancia) + "m)");
                                textoRadarActual.setTextColor(Color.parseColor("#FF8C00")); // Dark Orange
                            } else {
                                radarViewActual.setZone(2); // Lejos
                                textoRadarActual.setText(nombreMostrar + " está Lejos (" + String.format("%.2f", distancia) + "m)");
                                textoRadarActual.setTextColor(Color.RED);
                            }
                        }
                    });

                    // Si es la primera detección o estaba desconectado, actualizar estado
                    if (!beaconConectado) {
                        beaconConectado = true;
                        String nodeName = (nombreNodoUsuario != null) ? nombreNodoUsuario : codigoNodoQR;
                        Log.d(ETIQUETA_LOG, "✅ Beacon conectado: " + nodeName);

                        // Opcional: Mostrar toast de reconexión
                        runOnUiThread(() ->
                                Toast.makeText(MainActivity.this, "✅ " + nodeName + " conectado",
                                        Toast.LENGTH_SHORT).show()
                        );
                    }

                    String nodoQR = (nombreNodoUsuario != null) ? nombreNodoUsuario :
                            (codigoNodoQR != null ? codigoNodoQR : "Desconocido");

                    // Convertimos a LogicaFake
                    LogicaFake beacon = convertirScanResult(resultado);

                    // La primera vez, nos aseguramos que el nodo existe en el backend
                    if (!nodoObtenido) {
                        beacon.obtenerNodo(nodoQR);
                        nodoObtenido = true;
                    }

                    // Guardamos la medida recibida
                    beacon.guardarMedida();
                }

                @Override
                public void onScanFailed(int errorCode) {
                    super.onScanFailed(errorCode);
                    Log.e(ETIQUETA_LOG, "Error en escaneo: " + errorCode);

                    // Opcional: Reiniciar escaneo en caso de error
                    new Handler().postDelayed(() -> {
                        if (escaneoActivo) {
                            Log.d(ETIQUETA_LOG, "Reintentando escaneo después de error...");
                            detenerBusquedaDispositivosBTLE();
                            buscarEsteDispositivoBTLE(dispositivoBuscadoActual);
                        }
                    }, 2000);
                }
            };

            ScanFilter filtro = new ScanFilter.Builder()
                    .setDeviceName(dispositivoBuscado)
                    .build();

            ScanSettings settings = new ScanSettings.Builder()
                    .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                    .build();

            try {
                elEscanner.startScan(Arrays.asList(filtro), settings, callbackDelEscaneo);
                Log.d(ETIQUETA_LOG, "Escaneando específicamente: " + dispositivoBuscado);
            } catch (Exception e) {
                Log.e(ETIQUETA_LOG, "Error iniciando escaneo filtrado: " + e.getMessage());
                // Fallback a escaneo general
                elEscanner.startScan(callbackDelEscaneo);
                Log.d(ETIQUETA_LOG, "Escaneo general activado");
            }
        }

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

            // Detener el watchdog para que no salte la notificación si paramos manualmente
            watchdogHandler.removeCallbacks(watchdogRunnable);

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
        @Override

        public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
            super.onRequestPermissionsResult(requestCode, permissions, grantResults);

            if (requestCode == CODIGO_PETICION_PERMISOS) {
                boolean permisosOk = true;

                for (int r : grantResults) {
                    if (r != PackageManager.PERMISSION_GRANTED) {
                        permisosOk = false;
                        break;
                    }
                }

                if (permisosOk) {
                    Log.d(">>>>>>", "Permisos concedidos, verificando estado de Bluetooth y GPS…");
                    verificarYActivarBluetoothYGps();
                } else {
                    Log.e(">>>>>>", "Permisos NO concedidos. No se puede usar GPS.");
                }
            }
        }

        private void verificarYActivarBluetoothYGps() {
            // Verificar Bluetooth
            BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
            boolean bluetoothActivado = bluetoothAdapter != null && bluetoothAdapter.isEnabled();

            // Verificar GPS
            LocationManager locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
            boolean gpsActivado = locationManager != null &&
                    locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);

            if (bluetoothActivado && gpsActivado) {
                // Ambos están activados, iniciar tracking
                Log.d(">>>>>>", "Bluetooth y GPS activados, iniciando tracking GPS…");
                if (uidGlobal != null) {
                    // Usar un nombre de nodo por defecto para el tracking de distancia del móvil
                    String nombreNodoMovil = "movil_" + uidGlobal.substring(0, 8); // Ejemplo: "movil_abc12345"
                    distanciaManager.iniciar(uidGlobal, nombreNodoMovil);
                }
            } else {
                // Mostrar diálogo para activar lo que falte
                mostrarDialogoActivacion(bluetoothActivado, gpsActivado);
            }
        }
        private void mostrarDialogoActivacion(boolean bluetoothOk, boolean gpsOk) {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Activar servicios necesarios");

            StringBuilder mensaje = new StringBuilder("Para usar la aplicación necesitas activar:\n\n");

            if (!bluetoothOk) {
                mensaje.append("• Bluetooth\n");
            }
            if (!gpsOk) {
                mensaje.append("• GPS/Localización\n");
            }

            mensaje.append("\n¿Quieres activarlos ahora?");

            builder.setMessage(mensaje.toString());

            builder.setPositiveButton("Activar", (dialog, which) -> {
                if (!bluetoothOk) {
                    activarBluetooth();
                }
                if (!gpsOk) {
                    activarGPS();
                }

                // Verificar nuevamente después de un breve delay
                new Handler().postDelayed(() -> {
                    verificarYActivarBluetoothYGps();
                }, 2000);
            });

            builder.setNegativeButton("Cancelar", (dialog, which) -> {
                Toast.makeText(this, "Los servicios necesarios no están activos", Toast.LENGTH_LONG).show();
            });

            builder.setCancelable(false);
            builder.show();
        }

        private void activarBluetooth() {
            try {
                BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
                if (bluetoothAdapter != null && !bluetoothAdapter.isEnabled()) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED) {
                        bluetoothAdapter.enable();
                        Toast.makeText(this, "Activando Bluetooth...", Toast.LENGTH_SHORT).show();
                    } else {
                        // Solicitar permiso BLUETOOTH_CONNECT si no lo tenemos
                        ActivityCompat.requestPermissions(this,
                                new String[]{Manifest.permission.BLUETOOTH_CONNECT},
                                CODIGO_PETICION_PERMISOS);
                    }
                }
            } catch (SecurityException e) {
                Log.e(">>>>>>", "Error de seguridad al activar Bluetooth: " + e.getMessage());
            }
        }

        private void activarGPS() {
            try {
                LocationManager locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
                if (locationManager != null && !locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                    startActivity(intent);
                    Toast.makeText(this, "Por favor, activa el GPS en ajustes", Toast.LENGTH_LONG).show();
                }
            } catch (Exception e) {
                Log.e(">>>>>>", "Error al activar GPS: " + e.getMessage());
            }
        }



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

            String uid = FirebaseAuth.getInstance().getCurrentUser() != null
                    ? FirebaseAuth.getInstance().getCurrentUser().getUid()
                    : null;

            // ✅ Nombre del nodo:
            //    Si se leyó un QR → usarlo
            //    Si no → usar nombre BLE
            //String nombreNodoUsado = "Josue";
            String nodoQR = (nombreNodoUsuario != null) ? nombreNodoUsuario :
                    (codigoNodoQR != null ? codigoNodoQR : "Desconocido");


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
                    tib.getTxPower(),
                    uid,                // ✅ propietarioId
                    nodoQR     // ✅ nombre del nodo
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
                Log.w(">>>>>>", "Sin permiso POST_NOTIFICATIONS en Android 13+");
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


        @Override
        protected void onActivityResult(int requestCode, int resultCode, Intent data) {
            super.onActivityResult(requestCode, resultCode, data);

            if (requestCode == 1234 && resultCode == RESULT_OK) {
                codigoNodoQR = data.getStringExtra("SCAN_RESULT");
                Log.d(ETIQUETA_LOG, "📌 QR leído = " + codigoNodoQR);
                solicitarNombreNodo();
            }
        }




        public void botonBuscarDispositivoQR(View v) {
            if (codigoNodoQR == null) {
                Toast.makeText(this, "⚠ Primero debes escanear un QR", Toast.LENGTH_SHORT).show();
                return;
            }

            Log.d(ETIQUETA_LOG, "🔍 Buscando dispositivo leído del QR: " + codigoNodoQR);
            this.buscarEsteDispositivoBTLE(codigoNodoQR);

            String uid = FirebaseAuth.getInstance().getCurrentUser() != null
                    ? FirebaseAuth.getInstance().getCurrentUser().getUid()
                    : null;

            if (uid == null) {
                Toast.makeText(this, "❌ No hay usuario logueado", Toast.LENGTH_SHORT).show();
                return;
            }

            /*
            // 🧩 Obtener link autologin desde el servidor
            obtenerLinkAutologin(uid, new Callback() {
                @Override
                public void onSuccess(String link) {
                    if (link == null) {
                        runOnUiThread(() -> Toast.makeText(MainActivity.this, "❌ Error obteniendo enlace", Toast.LENGTH_SHORT).show());
                        return;
                    }

                    // Abrir WebNodoActivity con el enlace autologin
                    runOnUiThread(() -> {
                        Intent intent = new Intent(MainActivity.this, WebNodoActivity.class);
                        intent.putExtra("url", link);
                        intent.putExtra("nombreNodo", nombreNodoUsuario);
                        startActivity(intent);
                    });
                }

                @Override
                public void onError(String error) {
                    runOnUiThread(() -> Toast.makeText(MainActivity.this, "❌ Error API: " + error, Toast.LENGTH_SHORT).show());
                }
            });
            */
        }




        private void solicitarNombreNodo() {
            nombreNodoUsuario = "nodo1";
            Log.d(ETIQUETA_LOG, "📟 Nodo detectado: " + codigoNodoQR);
            Log.d(ETIQUETA_LOG, "📛 Nombre automático: " + nombreNodoUsuario);

            // Obtener el contenedor principal donde añadir elementos
            LinearLayout parentLayout = (LinearLayout) findViewById(android.R.id.content)
                    .getRootView()
                    .findViewById(R.id.botonLeerQR)
                    .getParent();

            // Crear un contenedor vertical para el Botón + Radar + Texto
            LinearLayout nodeContainer = new LinearLayout(this);
            nodeContainer.setOrientation(LinearLayout.VERTICAL);
            nodeContainer.setGravity(Gravity.CENTER);
            nodeContainer.setPadding(0, 20, 0, 20);
            
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT, 
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            params.setMargins(0, 20, 0, 20);
            nodeContainer.setLayoutParams(params);

            // 1. Crear Botón de búsqueda
            Button botonBuscar = new Button(this);
            botonBuscar.setText("Buscar " + nombreNodoUsuario);
            botonBuscar.setOnClickListener(this::botonBuscarDispositivoQR);
            nodeContainer.addView(botonBuscar);

            // 2. Crear RadarView
            radarViewActual = new RadarView(this);
            LinearLayout.LayoutParams radarParams = new LinearLayout.LayoutParams(400, 400); // 400x400 px
            radarParams.setMargins(0, 20, 0, 10);
            radarViewActual.setLayoutParams(radarParams);
            radarViewActual.setVisibility(View.GONE); // Oculto hasta que se empiece a buscar
            nodeContainer.addView(radarViewActual);

            // 3. Crear TextView para estado
            textoRadarActual = new TextView(this);
            textoRadarActual.setText("Esperando señal...");
            textoRadarActual.setGravity(Gravity.CENTER);
            textoRadarActual.setTypeface(null, Typeface.BOLD);
            textoRadarActual.setTextSize(16);
            textoRadarActual.setVisibility(View.GONE); // Oculto hasta que se empiece a buscar
            nodeContainer.addView(textoRadarActual);

            // Añadir el contenedor al layout principal
            parentLayout.addView(nodeContainer);

            Toast.makeText(this, "✅ Nodo añadido: " + nombreNodoUsuario, Toast.LENGTH_SHORT).show();
        }


        private void obtenerLinkAutologin(String uid, Callback callback) {
            String url = "https://us-central1-proyectodebiometria.cloudfunctions.net/ServidorREST/autologin/" + uid;

            new Thread(() -> {
                try {
                    java.net.URL apiUrl = new java.net.URL(url);
                    java.net.HttpURLConnection conn = (java.net.HttpURLConnection) apiUrl.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("Content-Type", "application/json");

                    int responseCode = conn.getResponseCode();

                    if (responseCode == 200) {
                        java.io.BufferedReader in = new java.io.BufferedReader(
                                new java.io.InputStreamReader(conn.getInputStream())
                        );
                        StringBuilder response = new StringBuilder();
                        String line;
                        while ((line = in.readLine()) != null) response.append(line);
                        in.close();

                        // Convertir JSON
                        org.json.JSONObject obj = new org.json.JSONObject(response.toString());
                        String link = obj.optString("link", null);

                        callback.onSuccess(link);
                    } else {
                        callback.onError("HTTP " + responseCode);
                    }
                } catch (Exception e) {
                    callback.onError(e.getMessage());
                }
            }).start();
        }

        @Override
        protected void onResume() {
            super.onResume();

            // Verificar si debemos reiniciar el tracking
            if (uidGlobal != null && !distanciaManager.isTracking()) {
                Log.d(">>>>>>", "🔄 Revisando estado de tracking en onResume...");
                verificarYActivarBluetoothYGps();
            }

            FirebaseAuth auth = FirebaseAuth.getInstance();
            if (auth.getCurrentUser() != null) {
                auth.getCurrentUser().getIdToken(true)
                        .addOnCompleteListener(task -> {
                            if (!task.isSuccessful()) {
                                // ❌ El token ya no es válido → sesión revocada
                                forzarLogout();
                            }
                        });
            }
        }

        private void forzarLogout() {
            if (distanciaManager != null) {
                distanciaManager.detener();
            }

            String uid = FirebaseAuth.getInstance().getUid();
            if (uid != null) {
                FirebaseMessaging.getInstance().unsubscribeFromTopic(uid);
            }
            FirebaseAuth.getInstance().signOut();
            goToLogin();
        }

        private void goToLogin() {
            Intent intent = new Intent(MainActivity.this, Login.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        }

        private void goToVerifyEmail() {
            Intent intent = new Intent(MainActivity.this, VerifyEmailActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP |
                    Intent.FLAG_ACTIVITY_NEW_TASK |
                    Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        }

        // --------------------------------------------------------------------------------
        private void iniciarWatchdog() {
            // NO inicializar ultimaDeteccionBeacon aquí
            // Debe ser actualizado SOLO cuando realmente se detecte el beacon

            beaconConectado = false; // Empezamos asumiendo que NO está conectado
            ultimaNotificacion = 0;

            // Limpiar cualquier watchdog previo
            watchdogHandler.removeCallbacks(watchdogRunnable);
            // Iniciar watchdog
            watchdogHandler.post(watchdogRunnable);

            Log.d(ETIQUETA_LOG, "🔍 Watchdog iniciado - Esperando primera detección...");
        }

        interface Callback {
            void onSuccess(String link);
            void onError(String error);
        }

        @Override
        protected void onDestroy() {
            super.onDestroy();
            //detenerBusquedaDispositivosBTLE();
        }




    } // class
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------
    // --------------------------------------------------------------
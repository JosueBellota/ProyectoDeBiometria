# Proyecto de Monitoreo Ambiental IoT (Biometría)

## Descripción General

Sistema integral de monitoreo ambiental diseñado para la recolección, visualización y gestión de datos de calidad del aire en tiempo real. El proyecto integra sensores IoT (Arduino), una aplicación móvil (Android) para la recolección de datos mediante Bluetooth LE (iBeacon), y una plataforma web completa (React + Firebase) para ciudadanos y administradores.

El sistema permite visualizar mapas de calor de contaminantes (CO, NO2, O3), gestionar incidencias y administrar usuarios y nodos sensores.

## Estructura del Proyecto

*   `src/AndroidBiometria`: Aplicación nativa Android para escanear balizas y subir datos.
*   `src/HolaMundoIBeacon`: Código Arduino para los nodos sensores.
*   `src/WEB/my-app`: Aplicación web React (Dashboard Ciudadano y Admin).
*   `src/FirebaseFunctions`: Backend en Cloud Functions (API REST y lógica de negocio).
*   `doc/`: Documentación y diseños del sistema.

## Características Principales

### Plataforma Web (React)
*   **Mapa Interactivo de Calidad del Aire**: Visualización de contaminantes mediante interpolación (IDW) y puntos de lectura.
    *   *Smart Fallback*: Si no hay datos del día actual, muestra automáticamente el último día con actividad registrada.
    *   Filtros avanzados por fecha, tipo de sensor y radio de búsqueda.
*   **Gestión de Usuarios**:
    *   Roles diferenciados: Ciudadano y Administrador.
    *   Registro, Login y recuperación de contraseña.
    *   Perfil de usuario con gamificación (monedas por actividad).
*   **Sistema de Incidencias**:
    *   Ciudadanos pueden reportar problemas ambientales.
    *   Administradores pueden gestionar, asignar y resolver incidencias.
*   **Administración**:
    *   Gestión completa de usuarios y nodos.
    *   Visualización global de lecturas e historial.
    *   Herramientas de simulación de datos (generación de nodos y lecturas de prueba).

### Aplicación Móvil (Android)
*   Escaneo de dispositivos iBeacon en segundo plano.
*   Visualización de datos en tiempo real de los sensores cercanos.
*   Subida automática de mediciones a la nube.

### Backend (Firebase)
*   **API RESTful**: Endpoints para gestión de usuarios, nodos, lecturas e incidencias.
*   **Seguridad**: Autenticación mediante Firebase Auth y validación de roles.
*   **Firestore**: Base de datos NoSQL para almacenamiento escalable.

## Despliegue y Ejecución

### Web
1.  Navegar a `src/WEB/my-app`.
2.  Instalar dependencias: `npm install`
3.  Iniciar servidor de desarrollo: `npm start`

### Backend (Cloud Functions)
1.  Navegar a `src/FirebaseFunctions/functions`.
2.  Instalar dependencias: `npm install`
3.  Desplegar: `firebase deploy --only functions`

### Android
1.  Abrir el proyecto `src/AndroidBiometria` en Android Studio.
2.  Sincronizar Gradle y ejecutar en dispositivo físico o emulador.

### Arduino
1.  Abrir `src/HolaMundoIBeacon` en Arduino IDE.
2.  Cargar en placa compatible (ej. ESP32).

## Endpoints Principales (API)

*   `GET /lecturas`: Obtiene lecturas con filtros (lat, lon, fecha, radio).
*   `GET /usuarios/completo/{uid}`: Perfil detallado de usuario.
*   `POST /incidencias`: Reportar nueva incidencia.
*   `GET /incidencias`: Listar incidencias (filtros por estado/usuario).
*   `PUT /incidencias/resolver`: Resolver una incidencia (Admin).

## Tecnologías

*   **Frontend**: React, Leaflet, Material UI, Bootstrap.
*   **Backend**: Node.js, Express, Firebase Cloud Functions.
*   **Base de Datos**: Firestore.
*   **Móvil**: Java (Android SDK).
*   **IoT**: C++ (Arduino), Bluetooth LE.
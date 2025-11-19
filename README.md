# Proyecto de Biometría y Medio Ambiente

## Diseños

Ubicación: `doc/`

**Descripción:**

Los diseños del proyecto describen la arquitectura general del sistema formado por los distintos módulos (Arduino, Android, Web y Firebase), y los flujos de datos entre los sensores y la base de datos. Estos diagramas están disponibles en tres formatos para facilitar su consulta y edición:
* SVG — formato vectorial ideal para visualización web.
* PDF — versión lista para impresión o revisión offline.
* DRAWIO — editable con la herramienta diagrams.net para modificaciones o ampliaciones.

## Prueba Automática

Ubicación: `test/`

**Cómo ejecutarlo / despliegue:**

1. Ejecutar en modo desarrollo (⚠️ no refrescar la página web, ya que cada recarga repetirá la prueba automática):

   ```bash
   npm start
   ```

**Descripción:**
La prueba automática valida las funciones de **Firebase Functions** y la lógica de negocio:

*   **Usuarios**:
    *   Crea usuarios con roles `ciudadano` y `admin`.
    *   Obtiene los datos de un usuario.
    *   Obtiene la lista completa de usuarios (solo para `admin`).
    *   Actualiza los datos de un usuario.
    *   Elimina un usuario.
*   **Autenticación**:
    *   Genera un token de autologin.
    *   Revoca la sesión de un usuario (logout forzado).
*   **Nodos y Mediciones**:
    *   Crea nodos para un usuario.
    *   Guarda mediciones de sensores en un nodo.
    *   Dispara una notificación si el CO2 es elevado.
    *   Obtiene las mediciones de un nodo.
    *   Obtiene todos los nodos de un usuario.
    *   Actualiza los datos de un nodo.
    *   Elimina un nodo.
*   **Notificaciones**:
    *   Envía notificaciones a un usuario específico o a un topic general.

## Programas

Ubicación: `src/`

### Arduino app

Ruta: `src/HolaMundoIBeacon`
**Cómo ejecutarlo / despliegue:**

1. Abrir el proyecto en el IDE de Arduino.
2. Conectar la placa y cargar el programa.

### Android app

Ruta: `src/AndroidBiometria`
**Cómo ejecutarlo / despliegue:**

1. Abrir en Android Studio.
2. Compilar y desplegar en un dispositivo o emulador.

### Web

Ruta: `src/WEB/my-app/`
**Cómo ejecutarlo / despliegue:**

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Ejecutar en modo desarrollo:

   ```bash
   npm start
   ```

### API / Modelo de Negocio

Ruta: `src/FirebaseFunctions/functions/`
**Cómo ejecutarlo / despliegue:**
*(estas funciones solo están en local para edición, pruebas y luego despliegue a Firebase Functions Cloud)*

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Desplegar en Firebase:

   ```bash
   firebase deploy --only functions
   ```

**Descripción de Endpoints:**

*   `GET /usuarios/completo/{uid}`: Obtiene los datos completos de un usuario.
*   `GET /usuarios/{idUsuario}`: Obtiene los datos de un usuario.
*   `GET /usuarios/admin/{idAdmin}`: Obtiene la lista de todos los usuarios (requiere rol de `admin`).
*   `POST /usuarios`: Crea un nuevo usuario.
*   `PUT /usuarios/{idUsuario}`: Actualiza los datos de un usuario.
*   `DELETE /usuarios/{idUsuario}`: Elimina un usuario.
*   `GET /nodos/propietario/{idPropietario}`: Obtiene todos los nodos de un usuario.
*   `POST /nodos`: Crea un nuevo nodo.
*   `PUT /nodos`: Actualiza un nodo existente.
*   `DELETE /nodos`: Elimina un nodo.
*   `GET /mediciones/{propietarioId}/{nombreNodo}`: Obtiene las mediciones de un nodo.
*   `POST /mediciones`: Guarda nuevas mediciones para un nodo.
*   `GET /autologin/{uid}`: Genera un enlace de autologin.
*   `GET /logout/{uid}`: Revoca la sesión de un usuario.
*   `POST /notificar`: Envía una notificación.

## Firebase

### Firestore

Firestore almacena la información en dos colecciones principales: `usuarios` y `nodos`.

**Colección `usuarios`:**

```json
{
  "uid": "...",
  "nombre": "Nombre del Usuario",
  "correo": "usuario@email.com",
  "rol": "ciudadano" | "admin",
  "monedas": 150,
  "premios": ["premio_bronce"],
  "distancia": 8.5,
  "creadoEn": "timestamp"
}
```

**Colección `nodos`:**

```json
{
  "propietarioId": "uid_del_usuario",
  "nombre": "Nombre del Nodo",
  "ubicacion": "Ubicación del Nodo",
  "sensores": {
    "co2": 450,
    "temperatura": 22.5,
    "humedad": 55
  },
  "tiempo": "timestamp"
}
```

# Proyecto de Biometría y Medio Ambiente: Sprint 0

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
La prueba automática valida las funciones de **Firebase Functions**:

* Envía una medida de sensor con un **POST** a la función `guardarMedida`.
* Recupera las medidas almacenadas con un **GET** a la función `recibirMedida`.
* Muestra los resultados en pantalla indicando si el test fue exitoso (✅) o si ocurrió algún error (❌).

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

Ruta: `src/FirebaseFunctions/functions/src`
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

**Descripción:**

* guardarMedida (POST)

Recibe un JSON con los datos { sensor: string, valor: number }.
Valida los campos de entrada.
Llama a guardarMedidaInterno, que almacena la información en la colección medidas de Firestore junto con una marca de tiempo generada por el servidor.
Devuelve una respuesta JSON con el resultado del proceso:
{ "exito": true, "mensaje": "Guardado correctamente en Firestore" }


* recibirMedida (GET)

No requiere parámetros de entrada.
Llama a recibirMedidaInterno, que recupera la última medida registrada en la colección medidas.
Devuelve un JSON con los campos { sensor, valor, tiempo }.
En caso de no existir registros, devuelve un error informativo.


La arquitectura separa claramente la lógica de negocio (en LogicaDelNegocio/) del código HTTP de interfaz, mejorando la mantenibilidad, escalabilidad y reutilización del código en otros módulos.

## Firebase

### Firestore

Firestore almacena la información en **colecciones** y **documentos**.
Ejemplo de colección: `mediciones`

Un documento dentro de esta colección tendría la siguiente estructura:

```json
{
  "Document ID": "rJzftLL0jh2B1siitvQT",
  "nombre": "CO2",
  "timestamp": "October 3, 2025 at 4:41:22 PM UTC+2",
  "valor": 123455
}
```

📌 Equivalente en **SQL** (tabla `mediciones`):

```sql
CREATE TABLE mediciones (
    document_id VARCHAR(255) PRIMARY KEY,
    nombre VARCHAR(50),
    timestamp TIMESTAMP,
    valor INT
);

INSERT INTO mediciones (document_id, nombre, timestamp, valor)
VALUES 
('rJzftLL0jh2B1siitvQT', 'CO2', '2025-10-03 16:41:22+02', 123455),
('xB90Ld9hOtkX4Sx4V4mC', 'CO2', '2025-10-03 16:44:48+02', 1234),
('ylD8IWoJWjaMxH7xgOHu', 'CO2', '2025-10-03 16:43:21+02', 1234567),
('zXNT0iuaAPZZZhJUv5tK', 'CO2', '2025-10-03 12:54:28+02', -26037);
```

De esta forma:

* En **Firestore**, cada fila es un **documento JSON** en una colección.
* En **SQL**, cada documento se traduce en una **fila de tabla** con columnas bien definidas.

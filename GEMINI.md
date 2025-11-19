# Project Overview

This is a full-stack IoT project for environmental monitoring. The system consists of Arduino-based sensor nodes, a Firebase backend, a React web application, and an Android application.

## System Architecture

*   **Sensor Nodes (Arduino):** These devices are based on the `HolaMundoIBeacon` project. They read sensor data (CO2, temperature, humidity) and broadcast it using the iBeacon protocol over Bluetooth LE.
*   **Backend (Firebase Functions):** The backend is built with Firebase Functions and provides a RESTful API for managing users, sensor nodes, and measurements. The core logic is in `src/FirebaseFunctions/functions/src/`.
    *   `servidorREST/ServidorRest.js`: Defines the API endpoints.
    *   `LogicaDeNegocio/LogicaDeNegocio.js`: Implements the business logic and interacts with Firestore.
*   **Web Application (React):** A web interface for users and administrators, located in `src/WEB/my-app/`. It allows users to view sensor data and manage their profiles. Administrators can manage users.
*   **Android Application:** The Android app in `src/AndroidBiometria/` scans for iBeacons, collects sensor data, and sends it to the Firebase backend. It also allows users to associate sensor nodes with QR codes.

## Building and Running

### Backend (Firebase Functions)

To deploy the backend functions:

1.  Navigate to `src/FirebaseFunctions/functions/`.
2.  Install dependencies: `npm install`
3.  Deploy to Firebase: `firebase deploy --only functions`

### Web Application

To run the web application in development mode:

1.  Navigate to `src/WEB/my-app/`.
2.  Install dependencies: `npm install`
3.  Start the development server: `npm start`

### Android Application

To run the Android application:

1.  Open the project in `src/AndroidBiometria/` with Android Studio.
2.  Build and run the app on an emulator or a physical device.

### Arduino Sensor Node

To deploy the code to a sensor node:

1.  Open the project in `src/HolaMundoIBeacon/` with the Arduino IDE.
2.  Connect the Arduino board and upload the sketch.

### Automated Tests

The project includes automated tests for the Firebase Functions. To run them:

1.  Navigate to the `test/` directory.
2.  Install dependencies: `npm install`
3.  Run the tests: `npm start`

## Development Conventions

*   The backend code is structured to separate the API layer (`ServidorRest.js`) from the business logic (`LogicaDeNegocio.js`).
*   The web and Android applications use Firebase Authentication for user management.
*   The Android app uses a `LogicaFake` class to abstract the backend communication, which is a good practice for testing and maintainability.
*   The project uses a consistent coding style, with comments in Spanish.

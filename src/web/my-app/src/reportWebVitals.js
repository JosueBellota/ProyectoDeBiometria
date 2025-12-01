// --------------------------------------------------------------------------
// Fichero: reportWebVitals.js
// Responsable: Josue Bellota Ichaso
//
// Descripción:
// Este fichero contiene la configuración para reportar las métricas de
// rendimiento de la aplicación.
// --------------------------------------------------------------------------

const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

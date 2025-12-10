import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

const InterpolationLayer = ({ lecturas, colorScale: propColorScale, isAirQualityView }) => {
  const map = useMap();

  const getAirQualityText = (value) => {
    if (value === 1) return "Calidad de Aire: Buena";
    if (value === 2) return "Calidad de Aire: Aceptable";
    if (value === 3) return "Calidad de Aire: Mala";
    return `Nivel de severidad: ${value}`;
  };

  useEffect(() => {
    if (!map || lecturas.length < 1) return;

    // 1. Crear la colección de puntos
    const points = turf.featureCollection(
      lecturas.map(l => turf.point([l.longitud, l.latitud], { value: l.valor }))
    );

    // 2. Calcular centro y radio máximo basado en la distribución de los puntos
    const center = turf.center(points);
    let maxDistance = 0;
    
    turf.featureEach(points, (pt) => {
        const d = turf.distance(center, pt);
        if (d > maxDistance) maxDistance = d;
    });

    // Definir el radio de la máscara (círculo)
    // Añadimos un margen (e.g., 15%) para asegurar que envuelve bien todos los puntos
    // Establecemos un mínimo razonable por si todos los puntos están en la misma coordenada
    const maskRadius = Math.max(maxDistance * 1.15, 0.5); 
    
    // 3. Crear el círculo de recorte (Mask)
    // 'steps' alto para que parezca un círculo perfecto
    const mask = turf.circle(center, maskRadius, { steps: 128, units: 'kilometers' });

    // 4. IMPORTANTE: Calcular el Bounding Box del CÍRCULO, no solo de los puntos.
    // Esto asegura que el diagrama de Voronoi se calcule en un área lo suficientemente 
    // grande para cubrir todo el círculo. Si usáramos el bbox de los puntos, 
    // el Voronoi se cortaría rectangularmente antes de llegar al borde del círculo.
    const maskBbox = turf.bbox(mask);

    // 5. Generar Voronoi usando el bbox expandido
    const voronoiPolygons = turf.voronoi(points, { bbox: maskBbox });

    // 6. Escala de color
    const colorScale = propColorScale || ((value) => {
        if (value <= 30) return "green";
        if (value <= 60) return "yellow";
        return "red";
    });

    // 7. Generar capas intersectando Voronoi con la Máscara Circular
    const gridLayers = voronoiPolygons.features.map(polygon => {
      if (!polygon || !polygon.properties) return null;
      
      let clipped = null;
      try {
          // Intersectar el polígono de Voronoi con el círculo perfecto
          clipped = turf.intersect(turf.featureCollection([polygon, mask]));
      } catch (e) {
          console.error("Error interpolating:", e);
          return null;
      }

      if (!clipped) return null;

      const value = polygon.properties.value;
      const color = colorScale(value);

      // Convertir coordenadas: Turf [lng, lat] -> Leaflet [lat, lng]
      const getLatLngs = (coords) => {
          // Si es un array de números [lng, lat], lo invertimos
          if (Array.isArray(coords) && typeof coords[0] === 'number') {
              return [coords[1], coords[0]];
          }
          // Si es un array de arrays, recursión
          if (Array.isArray(coords)) {
              return coords.map(getLatLngs);
          }
          return null;
      };

      const geometryCoords = clipped.geometry.coordinates;
      const latLngs = getLatLngs(geometryCoords);

      const layer = L.polygon(latLngs, {
        weight: 0, // Sin bordes entre polígonos para suavidad visual
        fillColor: color,
        fillOpacity: 0.5,
      });

      const popupContent = isAirQualityView 
        ? getAirQualityText(Math.round(value))
        : `Valor: ${value.toFixed(2)}`;
      
      layer.bindPopup(popupContent);

      return layer;
    }).filter(Boolean);

    const layerGroup = L.layerGroup(gridLayers).addTo(map);

    return () => {
      map.removeLayer(layerGroup);
    };
  }, [map, lecturas, isAirQualityView, propColorScale]);

  return null;
};

export default InterpolationLayer;

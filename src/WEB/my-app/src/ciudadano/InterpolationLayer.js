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

    // 1. Crear la colección de puntos para Turf.js
    const points = turf.featureCollection(
      lecturas.map(l => turf.point([l.longitud, l.latitud], { value: l.valor }))
    );

    // 2. Calcular el Bounding Box a partir de los propios puntos
    const bbox = turf.bbox(points);

    // 3. Generar el diagrama de Voronoi
    // Cada polígono resultante contendrá las propiedades del punto original
    const voronoiPolygons = turf.voronoi(points, { bbox });

    // 4. Determinar la escala de color
    const colorScale = propColorScale || ((value) => {
        if (value <= 30) return "green";
        if (value <= 60) return "yellow";
        return "red";
    });

    // 5. Mapear los polígonos de Voronoi a capas de Leaflet
    const gridLayers = voronoiPolygons.features.map(polygon => {
      if (!polygon.properties) return null;
      
      const value = polygon.properties.value;
      const color = colorScale(value);

      // Turf.js devuelve las coordenadas en [longitud, latitud]
      // Leaflet espera [latitud, longitud]
      const latLngs = polygon.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

      const layer = L.polygon(latLngs, {
        weight: 0,
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
  }, [map, lecturas, isAirQualityView]);

  return null;
};

export default InterpolationLayer;

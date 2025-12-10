import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

const InterpolationLayer = ({ lecturas, colorScale: propColorScale, isAirQualityView }) => {
  const map = useMap();

  const getAirQualityText = (value) => {
    if (value === 1) return "Calidad de Aire: Recomendable";
    if (value === 2) return "Calidad de Aire: Máximo Permitido";
    if (value === 3) return "Calidad de Aire: Peligroso";
    return `Nivel de severidad: ${value}`;
  };

  useEffect(() => {
    if (!map || lecturas.length < 1) return;

    // 0. CONFIGURACIÓN VISUAL
    const PANE_NAME = 'interpolation-pixel-pane';
    if (!map.getPane(PANE_NAME)) {
        map.createPane(PANE_NAME);
        const pane = map.getPane(PANE_NAME);
        pane.style.opacity = '0.55'; 
        pane.style.zIndex = '350';
    }

    // 1. PREPARACIÓN DE DATOS
    const points = turf.featureCollection(
      lecturas.map(l => turf.point([l.longitud, l.latitud], { value: l.valor }))
    );

    // 2. GENERACIÓN DE GRILLA
    const bbox = turf.bbox(points);
    const expandedBbox = [
        bbox[0] - 0.01,
        bbox[1] - 0.01,
        bbox[2] + 0.01,
        bbox[3] + 0.01
    ];

    // OPTIMIZACIÓN: 0.025 km (25 metros)
    // Es el límite seguro para evitar lag en el navegador.
    const CELL_SIZE = 0.04; 
    
    const squareGrid = turf.squareGrid(expandedBbox, CELL_SIZE, { units: 'kilometers' });
    const MAX_RADIUS = 0.25;

    // 3. ESCALA DE COLOR
    const colorScale = propColorScale || ((value) => {
        if (value <= 30) return "green";
        if (value <= 60) return "yellow";
        return "red";
    });

    // 4. PROCESAMIENTO
    const gridLayers = squareGrid.features.map(square => {
        const center = turf.center(square);
        const nearest = turf.nearestPoint(center, points);
        const distance = turf.distance(center, nearest, { units: 'kilometers' });

        if (distance > MAX_RADIUS) return null;

        const value = nearest.properties.value;
        const color = colorScale(value);

        const latLngs = square.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

        const layer = L.polygon(latLngs, {
            pane: PANE_NAME,
            weight: 0,          // OPTIMIZACIÓN: Sin bordes (stroke: false) mejora rendimiento
            stroke: false,      // y suaviza visualmente la unión entre píxeles
            color: color, 
            fillColor: color,
            fillOpacity: 1,     
            interactive: true   
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

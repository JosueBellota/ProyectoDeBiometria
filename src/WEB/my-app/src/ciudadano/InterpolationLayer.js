import { useEffect } from 'react';
import { useMap } from 'react-leaflet'; // Removido useMapEvents, ya que no necesitamos forzar render por zoom si no escalamos.
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

    // 0. CONFIGURACIÓN VISUAL
    const PANE_NAME = 'interpolation-pixel-pane';
    if (!map.getPane(PANE_NAME)) {
        map.createPane(PANE_NAME);
        const pane = map.getPane(PANE_NAME);
        pane.style.opacity = '0.55'; 
        pane.style.zIndex = '350';
    }

    // 1. TAMAÑO FIJO DE CELDAS Y RADIO DE INFLUENCIA
    // Mantendremos estos valores constantes en kilómetros reales, sin escalado por zoom.
    const CELL_SIZE = 0.04; // 40 metros
    const MAX_RADIUS = 0.25; // 250 metros

    // 2. PREPARACIÓN DE DATOS
    const points = turf.featureCollection(
      lecturas.map(l => turf.point([l.longitud, l.latitud], { value: l.valor }))
    );

    // 3. GENERACIÓN DE GRILLA
    const bbox = turf.bbox(points);
    // Expandimos el bbox ligeramente para asegurar que cubrimos el radio de 0.25km de los puntos extremos
    const expansion = MAX_RADIUS * 1.5 * 0.009; // Aprox. conversión km a grados para el buffer del bbox
    const expandedBbox = [
        bbox[0] - expansion,
        bbox[1] - expansion,
        bbox[2] + expansion,
        bbox[3] + expansion
    ];
    
    const squareGrid = turf.squareGrid(expandedBbox, CELL_SIZE, { units: 'kilometers' });

    // 4. ESCALA DE COLOR
    const colorScale = propColorScale || ((value) => {
        if (value <= 30) return "green";
        if (value <= 60) return "yellow";
        return "red";
    });

    // 5. PROCESAMIENTO
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
            weight: 0,          
            stroke: false,      
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
  }, [map, lecturas, isAirQualityView, propColorScale]); // Dependencia 'map.getZoom()' eliminada

  return null;
};

export default InterpolationLayer;
import { useEffect } from 'react';
import { useMap } from 'react-leaflet'; 
import L from 'leaflet';
import * as turf from '@turf/turf';

// Función auxiliar para interpolar entre dos colores
const lerpColor = (color1, color2, factor) => {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const InterpolationLayer = ({ lecturas, colorScale: propColorScale, isAirQualityView, sensorName, unit, limits }) => {
  const map = useMap();

  const getAirQualityText = (value) => {
    // Redondeamos para el texto, pero el color será suave
    const rounded = Math.round(value);
    if (rounded === 1) return "Calidad de Aire: Buena";
    if (rounded === 2) return "Calidad de Aire: Aceptable";
    if (rounded >= 3) return "Calidad de Aire: Mala";
    return `Nivel de severidad: ${value.toFixed(1)}`;
  };

  const getGradientColor = (value) => {
      // Definir colores base
      const GREEN = "#00FF00";
      const YELLOW = "#FFFF00";
      const RED = "#FF0000";

      if (!limits) {
          // Fallback si no hay límites definidos (usar escala antigua discreta si es posible, o por defecto)
          if (propColorScale) {
             const c = propColorScale(value);
             // Convertir nombres de color a hex para consistencia si es necesario, 
             // pero propColorScale devuelve 'green', 'yellow', 'red'.
             if (c === 'green') return GREEN;
             if (c === 'yellow') return YELLOW;
             if (c === 'red') return RED;
             return c;
          }
          return "gray";
      }

      const { low, med, high } = limits;

      // Normalizar y mezclar
      if (value <= low) return GREEN;
      if (value >= high) return RED;

      if (value < med) {
          // Interpolar entre Low (Verde) y Med (Amarillo)
          const factor = (value - low) / (med - low);
          return lerpColor(GREEN, YELLOW, factor);
      } else {
          // Interpolar entre Med (Amarillo) y High (Rojo)
          const factor = (value - med) / (high - med);
          return lerpColor(YELLOW, RED, factor);
      }
  };

  useEffect(() => {
    if (!map || lecturas.length < 1) return;

    const PANE_NAME = 'interpolation-pixel-pane';
    if (!map.getPane(PANE_NAME)) {
        map.createPane(PANE_NAME);
        const pane = map.getPane(PANE_NAME);
        pane.style.opacity = '0.65'; // Un poco más opaco para ver mejor el degradado
        pane.style.zIndex = '350';
    }

    const CELL_SIZE = 0.04; // 40 metros
    const MAX_RADIUS = 0.35; // Aumentado ligeramente para mejor solapamiento visual
    const POWER = 2; // Potencia para IDW (2 es estándar)

    // Preparar puntos para iteración rápida
    const pointsData = lecturas.map(l => ({
        lat: l.latitud,
        lng: l.longitud,
        value: l.valor,
        point: turf.point([l.longitud, l.latitud])
    }));

    const turfPoints = turf.featureCollection(pointsData.map(p => p.point));
    
    // Expandir Bbox
    const bbox = turf.bbox(turfPoints);
    const expansion = MAX_RADIUS * 1.5 * 0.009; 
    const expandedBbox = [
        bbox[0] - expansion,
        bbox[1] - expansion,
        bbox[2] + expansion,
        bbox[3] + expansion
    ];
    
    const squareGrid = turf.squareGrid(expandedBbox, CELL_SIZE, { units: 'kilometers' });

    const gridLayers = squareGrid.features.map(square => {
        const center = turf.center(square);
        const centerCoord = center.geometry.coordinates; // [lng, lat]

        // --- ALGORITMO IDW ---
        let numerator = 0;
        let denominator = 0;
        let minDist = Infinity;
        let nearestVal = null;

        // Encontrar puntos dentro del radio de influencia
        // Optimizacion: Usar turf.distance es costoso en bucle. 
        // Filtramos primero por bbox simple o iteramos todos si son pocos.
        // Dado que pueden ser pocos puntos (20-100), iterar todos está bien.
        
        for (const p of pointsData) {
            const d = turf.distance(center, p.point, { units: 'kilometers' });
            
            if (d < minDist) {
                minDist = d;
                nearestVal = p.value;
            }

            if (d <= MAX_RADIUS) {
                // Evitar división por cero si cae exacto encima
                const dist = Math.max(d, 0.001); 
                const weight = 1 / Math.pow(dist, POWER);
                numerator += p.value * weight;
                denominator += weight;
            }
        }

        // Si no hay puntos dentro del radio, ignorar celda (transparente)
        if (denominator === 0) return null;

        let interpolatedValue = numerator / denominator;
        
        // --- DECAIMIENTO ESPACIAL SUAVE HACIA 'NEUTRO' (MED) ---
        // Esto asegura que una lectura aislada roja o verde decaiga hacia amarillo (med) en los bordes
        if (limits) {
             const ratio = Math.min(minDist / MAX_RADIUS, 1);
             const target = limits.med;
             
             // Decaimiento lineal simple para gradiente suave continuo
             interpolatedValue = interpolatedValue * (1 - ratio) + target * ratio;
        }

        // Obtener color degradado
        const color = getGradientColor(interpolatedValue);

        const latLngs = square.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

        const layer = L.polygon(latLngs, {
            pane: PANE_NAME,
            weight: 0,          
            stroke: false,      
            color: color, 
            fillColor: color,
            fillOpacity: 0.8,     
            interactive: true   
        });

        const popupContent = isAirQualityView 
            ? getAirQualityText(interpolatedValue)
            : `${sensorName}: ${interpolatedValue.toFixed(2)} ${unit}`;
        
        layer.bindPopup(popupContent);

        return layer;
    }).filter(Boolean);

    const layerGroup = L.layerGroup(gridLayers).addTo(map);

    return () => {
      map.removeLayer(layerGroup);
    };
  }, [map, lecturas, isAirQualityView, propColorScale, sensorName, unit, limits]); 

  return null;
};

export default InterpolationLayer;
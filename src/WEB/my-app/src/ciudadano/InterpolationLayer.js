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

    // ---------------------------------------------------------
    // 0. CONFIGURACIÓN VISUAL "NUBE SUAVIZADA"
    // ---------------------------------------------------------
    // Creamos un Pane personalizado para manejar la opacidad globalmente.
    // Esto evita que las uniones entre polígonos se vean más oscuras (doble opacidad)
    // o blancas (huecos), creando un efecto de "nube" uniforme.
    const PANE_NAME = 'interpolation-cloud-pane';
    if (!map.getPane(PANE_NAME)) {
        map.createPane(PANE_NAME);
        const pane = map.getPane(PANE_NAME);
        pane.style.opacity = '0.65'; // Opacidad global de la nube
        pane.style.zIndex = '350';   // Debajo de los marcadores (suele ser 600)
    }

    // ---------------------------------------------------------
    // 1. PREPARACIÓN DE DATOS
    // ---------------------------------------------------------
    const points = turf.featureCollection(
      lecturas.map(l => turf.point([l.longitud, l.latitud], { 
          ...l, 
          originalLng: l.longitud, 
          originalLat: l.latitud 
      }))
    );

    // ---------------------------------------------------------
    // 2. VORONOI Y GEOMETRÍA
    // ---------------------------------------------------------
    const bbox = turf.bbox(points);
    const expandedBbox = [
        bbox[0] - 0.1,
        bbox[1] - 0.1,
        bbox[2] + 0.1,
        bbox[3] + 0.1
    ];

    const voronoiPolygons = turf.voronoi(points, { bbox: expandedBbox });

    // ---------------------------------------------------------
    // 3. ESCALA DE COLOR
    // ---------------------------------------------------------
    const colorScale = propColorScale || ((value) => {
        if (value <= 30) return "green";
        if (value <= 60) return "yellow";
        return "red";
    });

    // ---------------------------------------------------------
    // 4. GENERACIÓN DE CAPAS
    // ---------------------------------------------------------
    const gridLayers = voronoiPolygons.features.map(polygon => {
      if (!polygon || !polygon.properties) return null;
      
      const props = polygon.properties;
      if (props.originalLng === undefined || props.originalLat === undefined) return null;
      
      const center = [props.originalLng, props.originalLat];

      // Límite de 0.5km para cada punto
      const limitCircle = turf.circle(center, 0.5, { steps: 64, units: 'kilometers' });

      let clipped = null;
      try {
          clipped = turf.intersect(turf.featureCollection([polygon, limitCircle]));
      } catch (e) {
          console.error("Error interpolating:", e);
          return null;
      }

      if (!clipped) return null;

      const value = props.valor;
      const color = colorScale(value);

      const getLatLngs = (coords) => {
          if (Array.isArray(coords) && typeof coords[0] === 'number') {
              return [coords[1], coords[0]];
          }
          if (Array.isArray(coords)) {
              return coords.map(getLatLngs);
          }
          return null;
      };

      const geometryCoords = clipped.geometry.coordinates;
      const latLngs = getLatLngs(geometryCoords);

      // Renderizamos el polígono OPACAMENTE dentro del Panel semitransparente.
      // Usamos 'stroke: true' con el mismo color para rellenar grietas entre polígonos.
      const layer = L.polygon(latLngs, {
        pane: PANE_NAME,   // Usar nuestro panel especial
        weight: 2,         // Grosor suficiente para tapar huecos entre polígonos
        color: color,      // El borde es del mismo color que el relleno
        opacity: 1,        // Borde totalmente opaco
        fillColor: color,  
        fillOpacity: 1,    // Relleno totalmente opaco (la transparencia la da el Pane)
        stroke: true,      // Activamos el borde para suavizar uniones
        smoothFactor: 0.5
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

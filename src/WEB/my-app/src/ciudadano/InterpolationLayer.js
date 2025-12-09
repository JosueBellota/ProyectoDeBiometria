import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import * as turf from '@turf/turf';

const InterpolationLayer = ({ lecturas, colorScale: propColorScale }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || lecturas.length < 3) return;

    const points = turf.featureCollection(
      lecturas.map(l => turf.point([l.longitud, l.latitud], { value: l.valor }))
    );

    const tin = turf.tin(points, 'value');

    const bounds = map.getBounds();
    const west = bounds.getWest();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const north = bounds.getNorth();
    const cellWidth = 0.001;
    const cellHeight = 0.001;

    const gridFeatures = [];
    for (let x = west; x < east; x += cellWidth) {
        for (let y = south; y < north; y += cellHeight) {
            gridFeatures.push(turf.point([x, y]));
        }
    }
    const grid = turf.featureCollection(gridFeatures);

    grid.features.forEach(point => {
      let interpolatedValue = 0;
      for (const triangle of tin.features) {
        if (turf.booleanPointInPolygon(point, triangle)) {
          interpolatedValue = turf.planepoint(point, triangle);
          break;
        }
      }
      point.properties.value = interpolatedValue;
    });

    // Snap grid values to the nearest sensor readings
    lecturas.forEach(lectura => {
        const lecturaPoint = turf.point([lectura.longitud, lectura.latitud]);
        let closestPoint = null;
        let minDistance = Infinity;

        grid.features.forEach(gridPoint => {
            const distance = turf.distance(lecturaPoint, gridPoint);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = gridPoint;
            }
        });

        if (closestPoint) {
            closestPoint.properties.value = lectura.valor;
        }
    });

    const colorScale = propColorScale || ((value) => {
        if (value <= 30) return "green";
        if (value <= 60) return "yellow";
        return "red";
    });

    const gridLayers = grid.features.map(point => {
      const value = point.properties.value;
      if (value === 0) return null;

      const color = colorScale(value);
      const cellBounds = L.latLngBounds(
        [point.geometry.coordinates[1], point.geometry.coordinates[0]],
        [point.geometry.coordinates[1] + cellHeight, point.geometry.coordinates[0] + cellWidth]
      );
      
      return L.rectangle(cellBounds, {
        color: color,
        weight: 0,
        fillOpacity: 0.3,
      });
    }).filter(Boolean);

    const layerGroup = L.layerGroup(gridLayers).addTo(map);

    return () => {
      map.removeLayer(layerGroup);
    };
  }, [map, lecturas]);

  return null;
};

export default InterpolationLayer;

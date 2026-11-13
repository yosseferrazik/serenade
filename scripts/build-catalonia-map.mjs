// Genera src/lib/catalonia-map.js a partir del GeoJSON público de provincias.
// Uso: node scripts/build-catalonia-map.mjs
import { writeFile } from 'node:fs/promises';

const GEOJSON_URL =
  'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/spain-provinces.geojson';
const NAMES = {
  Barcelona: 'barcelona',
  Girona: 'girona',
  Lleida: 'lleida',
  Tarragona: 'tarragona',
};
const WIDTH = 600;
const HEIGHT = 540;
const PADDING = 14;
const TOLERANCE = 0.7;

const response = await fetch(GEOJSON_URL);
if (!response.ok) throw new Error(`GeoJSON ${response.status}`);
const geojson = await response.json();

const features = geojson.features.filter((feature) => NAMES[feature.properties.name]);

function ringsOf(feature) {
  const { type, coordinates } = feature.geometry;
  if (type === 'Polygon') return coordinates;
  if (type === 'MultiPolygon') return coordinates.flat();
  return [];
}

const lonLat = features.flatMap((feature) =>
  ringsOf(feature).flatMap((ring) => ring.map(([lon, lat]) => [lon, lat])),
);

const minLon = Math.min(...lonLat.map(([lon]) => lon));
const maxLon = Math.max(...lonLat.map(([lon]) => lon));
const minLat = Math.min(...lonLat.map(([, lat]) => lat));
const maxLat = Math.max(...lonLat.map(([, lat]) => lat));
const midLat = (minLat + maxLat) / 2;
const kx = Math.cos((midLat * Math.PI) / 180);

const rawWidth = (maxLon - minLon) * kx;
const rawHeight = maxLat - minLat;
const scale = Math.min((WIDTH - PADDING * 2) / rawWidth, (HEIGHT - PADDING * 2) / rawHeight);
const offsetX = (WIDTH - rawWidth * scale) / 2;
const offsetY = (HEIGHT - rawHeight * scale) / 2;

function project(lon, lat) {
  return [(lon - minLon) * kx * scale + offsetX, (maxLat - lat) * scale + offsetY];
}

function squaredDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function segmentDistance(point, start, end) {
  let x = start[0];
  let y = start[1];
  let dx = end[0] - x;
  let dy = end[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = end[0];
      y = end[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  return squaredDistance(point, [x, y]);
}

function simplify(points, tolerance) {
  if (points.length <= 3) return points;
  let maxDistance = 0;
  let index = 0;
  const last = points.length - 1;

  for (let i = 1; i < last; i += 1) {
    const distance = segmentDistance(points[i], points[0], points[last]);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance > tolerance * tolerance) {
    const first = simplify(points.slice(0, index + 1), tolerance);
    const second = simplify(points.slice(index), tolerance);
    return first.slice(0, -1).concat(second);
  }

  return [points[0], points[last]];
}

function area(points) {
  let total = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    total += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  }
  return Math.abs(total) / 2;
}

function toPath(rings) {
  return rings
    .map((ring) => {
      const projected = ring.map(([lon, lat]) => project(lon, lat));
      const simplified = simplify(projected, TOLERANCE);
      if (simplified.length < 3 || area(simplified) < 3) return '';
      const points = simplified
        .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
        .join(' L ');
      return `M ${points} Z`;
    })
    .filter(Boolean)
    .join(' ');
}

function centroid(points) {
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const cross = points[j][0] * points[i][1] - points[i][0] * points[j][1];
    twiceArea += cross;
    x += (points[j][0] + points[i][0]) * cross;
    y += (points[j][1] + points[i][1]) * cross;
  }
  if (twiceArea === 0) return points[0];
  return [x / (3 * twiceArea), y / (3 * twiceArea)];
}

function labelPoint(feature) {
  const rings = ringsOf(feature)
    .map((ring) => ring.map(([lon, lat]) => project(lon, lat)))
    .sort((a, b) => area(b) - area(a));
  const ring = rings.find((candidate) => area(candidate) > 40) ?? rings[0];
  const [x, y] = centroid(ring);
  return [Number(x.toFixed(1)), Number(y.toFixed(1))];
}

const provinces = features.map((feature) => ({
  code: NAMES[feature.properties.name],
  path: toPath(ringsOf(feature)),
  label: labelPoint(feature),
}));

const file = `// Generado por scripts/build-catalonia-map.mjs. No editar a mano.
export const MAP_WIDTH = ${WIDTH};
export const MAP_HEIGHT = ${HEIGHT};

const BOUNDS = {
  minLon: ${minLon},
  maxLon: ${maxLon},
  minLat: ${minLat},
  maxLat: ${maxLat},
  kx: ${kx},
  scale: ${scale},
  offsetX: ${offsetX},
  offsetY: ${offsetY},
};

export const PROVINCE_SHAPES = ${JSON.stringify(provinces, null, 2)};

export function projectPoint(lat, lng) {
  return [
    (lng - BOUNDS.minLon) * BOUNDS.kx * BOUNDS.scale + BOUNDS.offsetX,
    (BOUNDS.maxLat - lat) * BOUNDS.scale + BOUNDS.offsetY,
  ];
}
`;

await writeFile(new URL('../src/lib/catalonia-map.js', import.meta.url), file, 'utf8');
console.log(`OK ${provinces.length} provincias, ${(file.length / 1024).toFixed(1)} KB`);

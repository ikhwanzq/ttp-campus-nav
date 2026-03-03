// backend/debugGraph.js
// Run with: node debugGraph.js
const fs   = require("fs");
const path = require("path");

const geojson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/campus_network.geojson"), "utf8")
);

function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function buildGraph(geojson) {
  const graph = {};
  geojson.features.forEach(f => {
    if (f.geometry.type === "LineString") {
      const coords = f.geometry.coordinates;
      for (let i = 0; i < coords.length - 1; i++) {
        const keyA = coords[i].join(",");
        const keyB = coords[i+1].join(",");
        if (!graph[keyA]) graph[keyA] = [];
        if (!graph[keyB]) graph[keyB] = [];
        graph[keyA].push({ node: keyB, weight: haversine(coords[i], coords[i+1]) });
        graph[keyB].push({ node: keyA, weight: haversine(coords[i], coords[i+1]) });
      }
    }
  });

  // Auto-snap endpoints within 20 meters
  const SNAP_DISTANCE = 20;
  const keys = Object.keys(graph);
  const endpoints = keys.filter(k => graph[k].length === 1);
  endpoints.forEach(epKey => {
    const epCoord = epKey.split(",").map(Number);
    keys.forEach(otherKey => {
      if (otherKey === epKey) return;
      const otherCoord = otherKey.split(",").map(Number);
      const dist = haversine(epCoord, otherCoord);
      if (dist < SNAP_DISTANCE) {
        const alreadyConnected = graph[epKey].some(e => e.node === otherKey);
        if (!alreadyConnected) {
          graph[epKey].push({ node: otherKey, weight: dist });
          graph[otherKey].push({ node: epKey, weight: dist });
        }
      }
    });
  });

  return graph;
}

// BFS to find all connected components
function findComponents(graph) {
  const visited = new Set();
  const components = [];

  for (const node of Object.keys(graph)) {
    if (visited.has(node)) continue;

    // BFS from this node
    const component = [];
    const queue = [node];
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      component.push(cur);
      for (const { node: nb } of graph[cur]) {
        if (!visited.has(nb)) queue.push(nb);
      }
    }
    components.push(component);
  }

  return components;
}

const graph = buildGraph(geojson);
const components = findComponents(graph);

console.log(`\n📊 Total nodes: ${Object.keys(graph).length}`);
console.log(`🔗 Connected components: ${components.length}`);
console.log(`\n--- Component breakdown ---`);

components
  .sort((a, b) => b.length - a.length)
  .forEach((comp, i) => {
    const [lon, lat] = comp[0].split(",").map(Number);
    console.log(`Component ${i+1}: ${comp.length} nodes — starts at [${lat.toFixed(5)}, ${lon.toFixed(5)}]`);
  });

if (components.length === 1) {
  console.log("\n✅ All nodes are connected! No gaps in the map.");
} else {
  console.log(`\n⚠️  ${components.length - 1} disconnected section(s) found.`);
  console.log("💡 Fix: your friend needs to add connecting paths in the GeoJSON,");
  console.log("   or we can auto-snap nearby endpoints together in the backend.");
}
const fs = require('fs');
const path = require('path');
const shpwrite = require('shp-write');

// Helper to read a JS-wrapped JSON file (same format as other scripts)
function readJsWrappedJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // The file typically contains something like: var json_ManholeCovers_1 = {...};
  // Extract the JSON part between the first '=' and the last ';'
  const jsonString = content.substring(content.indexOf('=') + 1, content.lastIndexOf(';')).trim();
  return JSON.parse(jsonString);
}

const dataDir = path.join(__dirname, 'data');
const manholeFile = path.join(dataDir, 'ManholeCovers_1.js');

console.log('Reading manhole GeoJSON...');
const manholeGeojson = readJsWrappedJson(manholeFile);

console.log('Generating shapefile ZIP...');
try {
  // shp-write.zip returns a buffer (or Promise of one in some versions, 
  // but looking at the source it returns synchronously for Node)
  const buffer = shpwrite.zip(manholeGeojson);
  
  const outPath = path.join(dataDir, 'ManholeCovers.shp.zip');
  fs.writeFileSync(outPath, buffer);
  console.log('Shapefile exported to', outPath);
} catch (err) {
  console.error('Error creating shapefile:', err);
  process.exit(1);
}

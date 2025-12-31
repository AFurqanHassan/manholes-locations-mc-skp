/**
 * merge_csv_points.js
 * Merges points from 'data/27_30.csv' into 'data/ManholeCovers_1.js'.
 * Determines ZONE for new points using 'data/MCSKPZones_2.js'.
 */

const fs = require('fs');
const path = require('path');

// --- Helper: Point in Polygon (Ray Casting) ---
function isPointInPolygon(point, vs) {
    // point = [lon, lat]
    // vs = [[lon, lat], [lon, lat], ...] (ring)
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getZoneForPoint(lat, lon, zoneFeatures) {
    const point = [lon, lat];
    for (const feature of zoneFeatures) {
        const zoneName = feature.properties.ZONE;
        const geometry = feature.geometry;

        if (geometry.type === 'Polygon') {
            // Check exterior ring (index 0)
            if (isPointInPolygon(point, geometry.coordinates[0])) {
                return zoneName;
            }
        } else if (geometry.type === 'MultiPolygon') {
            for (const polygon of geometry.coordinates) {
                // Check exterior ring (index 0) of each polygon
                if (isPointInPolygon(point, polygon[0])) {
                    return zoneName;
                }
            }
        }
    }
    return 'A'; // Default fallback if not found
}

// --- Helper: Read and parsing JS-wrapped JSON files ---
function readJsWrappedJson(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Remove the variable assignment "var json_... = " and trailing ";"
    // We look for the first "{" and the last "}"
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error(`Could not find JSON object in ${filePath}`);
    }
    const jsonStr = content.substring(firstBrace, lastBrace + 1);
    // Be lenient with keys not being quoted if necessary by using eval (safe in this context of local data)
    // But standardized JSON.parse is safer. The inputs look like strict JSON properties but keys might be unquoted in some JS files.
    // The previous view showed keys ARE quoted in ManholeCovers_1.js but NOT in MCSKPZones_2.js (e.g. type: "FeatureCollection").
    // So we use Function constructor to parse loosely.
    return new Function('return ' + jsonStr)();
}

function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    // Skip comment lines (lines starting with # or empty)
    // The view showed first 3 lines are comments/empty.
    // Line 4 is header: Location/Plus Code,Latitude,Longitude,Timestamp,PICS
    // Let's robustly find the header `Location/Plus Code`
    
    let headerIndex = -1;
    for(let i=0; i<lines.length; i++) {
        if(lines[i].includes('Location/Plus Code')) {
            headerIndex = i;
            break;
        }
    }
    
    if (headerIndex === -1) {
        throw new Error("Could not find CSV header 'Location/Plus Code'");
    }

    const header = lines[headerIndex].split(',').map(h => h.trim());
    const dataLines = lines.slice(headerIndex + 1);
    
    const rows = [];
    
    for (const line of dataLines) {
        if (!line.trim()) continue;
        
        // CSV split handling quotes
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        
        const row = {};
        header.forEach((h, idx) => {
            row[h] = values[idx] && values[idx] !== '' ? values[idx] : undefined;
        });
        rows.push(row);
    }
    return rows;
}

function main() {
    const dataDir = path.join(__dirname, 'data');
    const manholeFile = path.join(dataDir, 'ManholeCovers_1.js');
    const zonesFile = path.join(dataDir, 'MCSKPZones_2.js');
    const csvFile = path.join(dataDir, '27_30.csv');

    console.log('Reading files...');
    const manholeData = readJsWrappedJson(manholeFile);
    const zonesData = readJsWrappedJson(zonesFile);
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    const newRows = parseCSV(csvContent);

    // Find Max FID and Max Sr_No
    let maxFid = 0;
    let maxSrNo = 0;

    manholeData.features.forEach(f => {
        const fid = parseInt(f.properties.FID || 0);
        const sr = parseInt(f.properties.Sr_No || 0);
        if (fid > maxFid) maxFid = fid;
        if (sr > maxSrNo) maxSrNo = sr;
    });

    console.log(`Current Max FID: ${maxFid}, Max Sr_No: ${maxSrNo}`);
    console.log(`Processing ${newRows.length} new rows...`);

    let addedCount = 0;
    let skippedCount = 0;

    newRows.forEach(row => {
        // Validate Lat/Lon
        const latStr = row['Latitude'];
        const lonStr = row['Longitude'];
        
        if (!latStr || !lonStr || latStr === 'Not found' || lonStr === 'Not found' || latStr.toLowerCase() === 'invalid latitude' || lonStr.toLowerCase() === 'invalid longitude') {
            skippedCount++;
            return;
        }

        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);

        if (isNaN(lat) || isNaN(lon)) {
            skippedCount++;
            return;
        }

        // Increment IDs
        maxFid++;
        maxSrNo++;

        // Determine Zone
        const zone = getZoneForPoint(lat, lon, zonesData.features);
        
        // Determine Location Cleaned (Remove quotes if present in CSV, handled by parseCSV but check)
        // row['Location/Plus Code'] usually looks like "P243+g5x, Sultanpura..."
        let location = row['Location/Plus Code'] ? row['Location/Plus Code'].replace(/"/g, '') : '';

        // Determine PICS
        // Existing data uses "images\\filename.jpg" (Windows path separator in JSON string?)
        // The view showed "images\\WhatsApp..." in JSON.
        // The CSV just has filename "WhatsApp...".
        // We will prepend "images\\"
        let pics = row['PICS'] || '';
        if (pics) {
             pics = 'images\\' + pics;
        }

        const newFeature = {
            "type": "Feature",
            "properties": {
                "FID": String(maxFid),
                "Shape *": "Point",
                "Sr_No": String(maxSrNo),
                "Latitude": lat,
                "Longitude": lon,
                "Location": location,
                "ZONE": zone,
                "COORDINATE": `${lat} , ${lon}`,
                "PICS": pics
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            }
        };

        manholeData.features.push(newFeature);
        addedCount++;
    });

    console.log(`Added ${addedCount} features.`);
    console.log(`Skipped ${skippedCount} invalid rows.`);

    // Write back
    // Use the variable name from the file: var json_ManholeCovers_1 = ...
    const outputContent = `var json_ManholeCovers_1 = ${JSON.stringify(manholeData, null, 2)};`;
    
    fs.writeFileSync(manholeFile, outputContent, 'utf-8');
    console.log(`Updated ${manholeFile}`);
}

main();

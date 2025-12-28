/**
 * Convert merged till 26.csv to GeoJSON format for ManholeCovers_1.js
 */

const fs = require('fs');
const path = require('path');

function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    
    // Skip first 3 comment lines
    const dataLines = lines.slice(3);
    
    // Parse header
    const header = dataLines[0].split(',').map(h => h.trim());
    
    const features = [];
    const skippedRows = [];
    let fid = 0;
    let srNo = 1;
    
    for (let i = 1; i < dataLines.length; i++) {
        const line = dataLines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing (handles quoted fields)
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
        
        // Create object from header and values
        const row = {};
        header.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        
        // Skip rows with invalid coordinates
        const lat = parseFloat(row['Latitude']);
        const lon = parseFloat(row['Longitude']);
        
        if (isNaN(lat) || isNaN(lon) || row['Latitude'] === 'Not found' || row['Longitude'] === 'Not found') {
            console.log(`Skipping row ${i} with invalid coordinates`);
            skippedRows.push({
                rowNumber: i,
                reason: isNaN(lat) ? 'Invalid Latitude' : isNaN(lon) ? 'Invalid Longitude' : 'Not found',
                ...row
            });
            continue;
        }
        
        // Extract fields
        const location = row['Location/Plus Code'].replace(/"/g, '');
        const timestamp = row['Timestamp'] || 'Not found';
        const pics = row['PICS'] || '';
        
        // Create feature
        const feature = {
            "type": "Feature",
            "properties": {
                "FID": String(fid),
                "Shape *": "Point",
                "Sr_No": String(srNo),
                "Latitude": lat,
                "Longitude": lon,
                "Location": location,
                "ZONE": "A",
                "COORDINATE": `${lat} , ${lon}`,
                "PICS": `images\\${pics}`
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            }
        };
        
        features.push(feature);
        fid++;
        srNo++;
    }
    
    return { features, skippedRows };
}

function exportSkippedRowsToCSV(skippedRows, outputFile) {
    if (skippedRows.length === 0) {
        console.log('No skipped rows to export.');
        return;
    }
    
    // Get all unique keys from skipped rows
    const allKeys = new Set();
    skippedRows.forEach(row => {
        Object.keys(row).forEach(key => allKeys.add(key));
    });
    
    const headers = ['Row Number', 'Reason', ...Array.from(allKeys).filter(k => k !== 'rowNumber' && k !== 'reason')];
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    skippedRows.forEach(row => {
        const values = headers.map(header => {
            let value = '';
            if (header === 'Row Number') value = row.rowNumber;
            else if (header === 'Reason') value = row.reason;
            else value = row[header] || '';
            
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                value = '"' + value.replace(/"/g, '""') + '"';
            }
            return value;
        });
        csvContent += values.join(',') + '\n';
    });
    
    fs.writeFileSync(outputFile, csvContent, 'utf-8');
    console.log(`\nExported ${skippedRows.length} skipped rows to: ${outputFile}`);
}

function main() {
    const csvFile = path.join(__dirname, 'data', 'merged till 26.csv');
    const outputFile = path.join(__dirname, 'data', 'ManholeCovers_1.js');
    const skippedFile = path.join(__dirname, 'data', 'skipped_rows.csv');
    
    // Read CSV file
    console.log(`Reading CSV file: ${csvFile}`);
    const csvContent = fs.readFileSync(csvFile, 'utf-8');
    
    // Parse CSV
    console.log('Parsing CSV...');
    const { features, skippedRows } = parseCSV(csvContent);
    
    // Create GeoJSON structure
    const geojson = {
        "type": "FeatureCollection",
        "name": "ManholeCovers_1",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    };
    
    // Write to JavaScript file
    console.log(`Writing output to: ${outputFile}`);
    const jsContent = 'var json_ManholeCovers_1 = ' + JSON.stringify(geojson, null, 2) + ';';
    fs.writeFileSync(outputFile, jsContent, 'utf-8');
    
    console.log(`\nConversion complete!`);
    console.log(`Created ${features.length} features.`);
    console.log(`Output written to: ${outputFile}`);
    
    // Export skipped rows
    exportSkippedRowsToCSV(skippedRows, skippedFile);
}

main();

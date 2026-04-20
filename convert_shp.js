const shapefile = require('shapefile');
const fs = require('fs');
const path = require('path');

const shpPath = 'data/ManholeCovers.shp/layers/POINT2.shp';
const outputPath = 'data/ManholeCovers_1.js';
const backupPath = 'data/ManholeCovers_1.js.bak';

async function convert() {
    console.log('Reading shapefile...');
    const features = [];
    
    const source = await shapefile.open(shpPath);
    while (true) {
        const result = await source.read();
        if (result.done) break;
        
        const props = result.value.properties;
        
        // Mapping properties as discussed
        // Using Lat/Long fields and parsing them as floats
        const mappedProps = {
            "FID": String(props.FID_1 || props.FID || features.length),
            "Shape *": "Point",
            "Sr_No": String(props.Sr_No || (features.length + 1)),
            "Latitude": parseFloat(props.Lat || props.Latitude),
            "Longitude": parseFloat(props.Long || props.Longitud || props.Longitude),
            "Location": props.Location || "",
            "ZONE": props.ZONE || "A",
            "COORDINATE": props.COORDINA || props.COORDINATE || `${props.Lat}, ${props.Long}`,
            "PICS": props.PICS || "",
            "coordinate": props.coordinate || `${props.Lat}, ${props.Long}`
        };
        
        features.push({
            "type": "Feature",
            "id": String(features.length),
            "properties": mappedProps,
            "geometry": result.value.geometry
        });
    }
    
    console.log(`Successfully read ${features.length} features.`);
    
    const geojson = {
        "type": "FeatureCollection",
        "features": features
    };
    
    const outputContent = `var json_ManholeCovers_1 = ${JSON.stringify(geojson, null, 2)};`;
    
    // Backup
    if (fs.existsSync(outputPath)) {
        console.log(`Backing up existing file to ${backupPath}`);
        fs.renameSync(outputPath, backupPath);
    }
    
    console.log(`Writing new data to ${outputPath}`);
    fs.writeFileSync(outputPath, outputContent, 'utf-8');
    console.log('Conversion complete!');
}

convert().catch(err => {
    console.error('Error during conversion:', err);
    process.exit(1);
});

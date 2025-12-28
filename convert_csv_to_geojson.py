#!/usr/bin/env python3
"""
Convert merged till 26.csv to GeoJSON format for ManholeCovers_1.js
"""

import csv
import json
import os

def convert_csv_to_geojson(csv_file, output_file):
    """Convert CSV file to GeoJSON format matching ManholeCovers_1.js structure"""
    
    features = []
    fid_counter = 0
    sr_no_counter = 1
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        # Skip the first 3 comment lines
        for _ in range(3):
            next(f)
        
        reader = csv.DictReader(f)
        
        for row in reader:
            # Skip rows with missing coordinates
            try:
                lat = float(row['Latitude'])
                lon = float(row['Longitude'])
            except (ValueError, KeyError):
                print(f"Skipping row with invalid coordinates: {row}")
                continue
            
            # Handle "Not found" values
            if row['Latitude'] == 'Not found' or row['Longitude'] == 'Not found':
                print(f"Skipping row with 'Not found' coordinates: {row}")
                continue
            
            # Extract location from Location/Plus Code field
            location = row.get('Location/Plus Code', '').strip('"')
            
            # Extract timestamp
            timestamp = row.get('Timestamp', 'Not found')
            
            # Extract image filename
            pics = row.get('PICS', '')
            
            # Create feature
            feature = {
                "type": "Feature",
                "properties": {
                    "FID": str(fid_counter),
                    "Shape *": "Point",
                    "Sr_No": str(sr_no_counter),
                    "Latitude": lat,
                    "Longitude": lon,
                    "Location": location,
                    "ZONE": "A",  # Default zone
                    "COORDINATE": f"{lat} , {lon}",
                    "PICS": f"images\\{pics}"  # Assuming images are in images folder
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                }
            }
            
            features.append(feature)
            fid_counter += 1
            sr_no_counter += 1
    
    # Create GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "name": "ManholeCovers_1",
        "crs": {
            "type": "name",
            "properties": {
                "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
            }
        },
        "features": features
    }
    
    # Write to JavaScript file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('var json_ManholeCovers_1 = ')
        json.dump(geojson, f, indent=2, ensure_ascii=False)
        f.write(';')
    
    print(f"Conversion complete! Created {len(features)} features.")
    print(f"Output written to: {output_file}")

if __name__ == "__main__":
    csv_file = "data/merged till 26.csv"
    output_file = "data/ManholeCovers_1.js"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found: {csv_file}")
        exit(1)
    
    convert_csv_to_geojson(csv_file, output_file)

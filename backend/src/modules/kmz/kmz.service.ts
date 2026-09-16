import JSZip from 'jszip';
import * as fs from 'fs';
import * as turf from '@turf/turf';
import { logger } from '../../utils/logger';

export interface KmzParseResult {
  coordinates: [number, number][];
  geojson: any;
  lengthKm: number;
  lengthMeters: number;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  bbox: [number, number, number, number];
  name?: string;
  description?: string;
}

export class KmzService {
  async parseKmz(filePath: string): Promise<KmzParseResult> {
    const stat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    let kmlText = '';

    if (filePath.toLowerCase().endsWith('.kmz')) {
      kmlText = await this.extractKmlFromKmz(fileBuffer);
    } else {
      kmlText = fileBuffer.toString('utf-8');
    }

    return this.parseKml(kmlText);
  }

  private async extractKmlFromKmz(fileBuffer: Buffer): Promise<string> {
    const zip = await JSZip.loadAsync(fileBuffer);
    const kmlFileName = Object.keys(zip.files).find(
      (f) => f.toLowerCase().endsWith('.kml'),
    );

    if (!kmlFileName) {
      throw new Error('Tidak ditemukan file KML dalam KMZ');
    }

    return zip.files[kmlFileName].async('string');
  }

  parseKml(kmlText: string): KmzParseResult {
    const lines: number[] = [];
    const coordRegex = /<coordinates>([^<]+)<\/coordinates>/gi;
    let match: RegExpExecArray | null;
    let name = '';
    let description = '';

    const nameMatch = kmlText.match(/<name>([^<]+)<\/name>/i);
    if (nameMatch && nameMatch[1]) name = nameMatch[1].trim();

    const descMatch = kmlText.match(/<description>([^<]+)<\/description>/i);
    if (descMatch && descMatch[1]) description = descMatch[1].trim();

    const coordinates: [number, number][] = [];

    while ((match = coordRegex.exec(kmlText)) !== null) {
      const coordText = match[1].trim();
      const points = coordText.split(/\s+/);

      for (const pt of points) {
        const parts = pt.split(',');
        if (parts.length >= 2) {
          const lon = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            coordinates.push([lat, lon]);
          }
        }
      }
    }

    if (coordinates.length === 0) {
      throw new Error('Tidak ditemukan koordinat valid dalam file KML/KMZ');
    }

    const coords = coordinates;
    const geojson = this.coordinatesToGeoJSON(coords);
    const lengthKm = turf.length(geojson as any, { units: 'kilometers' });
    const lengthMeters = lengthKm * 1000;

    const startPoint = { lat: coords[0][0], lng: coords[0][1] };
    const endPoint = { lat: coords[coords.length - 1][0], lng: coords[coords.length - 1][1] };

    const bbox = this.calculateBbox(coords);

    return {
      coordinates: coords,
      geojson,
      lengthKm,
      lengthMeters,
      startPoint,
      endPoint,
      bbox,
      name,
      description,
    };
  }

  private coordinatesToGeoJSON(coords: [number, number][]): any {
    const features: any[] = [];

    for (let i = 0; i < coords.length; i++) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [coords[i][1], coords[i][0]],
        },
        properties: { index: i },
      });
    }

    if (coords.length === 1) {
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [coords[0][1], coords[0][0]] },
        properties: {},
      };
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coords.map(([lat, lng]) => [lng, lat]),
      },
      properties: {
        lengthKm: turf.length(
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: coords.map(([lat, lng]) => [lng, lat]),
            },
          } as any,
          { units: 'kilometers' },
        ),
      },
    };
  }

  private calculateBbox(coords: [number, number][]): [number, number, number, number] {
    let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;

    for (const [lat, lng] of coords) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
    }

    return [minLng, minLat, maxLng, maxLat];
  }

  async geocoding(lat: number, lng: number, userAgent: string, email?: string): Promise<{
    city: string;
    province: string;
    displayName: string;
  }> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10${email ? `&email=${email}` : ''}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept-Language': 'id-ID,id',
        },
      });
      const geoData: any = await res.json();

      if (geoData && geoData.address) {
        const city = geoData.address.city || geoData.address.regency || geoData.address.county || geoData.address.town || 'Lokasi Tidak Terdeteksi';
        const province = geoData.address.state || geoData.address.region || 'Indonesia';
        const displayName = geoData.display_name || '';

        return {
          city: city.replace('Kabupaten ', '').replace(' City', ''),
          province,
          displayName,
        };
      }

      return {
        city: 'Lokasi Tidak Terdeteksi',
        province: 'Indonesia',
        displayName: '',
      };
    } catch (err) {
      logger.error('Geocoding failed:', err);
      return {
        city: 'Lokasi Tidak Terdeteksi',
        province: 'Indonesia',
        displayName: '',
      };
    }
  }
}

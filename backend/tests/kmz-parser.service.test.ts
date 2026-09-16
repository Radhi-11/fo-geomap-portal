import { KmzService, KmzParseResult } from '../src/modules/kmz/kmz.service';

describe('KmzService', () => {
  let service: KmzService;

  beforeEach(() => {
    service = new KmzService();
  });

  describe('parseKml', () => {
    it('should parse KML with LineString coordinates', () => {
      const kmlText = `
        <kml>
          <Document>
            <name>Test Route</name>
            <Placemark>
              <LineString>
                <coordinates>118.0,-2.5,0 118.001,-2.5,0 118.002,-2.501,0</coordinates>
              </LineString>
            </Placemark>
          </Document>
        </kml>
      `;

      const result = service.parseKml(kmlText);

      expect(result.name).toBe('Test Route');
      expect(result.coordinates.length).toBe(3);
      expect(result.lengthKm).toBeGreaterThan(0);
      expect(result.startPoint).toEqual({ lat: -2.5, lng: 118.0 });
      expect(result.endPoint).toEqual({ lat: -2.501, lng: 118.002 });
    });

    it('should throw error when no coordinates found', () => {
      const kmlText = '<kml><Document></Document></kml>';

      expect(() => service.parseKml(kmlText)).toThrow('Tidak ditemukan koordinat valid');
    });

    it('should extract name and description', () => {
      const kmlText = `
        <kml>
          <Document>
            <name>Test Route Name</name>
            <description>Test Description</description>
            <Placemark>
              <LineString>
                <coordinates>118.0,-2.5 118.001,-2.5</coordinates>
              </LineString>
            </Placemark>
          </Document>
        </kml>
      `;

      const result = service.parseKml(kmlText);

      expect(result.name).toBe('Test Route Name');
      expect(result.description).toBe('Test Description');
    });
  });

  describe('calculateBbox', () => {
    it('should calculate correct bounding box', () => {
      const kmlText = `
        <kml>
          <Placemark>
            <LineString>
              <coordinates>118.0,-2.5,0 118.002,-2.502,0</coordinates>
            </LineString>
          </Placemark>
        </kml>
      `;

      const result = service.parseKml(kmlText);
      const [minLng, minLat, maxLng, maxLat] = result.bbox;

      expect(minLng).toBe(118.0);
      expect(maxLng).toBe(118.002);
      expect(minLat).toBe(-2.502);
      expect(maxLat).toBe(-2.5);
    });
  });
});

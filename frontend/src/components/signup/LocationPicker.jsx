'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from 'react-leaflet';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { MapPin, Navigation } from 'lucide-react';

// Leaflet's default marker icon URLs are broken by webpack/turbopack bundling.
// Restore them to absolute CDN URLs so the marker actually appears on the map.
// (Safe to run repeatedly — mergeOptions is idempotent.)
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

function DraggableMarker({ position, setPosition }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        setPosition(marker.getLatLng());
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

function MapClickHandler({ setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return null;
}

export default function LocationPicker({ location, onLocationChange }) {
  const [position, setPosition] = useState({
    lat: location?.latitude || 40.7128,
    lng: location?.longitude || -74.006,
  });
  const [radius, setRadius] = useState(location?.radius_miles || 10);
  const [address, setAddress] = useState(location?.address || '');

  // Push every position/radius/address change up to the parent. The parent
  // debounces persistence in its own auto-save layer.
  useEffect(() => {
    onLocationChange({
      latitude: position.lat,
      longitude: position.lng,
      radius_miles: radius,
      address,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, radius, address]);

  const handleGetCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center gap-2 text-gray-700 mb-2">
          <MapPin className="w-4 h-4" />
          Target Location for Local Advertising
        </Label>
        <p className="text-sm text-gray-500 mb-3">
          Drag the marker to your business location or click on the map. Adjust
          the radius to define your target area.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Address / Location Name</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 123 Main St, New York, NY"
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label>Target Radius: {radius} miles</Label>
          <Slider
            value={[radius]}
            onValueChange={(value) => setRadius(value[0])}
            min={1}
            max={50}
            step={1}
            className="mt-2"
          />
        </div>
      </div>

      <Card className="border-indigo-100">
        <CardContent className="p-4">
          <div className="mb-3 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Coordinates: {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Navigation className="w-4 h-4" />
              Use Current Location
            </button>
          </div>

          <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-200">
            <MapContainer
              center={position}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker position={position} setPosition={setPosition} />
              <Circle
                center={position}
                radius={radius * 1609.34}
                pathOptions={{
                  color: '#4f46e5',
                  fillColor: '#4f46e5',
                  fillOpacity: 0.2,
                }}
              />
              <MapClickHandler setPosition={setPosition} />
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
        <p className="text-sm text-indigo-800">
          <strong>💡 Tip:</strong> Your ads will be shown to Muslim consumers
          within {radius} miles of the marker location. Perfect for driving
          foot traffic to your business!
        </p>
      </div>
    </div>
  );
}

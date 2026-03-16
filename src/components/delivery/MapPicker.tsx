import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation } from "lucide-react";

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
}

function LocationMarker({ position, setPosition, onLocationSelect }: { 
  position: [number, number], 
  setPosition: (pos: [number, number]) => void,
  onLocationSelect: (lat: number, lng: number) => void 
}) {
  const map = useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker position={position} icon={DefaultIcon} />
  ) : null;
}

function PanToLocation({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16);
    }
  }, [position, map]);
  return null;
}

export default function MapPicker({ onLocationSelect, initialLocation }: MapPickerProps) {
  const [position, setPosition] = useState<[number, number]>(initialLocation || [14.2144, 121.1683]); // Default to Calamba, PH area
  const [locating, setLocating] = useState(false);

  const handleLocateMe = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosition(newPos);
        onLocationSelect(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        alert("Unable to retrieve your location");
        setLocating(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary/60">
          <MapPin className="h-4 w-4" />
          <span className="text-xs font-black uppercase tracking-widest">Pin your location</span>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleLocateMe}
          disabled={locating}
          className="h-8 rounded-full text-[10px] font-bold uppercase gap-2 bg-white shadow-sm"
        >
          <Navigation className={`h-3 w-3 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? "Locating..." : "Locate Me"}
        </Button>
      </div>

      <div className="h-[300px] w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-soft relative z-0">
        <MapContainer 
          center={position} 
          zoom={15} 
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onLocationSelect={onLocationSelect} 
          />
          <PanToLocation position={position} />
        </MapContainer>
      </div>
      <p className="text-[10px] text-muted-foreground italic text-center px-4">
        Tip: Drag the marker or tap anywhere on the map to refine your location.
      </p>
    </div>
  );
}

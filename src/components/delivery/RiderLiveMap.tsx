import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Bike, MapPin } from "lucide-react";

// Icons
const CustomerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom Rider Icon (Bike)
const RiderIcon = L.divIcon({
  html: '<div class="bg-primary p-2 rounded-full border-2 border-white shadow-lg"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg></div>',
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

interface RiderLiveMapProps {
  riderId: string;
  customerLat: number;
  customerLng: number;
}

function AutoFit({ riderPos, customerPos }: { riderPos: [number, number] | null, customerPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (riderPos) {
      const bounds = L.latLngBounds([riderPos, customerPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [riderPos, customerPos, map]);
  return null;
}

export default function RiderLiveMap({ riderId, customerLat, customerLng }: RiderLiveMapProps) {
  const [riderPos, setRiderPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!riderId) return;

    // Fetch initial location
    const fetchInitialLoc = async () => {
      const { data } = await supabase
        .from("rider_locations")
        .select("lat, lng")
        .eq("rider_id", riderId)
        .single();
      if (data) setRiderPos([Number(data.lat), Number(data.lng)]);
    };
    fetchInitialLoc();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`rider-${riderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rider_locations",
          filter: `rider_id=eq.${riderId}`,
        },
        (payload: { new: { lat: number; lng: number } }) => {
          setRiderPos([Number(payload.new.lat), Number(payload.new.lng)]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [riderId]);

  return (
    <Card className="overflow-hidden rounded-[2.5rem] border-white/40 shadow-soft h-[400px] w-full relative z-0">
      <MapContainer 
        center={[customerLat, customerLng]} 
        zoom={15} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Customer Location */}
        <Marker position={[customerLat, customerLng]} icon={CustomerIcon}>
          <Popup>Delivery Address</Popup>
        </Marker>

        {/* Rider Location */}
        {riderPos && (
          <Marker position={riderPos} icon={RiderIcon}>
            <Popup>Your Rider is here!</Popup>
          </Marker>
        )}

        <AutoFit riderPos={riderPos} customerPos={[customerLat, customerLng]} />
      </MapContainer>
      
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-soft border border-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bike className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-foreground/40">Status</p>
              <p className="text-sm font-bold text-foreground">Rider is on the way</p>
            </div>
          </div>
          {!riderPos && (
            <span className="text-[10px] font-bold text-muted-foreground animate-pulse">Waiting for GPS...</span>
          )}
        </div>
      </div>
    </Card>
  );
}

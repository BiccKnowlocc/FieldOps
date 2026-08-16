import * as Location from 'expo-location';

export async function readGps() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { lat: null as number | null, lng: null as number | null, accuracyM: null as number | null };
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracyM: pos.coords.accuracy,
    };
  } catch {
    return { lat: null as number | null, lng: null as number | null, accuracyM: null as number | null };
  }
}

export function metersBetween(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function geofenceStatus(input: {
  siteLat: number;
  siteLng: number;
  radiusM: number;
  lat: number | null;
  lng: number | null;
}) {
  if (input.lat == null || input.lng == null) {
    return { inside: false, meters: null as number | null };
  }
  const meters = Math.round(metersBetween(input.siteLat, input.siteLng, input.lat, input.lng));
  return { inside: meters <= input.radiusM, meters };
}

import * as Location from 'expo-location';
import { Platform } from 'react-native';

// Remember to change this to your computer's IPv4 address if testing on a physical device!
const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const startTelematicsPing = async (phone: string) => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.error('Permission to access location was denied');
    return;
  }

  const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
  });

  // Speed is returned in meters/second. Convert to km/h.
  const speedMps = location.coords.speed || 0;
  const speedKmh = speedMps * 3.6;

  try {
    await fetch(`${BACKEND_URL}/telematics/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: phone,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        speed: speedKmh
      })
    });
    console.log(`📍 Telematics ping sent: ${speedKmh.toFixed(2)} km/h`);
  } catch (error) {
    console.log('Telematics sync failed, network might be down.');
  }
};
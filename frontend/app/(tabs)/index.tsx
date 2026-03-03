import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline, MapPressEvent } from 'react-native-maps';

const API_URL = 'https://ttp-campus-nav.onrender.com';

const HEADERS = {
  'Content-Type': 'application/json',
};

type Coordinate = { latitude: number; longitude: number };

export default function Index() {
  const [start, setStart]             = useState<Coordinate | null>(null);
  const [end, setEnd]                 = useState<Coordinate | null>(null);
  const [route, setRoute]             = useState<Coordinate[]>([]);
  const [campusPaths, setCampusPaths] = useState<Coordinate[][]>([]);
  const [distance, setDistance]       = useState<number | null>(null);
  const [loading, setLoading]         = useState(false);

  // Fetch blue paths from backend on startup
  useEffect(() => {
    fetch(`${API_URL}/paths`, { headers: HEADERS })
      .then(res => res.json())
      .then(data => setCampusPaths(data.paths))
      .catch(err => console.error("Failed to load paths:", err));
  }, []);

  const campusRegion = {
    latitude: 4.3830,
    longitude: 100.9679,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const coord = { latitude, longitude };

    if (!start) {
      setStart(coord);
      setEnd(null);
      setRoute([]);
      setDistance(null);
    } else if (!end) {
      setEnd(coord);
      await fetchRoute(start, coord);
    } else {
      setStart(coord);
      setEnd(null);
      setRoute([]);
      setDistance(null);
    }
  };

  const fetchRoute = async (from: Coordinate, to: Coordinate) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/route`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          start: [from.longitude, from.latitude],
          end:   [to.longitude,   to.latitude],
        }),
      });
      if (!res.ok) throw new Error('Route not found');
      const data = await res.json();
      const coords: Coordinate[] = data.path.map(([lon, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lon,
      }));
      setRoute(coords);
      setDistance(data.distanceMeters);
    } catch (err) {
      Alert.alert('Error', 'Could not find a route. Try tapping closer to a path.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStart(null);
    setEnd(null);
    setRoute([]);
    setDistance(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={campusRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
      >
        {/* Blue lines — walkable paths fetched from backend */}
        {campusPaths.map((path, i) => (
          <Polyline
            key={i}
            coordinates={path}
            strokeColor="#3b82f6"
            strokeWidth={3}
            lineJoin="round"
          />
        ))}

        {start && <Marker coordinate={start} title="Start" pinColor="green" />}
        {end    && <Marker coordinate={end}   title="Destination" pinColor="red" />}

        {/* Yellow line — shortest route result */}
        {route.length > 0 && (
          <Polyline
            coordinates={route}
            strokeColor="#eab308"
            strokeWidth={5}
            lineJoin="round"
          />
        )}
      </MapView>

      <View style={styles.panel}>
        {!start && !loading && (
          <Text style={styles.hint}>👆 Tap on a <Text style={{color:'#3b82f6'}}>blue path</Text> to set start</Text>
        )}
        {start && !end && !loading && (
          <Text style={styles.hint}>👆 Tap another <Text style={{color:'#3b82f6'}}>blue path</Text> for destination</Text>
        )}
        {loading && <ActivityIndicator size="large" color="#eab308" />}
        {distance !== null && !loading && (
          <Text style={styles.distance}>📍 Distance: {distance}m</Text>
        )}
        {(start || route.length > 0) && (
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },
  panel: {
    position: 'absolute', bottom: 30, left: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 8,
  },
  hint:      { color: '#f1f5f9', fontSize: 14, textAlign: 'center' },
  distance:  { color: '#eab308', fontSize: 16, fontWeight: 'bold' },
  resetBtn:  { backgroundColor: '#dc2626', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  resetText: { color: '#fff', fontWeight: 'bold' },
});
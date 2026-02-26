import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps'; // Import Polyline

export default function Index() {
  const campusRegion = {
    latitude: 4.3856,
    longitude: 100.9790,
    latitudeDelta: 0.005, // Zoomed in a bit closer
    longitudeDelta: 0.005,
  };

  // 1. Define your custom waypoints (breadcrumbs)
  // You would capture these specific coordinates by walking the actual path
  const customRoute = [
    { latitude: 4.3860, longitude: 100.9780 }, // Start (e.g., Block 1)
    { latitude: 4.3858, longitude: 100.9785 }, // Hallway turn
    { latitude: 4.3850, longitude: 100.9790 }, // Courtyard center
    { latitude: 4.3845, longitude: 100.9800 }, // Path to library
    { latitude: 4.3840, longitude: 100.9820 }, // End (IRC)
  ];

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        initialRegion={campusRegion}
        showsUserLocation={true}
      >
        <Marker coordinate={customRoute[0]} title="Start" pinColor="green" />
        <Marker coordinate={customRoute[customRoute.length - 1]} title="Destination" />

        {/* 2. Draw the custom line connecting your coordinates */}
        <Polyline
          coordinates={customRoute}
          strokeColor="#eab308" // A nice yellow pathway
          strokeWidth={6}
          lineJoin="round"      // Makes the corners smooth
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});
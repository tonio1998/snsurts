import React, { memo, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from '../../theme';

/* ---------------- TYPES ---------------- */

export interface MapPoint {
    latitude: number;
    longitude: number;
    label?: string;
}

interface LeafletMapProps {
    latitude?: number;
    longitude?: number;

    points?: MapPoint[];
    showPolyline?: boolean;
    autoFit?: boolean;

    loading?: boolean;
    error?: string | null;
    height?: number;
    zoom?: number;
}

/* ---------------- COMPONENT ---------------- */

const LeafletMap = memo(
    ({
         latitude,
         longitude,
         points = [],
         showPolyline = false,
         autoFit = false,
         loading = false,
         error,
         height = 160,
         zoom = 25,
     }: LeafletMapProps) => {

        const hasMultiplePoints = points.length > 0;
        const hasSinglePoint = latitude != null && longitude != null;

        const html = useMemo(() => {
            if (!hasMultiplePoints && !hasSinglePoint) return '';

            const mapPoints = hasMultiplePoints
                ? points
                : [{ latitude: latitude!, longitude: longitude! }];

            return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
html, body, #map {
  height: 100%;
  margin: 0;
  padding: 0;
}
#map {
  touch-action: manipulation;
}
.leaflet-control-attribution {
  display: none;
}
</style>
</head>
<body>
<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const points = ${JSON.stringify(mapPoints)};

  const map = L.map('map', {
    zoomControl: true,
    dragging: true,
    touchZoom: true,
    doubleClickZoom: true,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);

  const latlngs = [];

  points.forEach((p, index) => {
    if (
      typeof p.latitude !== 'number' ||
      typeof p.longitude !== 'number'
    ) return;

    const latlng = [p.latitude, p.longitude];
    latlngs.push(latlng);

    const marker = L.marker(latlng).addTo(map);

    if (points.length > 1) {
      if (index === 0) marker.bindPopup('Start');
      if (index === points.length - 1) marker.bindPopup('Latest');
    }
  });

  if (${showPolyline} && latlngs.length > 1) {
    L.polyline(latlngs, {
      color: '${theme.colors.light.primary}',
      weight: 4
    }).addTo(map);
  }

  if (${autoFit} && latlngs.length > 1) {
    map.fitBounds(latlngs, { padding: [40, 40] });
  } else if (latlngs.length) {
    map.setView(latlngs[latlngs.length - 1], ${zoom});
  }
</script>
</body>
</html>
            `;
        }, [
            latitude,
            longitude,
            points,
            showPolyline,
            autoFit,
            zoom,
            hasMultiplePoints,
            hasSinglePoint,
        ]);

        return (
            <View style={[styles.container, { height }]}>
                {hasMultiplePoints || hasSinglePoint ? (
                    <WebView
                        source={{ html }}
                        originWhitelist={['*']}
                        scrollEnabled={false}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        style={styles.webview}
                    />
                ) : (
                    <View style={styles.placeholder}>
                        {loading ? (
                            <ActivityIndicator color={theme.colors.light.primary} />
                        ) : (
                            <Text style={styles.text}>
                                {error || 'Location unavailable'}
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    }
);

export default LeafletMap;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#eee',
    },
    webview: {
        flex: 1,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginTop: 6,
        fontSize: 12,
        color: '#666',
    },
});

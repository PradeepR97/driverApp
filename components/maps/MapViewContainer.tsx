import { forwardRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type MapViewProps } from 'react-native-maps';

export type MapViewContainerProps = Omit<MapViewProps, 'style'> & {
  /** Extra padding so markers are not hidden under overlays (e.g. bottom sheet). */
  mapPadding?: { top: number; right: number; bottom: number; left: number };
};

export const MapViewContainer = forwardRef<MapView, MapViewContainerProps>(
  function MapViewContainer({ mapPadding, children, ...rest }, ref) {
    if (Platform.OS === 'web') {
      return null;
    }

    return (
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFillObject}
        showsUserLocation
        showsMyLocationButton={false}
        rotateEnabled
        pitchEnabled={false}
        mapPadding={mapPadding}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        {...rest}
      >
        {children}
      </MapView>
    );
  },
);

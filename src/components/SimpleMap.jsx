import './SimpleMap.css'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMaps } from '../context/GoogleMapContext';
const defaultCenter = {
    lat: 13.794370967,
    lng: 100.32246238,
}

const defaultPanBound = {
    south: 13.785212,
    west: 100.307571,
    north: 13.804092,
    east: 100.337569,
}

const defaultOptions = {
    zoom: 10,
    zoomControl: true,  // You can still control zoom via buttons if you need
    scrollwheel: true, // Disable zooming with scroll wheel
    //disableDoubleClickZoom: true, // Disable zoom on double click
    //draggable: true, // Disable dragging (locks the position)
    center: defaultCenter,
    minZoom: 10,
    maxZoom: 50,

    restriction: {
        latLngBounds: defaultPanBound,
        strictBounds: true,
    },

}


const SimpleMap = ({ location, onLocationChange, routeData, routeColor }) => {
    const map = useRef(null);
    const polylineRef = useRef(null);
    const [isMapLoaded, setMapLoaded] = useState(false);
    const [marker, setMarker] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const { isLoaded } = useGoogleMaps();

    const onLoad = useCallback((mapInstance) => {
        map.current = mapInstance;
        if (map.current) {
            setMapLoaded(true);
        }
    }, []);
    useEffect(() => {
        if (isMapLoaded) {
            map.current.setOptions({
                ...defaultOptions,
            });
            console.log("simple map loaded");
        }
    }, [isMapLoaded]);

    const onUnmount = React.useCallback(function callback(map) {
        map.current = null;
    }, [])
    const handleMapClick = useCallback((e) => {
        if (e && e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            const newLocation = { lat, lng };
            setMarker(newLocation);
            onLocationChange(newLocation);
        }
    }, [onLocationChange]);

    useEffect(() => {
        setMarker(location);
    }, [location]);

    useEffect(() => {
        if (routeData) {
            console.log("route data to render", routeData);
        } else {
            console.log("route data not mounted");
        }
    }, [routeData]);

    const onPolylineLoad = useCallback((polyline) => {
        polylineRef.current = polyline;
        console.log("Polyline loaded:", polylineRef.current);
    }, []);

    const handlePolylineEdit = useCallback(() => {
        if (polylineRef.current) {
            const updatedPath = polylineRef.current.getPath().getArray().map((latLng) => ({
                lat: latLng.lat(),
                lng: latLng.lng(),
            }));
            console.log("Updated path:", updatedPath);
        }
    }, []);

    return (
        <div class="simple-map-container">
            <GoogleMap mapContainerClassName="simple-map"
                onLoad={onLoad}
                onUnmount={onUnmount}
                onClick={handleMapClick}
            >
                {marker && (
                    <Marker
                        position={marker}
                    />
                )}
                {routeData && (
                    <Polyline
                        path={routeData}
                        onLoad={onPolylineLoad}
                        onMouseUp={handlePolylineEdit}
                        options={{
                            strokeColor: routeColor,
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                            fillOpacity: 0.3,
                            clickable: false,
                            draggable: true,
                            editable: true,
                            visible: true,
                            zIndex: 1
                        }}
                    />
                )}
            </GoogleMap>

        </div >
    );
};

export default SimpleMap
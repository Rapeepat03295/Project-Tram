import './RouteMap.css'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Polyline } from '@react-google-maps/api'
import { useGoogleMaps } from '../context/GoogleMapContext';
import { editRouteFromDb } from '../config/firebase';
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
    zoom: 7,
    zoomControl: true,
    scrollwheel: true,
    center: defaultCenter,
    minZoom: 7,
    maxZoom: 50,

    restriction: {
        latLngBounds: defaultPanBound,
        strictBounds: true,
    },

}


const RouteMap = ({ routeData, routeColor }) => {
    const map = useRef(null);
    const polylineRef = useRef(null);
    const [isMapLoaded, setMapLoaded] = useState(false);
    const [showBtn, setShowBtn] = useState(false);
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
            console.log("Route Map loaded");
        }
    }, [isMapLoaded]);

    const onUnmount = React.useCallback(function callback(map) {
        map.current = null;
    }, [])

    useEffect(() => {
        if (routeData) {
            console.log("route data to render", routeData);
        }
    }, [routeData]);

    const onPolylineLoad = useCallback((polyline) => {
        polylineRef.current = polyline;
        //console.log("Polyline loaded:", polylineRef.current);
    }, []);

    const getPolylineRef = () => {
        const updatedPath = polylineRef.current.getPath().getArray().map((latLng) => ({
            lat: latLng.lat(),
            lng: latLng.lng(),
        }));
        return updatedPath;
    }
    const handlePolylineEdit = useCallback(() => {
        if (polylineRef.current) {
            const updatedPath = getPolylineRef();
            setShowBtn(true);
            console.log("Updated path:", updatedPath);
        }
    }, []);

    const handleSavePath = async () => {
        try {
            const polylineArr = getPolylineRef();
            const editData = await editRouteFromDb(polylineArr, `adminRoutes`, routeColor);
            alert("Route data updated");
        } catch (e) {
            console.log(e);
            alert("Failed to save routes")
        }
    }

    return (
        <div className="route-map-container">
            <h1 class = "route-color-head" style = {{color:routeColor}}>{routeColor}</h1>
            <GoogleMap mapContainerClassName="route-map"
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
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
                            zIndex: 1,
                            icons: [
                                {
                                    icon: {
                                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                        scale: 3,
                                        strokeOpacity: 1,
                                        fillOpacity: 1,
                                    },
                                    offset: '100%', // You can use '0%' for start, '50%' for middle, '100%' for end
                                    repeat: '100px', // Adjust the repeat distance for multiple arrows
                                },
                            ],
                        }}
                    />
                )}
            </GoogleMap>
            <br/><r/>
            {showBtn && <button className = "add-data event-color" onClick={() => {
                handleSavePath();
            }}>Save</button>}
        </div>
    );
};

export default RouteMap
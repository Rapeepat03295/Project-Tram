import React, { createContext, useContext, useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const GoogleMapsContext = createContext();

const libraries = ['marker','places', 'geometry', 'directions'];

export const GoogleMapsProvider = ({ children }) => {
    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API,
        libraries,
    });

    const [google, setGoogle] = useState(null);

    useEffect(() => {
        if (isLoaded) {
            setGoogle(window.google);
        }
    }, [isLoaded]);

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, google }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};

export const useGoogleMaps = () => {
    return useContext(GoogleMapsContext);
};
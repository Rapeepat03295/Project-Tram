import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useGoogleMaps } from '../context/GoogleMapContext';
import { GoogleMap, Marker, DirectionsRenderer, Polyline, InfoWindow } from '@react-google-maps/api';
//import { ref, push, set, remove, onValue } from 'firebase/database';
import { realtimeDb, fetchFromDb, addFromDb, editFromDb } from '../config/firebase';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../components/MapComponent.css'
import Display from './Display';
import { findNearestTramStop, calculateDistance } from '../utils/stations';
//import { markerIconToUrl } from '../utils/markerIcon';
import { userIconToUrl } from '../icons/userIcon';
import { toMarkerIconUrl } from '../icons/toMarkerIcon';
import { eventIconUrl } from '../icons/eventIcon';

const PolylineOptions = (color, isVisible = true) => {

    return {
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 3.5,
        fillOpacity: 0.6,
        clickable: false,
        draggable: false,
        editable: false,
        visible: isVisible,
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
    }
}
const defaultCenter = {
    lat: 13.794370967,
    lng: 100.32246238,
}

//13.776152, 100.313490
const defaultPanBound = {
    south: 13.776152,
    west: 100.313490,
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
    //minZoom: 10,
    minZoom: 1,
    maxZoom: 50,

    restriction: {
        latLngBounds: defaultPanBound,
        strictBounds: true,
    },

}

function MapComponent() {
    //const [zoomlvl, setZoomLvl] = React.useState(5);
    const removePopup = {
        image: '',
        colors: [],
        title: ''
    }
    const map = useRef(null);
    const [isLogin, setIsLogin] = useState(false);
    const [transferStation, setTransferStation] = useState(null);
    const [isMapLoaded, setMapLoaded] = useState(false);
    const [markers, setMarker] = useState([]);
    const [station, setStation] = useState([]);
    const [hoverMarker, setHoverMarker] = useState(removePopup);
    const [eventMarker, setMarkerEvent] = useState([]);
    const { isLoaded, google } = useGoogleMaps();
    const [userLocation, setUserLocation] = useState(null);
    const [nearStation, setNearLocation] = useState(null);
    const [fromMarker, setFromMarker] = useState(null);
    const [toMarker, setToMarker] = useState(null);
    const [distance, setDistance] = useState(null);
    const [walkingDistance, setWalkingDistance] = useState(null);
    const [direction, setDirection] = useState(null);
    const [directionsUserToTram, setDirectionsUserToTram] = useState(null);
    const [liveTram, setLiveTram] = useState([]);
    const [time, setTime] = useState(null);
    const [isDrag, setDrag] = useState(true);
    const [user, setUser] = useState(null);
    const [simState, setSimState] = useState(false);
    const [routeData, setRouteData] = useState([]);
    const [showRoute, setShowRoute] = useState(false);
    const [routeColor, setRouteColor] = useState([]);
    const [tramMap, setTramMap] = useState(new Map());
    const [result, setResult] = useState([]);
    const [stationmap, setStationMap] = useState(new Map());
    const [midpoint, setMidpoint] = useState(null);
    const [userMid, setUserMid] = useState(null);
    const [filterRoute, setFilterRoute] = useState({
        path: [],
        color: ``
    });
    const filterRouteRef = useRef(null);
    const simStateRef = useRef(simState);

    const polyDirectRef = useRef(null);
    const [polyDirect, setPolyDirect] = useState({
        path: [],
        tramColor: ``
    });
    const [transferDirect, setTransferDirect] = useState({
        path: [],
        tramColor: ``
    });

    const [directState, setDirectState] = useState(false);
    const [transferState, setTransferState] = useState(false);
    const [filterBtn, setFilterBtn] = useState([
        "All Stations", "Academic Building", "Institute", "Park", "Parking Lot",
        "Sports Complex", "Dormitory", "Hospital", "Exit Gate"
    ])
    const [filterMarker, setFilterMarker] = useState([]);

    const emptyRouteInfo = {
        position: null,
        distance: null,
        color: null,
        time: null
    }
    const [origin2Desti, setOrigin2Desti] = useState(emptyRouteInfo);
    const [origin2Trans, setOrigin2Trans] = useState(emptyRouteInfo);
    const [trans2Desti, setTrans2Desti] = useState(emptyRouteInfo);
    const [walking2Desti, setWalking2Desti] = useState(emptyRouteInfo);
    const [user2Desti, setUser2Desti] = useState(emptyRouteInfo);

    /*
    const emptyEventInfo = {
        imageUrl: null,
        title: null,
        startDate: null,
        endDate: null
    }
    */

    const [activeBtn, setActiveBtn] = useState("All Stations");
    const [eventHover, setEventHover] = useState(null);
    const onLoad = useCallback((mapInstance) => {
        map.current = mapInstance;
        if (map.current) {
            setMapLoaded(true);
        }
    }, []);

    const onPolyDirectLoad = useCallback((polyline) => {
        polyDirectRef.current = polyline;
        //console.log("PolyDirect Polyline loaded. Ref assigned:", polyline);
    }, []);

    const onFilterRouteLoad = useCallback((polyline) => {
        filterRouteRef.current = polyline;
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                setUser(null);
            }
            //setIslogin(true);
        });
        return () => {
            unsubscribe()
            //setIslogin(false);
        };
    }, [auth]);

    useEffect(() => {
        if (isLoaded && isMapLoaded && map.current && google) {
            map.current.setOptions({
                ...defaultOptions,
                draggable: isDrag,
            });
            map.current.setZoom(6)
            console.log("map is loaded and options set");
        } else if (isLoaded) {
            //console.log("Google Maps is loaded, but map ref is not yet available.");
        } else {
            //console.log("Google Maps is not yet loaded.");
        }
    }, [isLoaded, google, isMapLoaded, isDrag]);

    const onUnmount = React.useCallback(function callback(map) {
        //setMap(null)
        map.current = null;
    }, []);

    const getFromToIcon = (color) => {
        if (!isLoaded || !google) return null;
        const svgtoUrl = toMarkerIconUrl(color);
        const icon = {
            url: svgtoUrl,
            scaledSize: new window.google.maps.Size(50, 50),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(12, 12),
        }
        return icon;
    }
    const getTransferIcon = () => {
        if (!isLoaded || !google) return null;
        const icon = {
            url: '/transfer-icon.png',
            scaledSize: new window.google.maps.Size(60, 60),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(12, 12),
        }
        return icon;
    }

    const convertDateTime = (date) => {
        const dateObj = new Date(date);
        const localDateTimeStr = dateObj.toLocaleString();
        return localDateTimeStr;
    }
    function timeTableAddedDelay(timeString, addedTime) {
        const now = new Date();
        const [hoursStr, minutesStr] = timeString.split(':');
        const targetHours = parseInt(hoursStr, 10);
        const targetMinutes = parseInt(minutesStr, 10);

        let targetTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            targetHours,
            targetMinutes,
            0,
            0
        );
        const addedMili = addedTime * 60 * 1000;
        targetTime.setTime(targetTime.getTime() + addedMili);
        return targetTime;
    }
    function compareTime(timeString, addedTime = 0) {
        const now = new Date();
        const [hoursStr, minutesStr] = timeString.split(':');
        const targetHours = parseInt(hoursStr, 10);
        const targetMinutes = parseInt(minutesStr, 10);

        let targetTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            targetHours,
            targetMinutes,
            0,
            0
        );
        let isMore = false;
        if (addedTime !== 0) {
            const differenceMilli = Math.abs(targetTime.getTime() - addedTime.getTime());
            const differenceMinutes = differenceMilli / (1000 * 60);
            if (targetTime.getTime() > addedTime.getTime()) {
                isMore = true;
            }
            return {
                isMore: isMore,
                arrivalTime: timeString,
                wait: differenceMinutes,
                curTime: now.getTime()
            }
        }

        const differenceMilli = Math.abs(targetTime.getTime() - now.getTime());
        const differenceMinutes = differenceMilli / (1000 * 60);

        if (targetTime.getTime() > now.getTime()) {
            isMore = true;
        }
        return {
            isMore: isMore,
            arrivalTime: timeString,
            wait: differenceMinutes,
            curTime: now.getTime()
        }

    }

    function findTramTimeTable(station, color, addedTime = 0) {
        const now = new Date();
        try {
            if (station.timeTable.length !== 0) {
                console.log(station.timeTable);
                let tramList = [];
                let key;
                if (now.getDay() == 0 || now.getDay() == 6) {
                    key = 'Weekend'
                } else {
                    key = 'Weekday'
                }
                tramList = Object.keys(station.timeTable[key])
                let timeTable = [];
                for (const tramColor of tramList) {
                    if (tramColor.toLowerCase() === color) {
                        timeTable = station.timeTable[key][tramColor];
                    }
                }
                if (timeTable.length === 0) return {};
                if (timeTable.length === 1) return {};
                let tramTime;
                //main algorithm 

                for (let i = 0; i < timeTable.length; i++) {
                    tramTime = compareTime(timeTable[i], addedTime);
                    if (tramTime.isMore) {
                        return tramTime;
                    }
                } //if tram is closed return next day;
                return compareTime(timeTable[0])
            } else {
                return {};
            }
        } catch (e) {
            console.log(e);
            return {};
        }
    }


    const compareSpeed = (walkingData, tramDistance, station, color, addedTime = 0) => {
        const tramSpeedKmh = 30;
        const tramTime = (tramDistance / tramSpeedKmh) * 60;
        const walkingDistance = walkingData.routes[0].legs[0].distance.value
        const walkingReadable = walkingData.routes[0].legs[0].duration;
        const walkingTime = walkingData.routes[0].legs[0].duration.value / 60;
        let isWalking = false;
        const getTramTime = findTramTimeTable(station, color, addedTime);
        console.log(getTramTime);
        if (getTramTime && typeof getTramTime.wait === 'number') {
            if (walkingTime < tramTime + getTramTime.wait) {
                isWalking = true;
            }
            console.log("tram from scehdule result", getTramTime);
            //console.log("return data but not inportant", getTramTime);
            return {
                isWalking: isWalking,
                tramTime: {
                    text: convertMinutesToReadable(tramTime + getTramTime.wait),
                    value: tramTime + getTramTime.wait
                },
                walkingTime: walkingReadable,
                walkingDistance: walkingDistance,
                tramDistance: tramDistance.toFixed(2),
                arrivalTime: getTramTime.arrivalTime,
                color: color
            }
        } else {
            return {
                isWalking: isWalking,
                tramTime: {
                    text: convertMinutesToReadable(tramTime),
                    value: tramTime
                },
                walkingTime: walkingReadable,
                walkingDistance: walkingDistance,
                arrivalTime: 'Unscheduled',
                tramDistance: tramDistance.toFixed(2),
                color: color
            }
        }
    }
    function convertMinutesToReadable(decimalMinutes) {
        if (typeof decimalMinutes !== 'number' || isNaN(decimalMinutes) || decimalMinutes < 0) {
            return "N/A";
        }
        console.log("dec minutes ", decimalMinutes);

        const totalSeconds = Math.round(decimalMinutes * 60);

        const hours = Math.floor(totalSeconds / 3600);
        const remainingSecondsAfterHours = totalSeconds % 3600;
        const minutes = Math.floor(remainingSecondsAfterHours / 60);

        let parts = [];
        if (hours > 0) {
            parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        }
        if (minutes > 0) {
            parts.push(`${minutes} min`);
        } else {
            parts.push(`1 min`);
        }
        return parts.join(' ');
    }

    const setTramMapData = () => {
        let THRESHOLD = 0.07;
        const tempMap = new Map();
        const stationTempMap = new Map();
        for (const stop of station) {
            if (stop.id === 432) {
                continue;
            }
            const tramMapKey = stop.title;
            let routeStation = [];
            for (let i = 0; i < routeData.length; i++) {
                if (!checkIfColorMatch([routeColor[i]], stop.colors)) {
                    continue;
                }
                let coordinateIndex = 0;
                let minDistance = Infinity;
                const mapValues = {
                    tramPosition: {},
                    routePosition: {},
                    routeColor: routeColor[i],
                    routeIndex: 0,
                    routeColorIndex: i,
                    title: stop.title
                }
                for (const position of routeData[i]) {
                    const currentDistance = calculateDistance(
                        position.lat,
                        position.lng,
                        stop.position.lat,
                        stop.position.lng,
                    )
                    if (currentDistance < minDistance &&
                        currentDistance < THRESHOLD) {
                        minDistance = currentDistance;
                        mapValues.tramPosition = stop.position;
                        mapValues.routePosition = position;
                        mapValues.routeIndex = coordinateIndex;
                    }
                    coordinateIndex++;
                }
                if (minDistance !== Infinity)
                    routeStation.push(mapValues);
            }
            tempMap.set(tramMapKey, routeStation);
            stationTempMap.set(tramMapKey, stop);
        }
        setTramMap(tempMap);
        setStationMap(stationTempMap);
    }

    const calculateDistanceGoogle = (from, to) => {
        return new Promise((resolve, reject) => {
            if (!isLoaded || !google) {
                console.log("google not loaded");
                reject(new Error("Google Maps API not loaded."));
                return;
            }
            //console.log("from ", from);
            const service = new window.google.maps.DirectionsService();
            service.route(
                {
                    origin: from,
                    destination: to,
                    travelMode: window.google.maps.TravelMode.WALKING,
                },
                (response, status) => {
                    if (status === 'OK') {
                        resolve(response);
                    } else {
                        reject(new Error("Failed to get directions"));
                    }
                }
            );
        });
    }
    const generateDirectionPolyLine = (route, startIndex, endIndex, color) => {
        let totalDistance = 0;
        let path = [];
        for (let i = startIndex; i < endIndex; i++) {
            if (!route[i] || !route[i + 1]) continue;
            const currentDistance = calculateDistance(
                route[i].lat,
                route[i].lng,
                route[i + 1].lat,
                route[i + 1].lng,
            )
            path.push(route[i]);
            totalDistance += currentDistance
        }
        if (route[endIndex]) {
            path.push(route[endIndex]);
        }
        return {
            path: path,
            distance: totalDistance,
            color: color
        }
    }
    const generateDirectionCombi = (startData, endData) => {
        let candidate = [];
        for (const originTram of startData) {
            for (const destiTram of endData) {
                if (originTram.routeColor === destiTram.routeColor) {
                    if (originTram.routeIndex <= destiTram.routeIndex) {
                        const data = generateDirectionPolyLine(
                            routeData[originTram.routeColorIndex],
                            originTram.routeIndex,
                            destiTram.routeIndex,
                            originTram.routeColor,
                        )
                        data.startStation = originTram.title;
                        data.endStation = destiTram.title;
                        candidate.push(data);
                    } else {
                        const toStart = generateDirectionPolyLine(
                            routeData[originTram.routeColorIndex],
                            originTram.routeIndex,
                            routeData[originTram.routeColorIndex].length - 1,
                            originTram.routeColor
                        );
                        const toDesti = generateDirectionPolyLine(
                            routeData[originTram.routeColorIndex],
                            0,
                            destiTram.routeIndex,
                            originTram.routeColor
                        );
                        const combineCandidate = {
                            path: toStart.path.concat(toDesti.path),
                            distance: toStart.distance + toDesti.distance,
                            color: toStart.color
                        };
                        combineCandidate.startStation = originTram.title;
                        combineCandidate.endStation = destiTram.title;
                        candidate.push(combineCandidate);
                    }
                }
            }
        }
        return candidate;
    }
    const findLeastCandidate = (candidate) => {
        let minDistance = Infinity;
        let minCandidate = {}
        for (const data of candidate) {
            if (data.distance < minDistance) {
                minDistance = data.distance;
                minCandidate = data;
            }
        }
        return minCandidate;
    }
    const generateDistancePopup = (data, time) => {
        const midpoint = Math.round((data.path.length / 2) * 0.25);
        const formatTime = time.split(" ")[0] + " min";
        //console.log(popUpTime);
        return {
            position: data.path[midpoint],
            distance: data.distance.toFixed(2) + ' km',
            color: data.color,
            time: formatTime
        }
    }

    const findNearestRoute = (from, to) => {
        const startData = tramMap.get(from);
        const endData = tramMap.get(to);
        //console.log(tramMap);
        //console.log(startData);
        //console.log(endData);
        let candidate = []
        candidate = generateDirectionCombi(startData, endData);

        if (candidate.length == 0) {
            let transferCandidate = [];
            let originColors = [];
            let destiColors = [];
            for (const data of startData) {
                originColors.push(data.routeColor);
            }
            for (const data of endData) {
                destiColors.push(data.routeColor);
            }

            for (const stop of station) {
                if (stop.id !== 432) {
                    if (checkIfColorMatch(originColors, stop.colors) &&
                        checkIfColorMatch(stop.colors, destiColors) &&
                        to !== stop.title) {
                        transferCandidate.push(tramMap.get(stop.title));
                    }
                }
            }
            let org2tran = [];
            let tran2desti = [];
            for (const transferData of transferCandidate) {
                const o2t = generateDirectionCombi(startData, transferData);
                org2tran.push(...o2t)
                const t2d = generateDirectionCombi(transferData, endData);
                tran2desti.push(...t2d);
            }
            let o2tPoly;
            let t2dPoly;
            let minDistance = Infinity;
            for (const o of org2tran) {
                for (const t of tran2desti) {
                    if (o.endStation === t.startStation) {
                        const combinedDistance = o.distance + t.distance;
                        if (combinedDistance < minDistance) {
                            o2tPoly = o;
                            t2dPoly = t;
                            minDistance = combinedDistance;
                        }
                    }
                }
            }
            candidate.push(o2tPoly);
            candidate.push(t2dPoly);

            console.log("all candidate ", candidate)
            return candidate;
        } else {
            const leastCandidate = findLeastCandidate(candidate);
            return leastCandidate;
        }
    }

    const checkIfColorMatch = (arr1, arr2) => {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
        return arr1.some(item1 =>
            arr2.some(item2 =>
                typeof item1 === 'string' &&
                typeof item2 === 'string' &&
                item1.toLowerCase() === item2.toLowerCase()
            )
        );
    };
    const updateRouteSim = async (color, routePath, id, pathIndex) => {
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        let tragetId = `test_${color}1`;
        console.log(pathIndex, routePath.length);
        while (simStateRef.current) {
            if (pathIndex == routePath.length - 1) {
                pathIndex = 0;
            }
            try {
                for (let i = pathIndex; i < routePath.length; i++) {
                    if (!simState) break;
                    const data = {
                        color: color,
                        pathIndex: i,
                        latitude: routePath[i].lat,
                        longitude: routePath[i].lng,
                    }
                    //console.log(data, id);
                    const create = await editFromDb(data, "tram_location", tragetId);
                    await delay(200);
                    //console.log("data sim update successfully");
                    if (!simStateRef.current) break;
                }
                pathIndex = 0;
            } catch (e) {
                console.log(e);
                setSimState(false);
            }
        }
    }
    const startRouteSim = async () => {
        try {
            const getRoute = await fetchFromDb("adminRoutes");
            if (getRoute) {
                console.log(getRoute);
                const routeData = [];
                for (const routeObject of getRoute) {
                    const routePath = Object.values(routeObject);
                    let color = routePath.pop();
                    console.log(color);
                    const data = {
                        color: color,
                        path: routePath
                    }
                    routeData.push(data);
                }
                const getRecentLocation = await fetchFromDb("tram_location");
                console.log(getRecentLocation);
                if (getRecentLocation.length > 0) {
                    for (let i = 1; i < getRecentLocation.length; i++) {
                        const pathIndex = getRecentLocation[i].pathIndex;
                        updateRouteSim(routeData[i - 1].color, routeData[i - 1].path, routeData[i - 1].color, pathIndex)
                    }
                } else {
                    alert("database has change please check agian")
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
    useEffect(() => {
        simStateRef.current = simState;
    }, [simState]);

    useEffect(() => {
        if (simState) {
            startRouteSim();
        }
    }, [simState]);

    const getUserLocation = () => {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userPosition = {
                            //lat: 13.79652113581414,
                            //lng: 100.3204099659574          
                             lat: position.coords.latitude, 
                             lng: position.coords.longitude    
                        };
                        resolve(userPosition);
                    },
                    (error) => {
                        console.log(error);
                        reject(error);
                    }
                );
            } else {
                reject("cant get user position");
                alert("navigator not supported by this browser, cannot set user location");
            }
        })
    }
    const loadEventMarker = async () => {
        let eventArr = [];
        try {
            const event = await fetchFromDb("events");
            if (event) {
                const eventIcon = eventIconUrl("#FDDA0D");
                //console.log(event);
                for (const marker of event) {
                    if (marker.status === 'active') {
                        eventArr.push({
                            id: marker.id,
                            title: marker.name,
                            imageUrl: marker.imageUrl,
                            startDate: marker.startDate,
                            endDate: marker.endDate,
                            icon: {
                                url: eventIcon,
                                scaledSize: new google.maps.Size(35, 35),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(18, 18),
                            },
                            position: marker.location
                        });
                    }
                }
                //console.log(eventArr);
                setMarkerEvent(eventArr);
            }
        } catch (e) {
            console.log(e);
        }
    }
    const filterPlace = async (category) => {
        //console.log("category selected ", category);
        setActiveBtn(category);
        if (category == 'All Stations') {
            setMarker(filterMarker);
        } else {
            let filteredData = [];
            for (const data of filterMarker) {
                //console.log("all data ", data);
                if (data.hasOwnProperty('category')) {
                    const catData = Object.values(data.category);
                    //console.log("data cat ", catData);
                    if (catData.includes(category)) {
                        filteredData.push(data);
                        //console.log("found", data);
                    }
                }
            }
            setMarker(filteredData);
        }
    }

    const loadMarker = async () => {
        let markerArr = [];
        let tramStation = [];
        try {
            const station = await fetchFromDb("stations");
            if (station) {
                //console.log(station);
                for (const marker of station) {
                    markerArr.push({
                        id: marker.id,
                        title: marker.nameEn,
                        imageUrl: marker.imageUrl,

                        icon: {
                            url: "/tram-icon.png",
                            scaledSize: new google.maps.Size(35, 35),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(18, 18),
                        },
                        image: marker.image,
                        timeTable: marker.Timetable ? marker.Timetable : {},
                        colors: Object.values(marker.colors),
                        category: Object.values(marker.category),
                        Buildings: { ...marker.Buildings },
                        position: {
                            lat: marker.lat,
                            lng: marker.lng,
                        },
                    });
                }
                tramStation = markerArr;
                //console.log(tramStation);
            }

            const userPosition = await getUserLocation();
            if (userPosition) {
                setUserLocation(userPosition);
                //const nearestStation = findNearestTramStop(userPosition, tramStation);
                //setNearLocation(nearestStation);
                const userIcon = userIconToUrl("Black");
                markerArr.push({
                    id: 432,
                    title: "Current Position",
                    position: userPosition,
                    icon: {
                        url: userIcon,
                        scaledSize: new google.maps.Size(40, 40),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(20, 20),
                    }
                });
            }
            setStation(tramStation);
            setMarker(markerArr);
            setFilterMarker(markerArr);
        }
        catch (e) {
            console.log(e);
        }
    }
    const getLiveTram = async () => {
        try {
            const tram = await fetchFromDb("tram_location");
            //console.log(tram);
            if (tram) {
                let tramMarker = [];
                for (const data of tram) {
                    if ('latitude' in data && 'longitude' in data) {
                        const carLogo = toMarkerIconUrl(data.color);
                        tramMarker.push({
                            id: data.id,
                            title: data.id,
                            position: {
                                lat: data.latitude,
                                lng: data.longitude
                            },
                            icon: {
                                url: carLogo,
                                scaledSize: new google.maps.Size(30, 30),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(20, 20),
                            }
                        });
                    }
                }
                setLiveTram(tramMarker);
            }
        } catch (e) {
            alert("failed to get tram location");
        }
    }
    const getRouteData = async () => {
        try {
            const getRoute = await fetchFromDb("adminRoutes");
            if (getRoute) {
                //console.log(getRoute);
                let routeFormat = [];
                let routeColorFormat = [];
                for (const routeObject of getRoute) {
                    const routePath = Object.values(routeObject);
                    const color = routePath.pop();
                    routeColorFormat.push(color);
                    routeFormat.push(routePath);
                }
                setRouteColor(routeColorFormat);
                setRouteData(routeFormat);
            }
        } catch (e) {
            console.log(e);
        }
    }
    const setWalkingWaypoint = (userWaypoint, displayData, start, end) => {
        const walkingInfo = { ...emptyRouteInfo };
        walkingInfo.distance = displayData.walkingDistance;
        walkingInfo.color = 'blue';
        walkingInfo.time = displayData.walkingTime.text;
        setWalking2Desti(walkingInfo);
        setDirection(userWaypoint);
        setMidpoint(findMidpoint(
            start,
            end
        ))
    }
    const setUserToTramWaypoint = (userWaypoint, userPos, goToStation) => {
        //console.log(userWaypoint.routes[0].legs[0].duration);
        const walkingInfo = { ...emptyRouteInfo };
        walkingInfo.distance = userWaypoint.routes[0].legs[0].distance.value;
        walkingInfo.color = 'orange';
        walkingInfo.time = userWaypoint.routes[0].legs[0].duration.text;
        setUser2Desti(walkingInfo);
        setDirectionsUserToTram(userWaypoint);
        //console.log(findMidpoint(userPos, goToStation));
        /*
        setUserMid(findMidpoint(
            userPos,
            goToStation
        )
        */
        setUserMid(userPos);

        return userWaypoint.routes[0].legs[0].duration.value / 60;
    }
    const findMidpoint = (origin, destination) => {
        const fraction = 0.5;
        const lat = origin.lat + (destination.lat - origin.lat) * fraction;
        const lng = origin.lng + (destination.lng - origin.lng) * fraction;
        return { lat, lng }
    }
    useEffect(() => {
        if (routeData.length && station.length) {
            setTramMapData();
        }
    }, [routeData, station]);
    const showDirection = async () => {
        if (toMarker.title == "Current Position" ||
            fromMarker.title == "Current Position") {
            if (toMarker.title == "Current Position") {
                setToMarker(null);
                resetAllData();
                alert("Invalid Choice");
                return;
            }
            if(toMarker.title == "Current Position" && fromMarker.title == "Current Position"){
                setToMarker(null);
                setFromMarker(null);
                resetAllData();
                alert("Invalid Choice");
                return;
            }
        }
        try {
            if (fromMarker.title == "Current Position") {
                let displaceStationMap = new Map();
                let displaceArr = [];
                for (let i = 0; i < station.length; i++) {
                    if (station[i].id === 432) continue;
                    let displace = calculateDistance(
                        userLocation.lat,
                        userLocation.lng,
                        station[i].position.lat,
                        station[i].position.lng
                    )
                    let formatDeci = displace.toFixed(2);
                    let floatVal = parseFloat(formatDeci);
                    displaceArr.push(floatVal);
                    displaceStationMap.set(floatVal, station[i].title);
                }

                displaceArr.sort();
                let limit = 4;
                let candidate = []
                for (let i = 0; i < limit; i++) {
                    candidate.push(displaceStationMap.get(displaceArr[i]));
                }
                console.log(candidate);
                const leastCandi = [];
                for (let i = 0; i < limit; i++) {
                    const data = findNearestRoute(candidate[i], toMarker.title);
                    leastCandi.push(data);
                }
                console.log(leastCandi);
                let leastRoute = {
                    distance: Infinity,
                    data: []
                }
                for (let i = 0; i < leastCandi.length; i++) {
                    let totalDistance = 0;
                    const currentRoute = leastCandi[i];
                    if (currentRoute.length > 0) {
                        for (let j = 0; j < currentRoute.length; j++) {
                            totalDistance += currentRoute[j].distance;
                        }
                    } else {
                        totalDistance += currentRoute.distance;
                    }
                    //console.log("route ", currentRoute);
                    //console.log(totalDistance, leastRoute.distance)
                    if (totalDistance <= leastRoute.distance) {
                        leastRoute.distance = totalDistance;
                        leastRoute.data = currentRoute;
                    }
                }
                const data = leastRoute.data;
                const userPos = {
                    lat: userLocation.lat,
                    lng: userLocation.lng
                }
                if (data.length > 0) {
                    const goToStation = stationmap.get(data[0].startStation);
                    const walkingUser2Tram = await calculateDistanceGoogle(userPos, goToStation.position);
                    const delayedTime = setUserToTramWaypoint(walkingUser2Tram,
                        userPos,
                        goToStation
                    );
                    const walkingData = await calculateDistanceGoogle(userPos, toMarker.position);
                    const o2d = compareSpeed(walkingData, data[0].distance, fromMarker, data[0].color, delayedTime);

                    const transferStation = stationmap.get(data[1].startStation);
                    const transfer = await calculateDistanceGoogle(transferStation.position, toMarker.position);
                    const t2d = compareSpeed(transfer, data[1].distance, transferStation, data[1].color, o2d.tramTime.value);
                    //console.log("transfer to destination ", t2d);
                    const getTotalTime = convertMinutesToReadable(o2d.tramTime.value + t2d.tramTime.value)
                    setTime(getTotalTime);
                    let tramDistance = data[0].distance + data[1].distance;

                    const o2dInfo = generateDistancePopup(data[0], o2d.tramTime.text);
                    const t2dInfo = generateDistancePopup(data[1], t2d.tramTime.text);
                    //console.log(o2dInfo);
                    setOrigin2Desti(o2dInfo);
                    setTrans2Desti(t2dInfo);
                    setTransferStation(transferStation);
                    const polyData = {
                        tramColor: data[0].color,
                        path: data[0].path
                    };

                    const transferData = {
                        tramColor: data[1].color,
                        path: data[1].path
                    };

                    setPolyDirect(polyData);
                    setDirectState(true);
                    setTransferDirect(transferData);
                    setTransferState(true);
                    ///
                    ///
                    //const walkingInfo = { ...emptyRouteInfo };
                    if (o2d.isWalking || t2d.isWalking) {
                        if (o2d.isWalking) {
                            setWalkingWaypoint(walkingData,
                                o2d,
                                userPos,
                                toMarker.position
                            );
                        } else if (t2d.isWalking) {
                            setWalkingWaypoint(transfer,
                                t2d,
                                transferStation.position,
                                toMarker.position
                            );
                        }
                    }
                    if (o2d.isWalking && t2d.isWalking) t2d.isWalking = false
                    setResult([o2d, t2d]);
                    //console.log(result);
                    setDistance(tramDistance.toFixed(2));
                    setFromMarker(goToStation);
                } else {
                    //console.log("1 info only");
                    const goToStation = stationmap.get(data.startStation);
                    const walkingUser2Tram = await calculateDistanceGoogle(userPos, goToStation.position);
                    const delayedTime = setUserToTramWaypoint(
                        walkingUser2Tram,
                        userPos,
                        goToStation.position
                    );
                    const walkingUser2Desti = await calculateDistanceGoogle(userPos, toMarker.position);
                    const u2d = compareSpeed(walkingUser2Desti, data.distance, fromMarker, data.colorm, delayedTime);
                    setTime(u2d.tramTime.text);

                    if (u2d.isWalking) {
                        setWalkingWaypoint(walkingUser2Desti,
                            u2d,
                            userPos,
                            toMarker.position
                        );
                    }
                    //console.log("User to Tram:", walkingUser2Tram.routes[0]);
                    //console.log("User to Desti:", walkingUser2Desti.routes[0]);

                    const u2dInfo = generateDistancePopup(data, u2d.tramTime.text);
                    setOrigin2Desti(u2dInfo);
                    const polyData = {
                        tramColor: data.color,
                        path: data.path
                    }
                    setResult([u2d]);
                    //console.log(result);
                    setPolyDirect(polyData);
                    setDistance(data.distance.toFixed(2));
                    setDirectState(true);
                    setFromMarker(goToStation);
                }
            } else {

                const data = findNearestRoute(fromMarker.title, toMarker.title);
                console.log(data);
                //console.log(getDistance);
                if (data.length > 0) {
                    const walkingData = await calculateDistanceGoogle(fromMarker.position, toMarker.position);
                    //console.log(walkingData);
                    const o2d = compareSpeed(walkingData, data[0].distance, fromMarker, data[0].color);
                    //console.log("origin to destination ", o2d);

                    const transferStation = stationmap.get(data[1].startStation);
                    const transfer = await calculateDistanceGoogle(transferStation.position, toMarker.position);
                    const delayTime = timeTableAddedDelay(
                        o2d.arrivalTime,
                        o2d.tramTime.value
                    )
                    const t2d = compareSpeed(transfer, data[1].distance, transferStation, data[1].color, delayTime);
                    console.log("transfer to destination ", t2d);
                    const getTotalTime = convertMinutesToReadable(o2d.tramTime.value + t2d.tramTime.value)
                    setTime(getTotalTime);
                    let tramDistance = data[0].distance + data[1].distance;

                    const o2dInfo = generateDistancePopup(data[0], o2d.tramTime.text);
                    const t2dInfo = generateDistancePopup(data[1], t2d.tramTime.text);
                    setOrigin2Desti(o2dInfo);
                    setTrans2Desti(t2dInfo);
                    setTransferStation(transferStation);
                    const polyData = {
                        tramColor: data[0].color,
                        path: data[0].path
                    };

                    const transferData = {
                        tramColor: data[1].color,
                        path: data[1].path
                    };

                    setPolyDirect(polyData);
                    setDirectState(true);
                    setTransferDirect(transferData);
                    setTransferState(true);
                    const walkingInfo = { ...emptyRouteInfo };
                    if (o2d.isWalking || t2d.isWalking) {
                        if (t2d.isWalking) {
                            walkingInfo.distance = t2d.walkingDistance;
                            walkingInfo.color = 'blue';
                            walkingInfo.time = t2d.walkingTime.text;
                            setDirection(transfer);
                            setMidpoint(findMidpoint(
                                transferStation.position,
                                toMarker.position
                            ))
                        }
                        if (o2d.isWalking) {
                            walkingInfo.distance = o2d.walkingDistance;
                            walkingInfo.color = 'blue';
                            walkingInfo.time = o2d.walkingTime.text;
                            setDirection(walkingData);
                            setMidpoint(findMidpoint(
                                fromMarker.position,
                                toMarker.position
                            ))

                        }
                        if (o2d.isWalking && t2d.isWalking) t2d.isWalking = false
                        setWalking2Desti(walkingInfo);
                        console.log(walkingInfo)
                    }
                    setResult([o2d, t2d]);
                    setDistance(tramDistance.toFixed(2));
                } else {
                    const walkingData = await calculateDistanceGoogle(fromMarker.position, toMarker.position);
                    const o2d = compareSpeed(walkingData, data.distance, fromMarker, data.color);
                    setTime(o2d.tramTime.text);
                    ////
                    const o2dInfo = generateDistancePopup(data, o2d.tramTime.text);
                    console.log(o2dInfo);
                    setOrigin2Desti(o2dInfo);
                    const polyData = {
                        tramColor: data.color,
                        path: data.path
                    }
                    if (o2d.isWalking) {
                        const walkingInfo = { ...emptyRouteInfo };
                        walkingInfo.distance = o2d.walkingDistance;
                        walkingInfo.color = 'blue';
                        walkingInfo.time = o2d.walkingTime.text;
                        setWalking2Desti(walkingInfo);
                        setDirection(walkingData);
                        setMidpoint(findMidpoint(
                            fromMarker.position,
                            toMarker.position
                        ))
                    }
                    setResult([o2d]);
                    setPolyDirect(polyData);
                    setDistance(data.distance.toFixed(2));
                    setDirectState(true);
                }
            }
        } catch (e) {
            setDirection(null);
            setDistance(null);
            setTime(null);
            setDirectionsUserToTram(null);
            console.log(e);
            alert("Failed to calculate disatance ", e);
        }
    }
    /*
    useEffect(() => {
        console.log("direction state", directState);
    }, [directState]);
    */
    useEffect(() => {
        if (isLoaded && google && isMapLoaded && map.current) {
            loadMarker();
            loadEventMarker();
            getRouteData();
            const tramInterval = setInterval(() => {
                getLiveTram();
                //console.log("getting");
            }, 1000);
            return () => clearInterval(tramInterval);

        }
    }, [isLoaded, google, isMapLoaded, map.current]);

    useEffect(() => {
        //console.log("all station", station);
    }, [station]);


    useEffect(() => {
        if (fromMarker && toMarker && isMapLoaded) {
            if (!isLoaded || !window.google?.maps) {
                console.log("direction api not avaiable");
                return
            };
            showDirection();
            //console.log("show direction is called");
        }
    }, [fromMarker, toMarker, isMapLoaded]);
    const resetAllData = () => {
        setDistance(null);
        setTransferState(false);
        setDirection(null);
        setDirectionsUserToTram(null);
        setDirectState(false);
        setResult([]);
        setTime(null);
        setTransferStation(null);
        setMidpoint(null);
        setUserMid(null);
        const resetPolyDirect = {
            path: [],
            tramColor: ``,
        }
        setPolyDirect(resetPolyDirect);
        setTransferDirect(resetPolyDirect);
        setOrigin2Desti(emptyRouteInfo);
        setOrigin2Trans(emptyRouteInfo);
        setTrans2Desti(emptyRouteInfo);
        setWalking2Desti(emptyRouteInfo);
        setUser2Desti(emptyRouteInfo);
    }
    const handleRemoveToMarker = () => {
        setToMarker(null);
        resetAllData();
    }

    const handleRemoveFromMarker = () => {
        setFromMarker(null);
        resetAllData();
    }
    /*
            useEffect(() => {
            console.log("polyDirect changed:", polyDirect);
        }, [polyDirect]);
    */

    const handleSelectFromMarker = (selectedMarker) => {
        setFromMarker(selectedMarker);
    };

    const handleSelectToMarker = (selectedMarker) => {
        setToMarker(selectedMarker);
    };

    const clickMarker = (marker) => {
        if (!fromMarker) {
            setFromMarker(marker);
        } else if (!toMarker) {
            setToMarker(marker);
        }
    }

    const toggleDrag = () => {
        console.log(isDrag);
        if (isDrag) {
            setDrag(false)
            map.current.setOptions({
                ...defaultOptions,
                draggable: false,
            });
        } else {
            setDrag(true);
            map.current.setOptions({
                draggable: true,
                zoom: 1,
                restriction: null,
            });

        }
    }
    const toggleRoute = () => {
        setShowRoute(!showRoute);
        if (!showRoute) {
            const routeObj = {
                path: [],
                color: ``
            }
            setFilterRoute(routeObj)
        }
    }

    const handleShowRouteColor = (color) => {
        const routeObj = {
            path: [],
            color: ``
        }
        for (let i = 0; i < routeColor.length; i++) {
            if (color == routeColor[i]) {
                routeObj.path = routeData[i];
                routeObj.color = routeColor[i];
                setFilterRoute(routeObj)
            }
        }
    }

    const handleMouseHoverEvent = (event) => {
        console.log(event);
        setEventHover({
            title: event.title,
            imageUrl: event.imageUrl,
            startDate: event.startDate,
            endDate: event.endDate,
            position: event.position
        })

    }
    const handleMouseOutEvent = () => {
        setEventHover(null);
    }

    return (
        <div className="map-component">
            {isLoaded && google && (
                <>
                    <div className={`route-btn-container ${showRoute? `active` : ``}`}>
                        <button className={`show-route`} onClick={() => { toggleRoute() }}>{showRoute ? `Hide Route` : `Show Route`}</button>
                        {showRoute && routeColor.map((color, index) => (
                            <svg onClick={() => handleShowRouteColor(color)} key={`tram-${index}`} xmlns="http://www.w3.org/2000/svg" 
                            className="tram-color hover-big" viewBox="0 0 448 512">
                                <path fill={color} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
                        ))}
                    </div>
                    {user &&
                        <button className="simu" onClick={() => { setSimState(!simState) }}>{simState ? `Stop simulation` : `Start simulation`}</button>}
                    <div className="filter-btn-container">
                        {filterBtn.length > 0 && filterBtn.map((data) => (
                            <button className={`filter-station-btn ${activeBtn === data? `active`: ``}`} 
                            key={data} value={data} onClick={() => filterPlace(data)}>{data}</button>
                        ))}
                    </div>
                    {!isDrag && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" onClick={() => toggleDrag()} className="lock-map-icon">
                        <path d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z" /></svg>}
                    {isDrag && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" onClick={() => toggleDrag()} className="lock-map-icon">
                        <path d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z" /></svg>}
                    <GoogleMap mapContainerClassName="map-container"
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                    >
                        {fromMarker && <Marker
                            key={fromMarker.id}
                            icon={{
                                url: '/origin-icon.png',
                                scaledSize: new window.google.maps.Size(60, 60) // Adjust width and height as needed
                            }}
                            position={fromMarker.position}
                            title={fromMarker.title}
                            onClick={() => clickMarker(fromMarker)}
                        />}
                        {toMarker && <Marker
                            key={toMarker.id}
                            icon={{
                                url: '/desti-icon.png',
                                scaledSize: new window.google.maps.Size(60, 60) // Adjust width and height as needed
                            }}
                            position={toMarker.position}
                            title={toMarker.title}
                            onClick={() => clickMarker(toMarker)}
                        />}
                        {transferStation && <Marker
                            key={transferStation.id}
                            icon={getTransferIcon()}
                            position={transferStation.position}
                            title={transferStation.title}
                        />}


                        {/*{nearStation && <Marker key={nearStation.id} position={nearStation.position} title={nearStation.title} />}*/}
                        {(walking2Desti && direction &&
                            <InfoWindow position={midpoint}
                                onCloseClick={() => setWalking2Desti(emptyRouteInfo)}>
                                <div className={`popup-route-info black-border`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="popup-tram-icon" viewBox="0 0 320 512">
                                        <path fill={walking2Desti.color} d="M160 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM126.5 199.3c-1 .4-1.9 .8-2.9 1.2l-8 3.5c-16.4 7.3-29 21.2-34.7 38.2l-2.6 7.8c-5.6 16.8-23.7 25.8-40.5 20.2s-25.8-23.7-20.2-40.5l2.6-7.8c11.4-34.1 36.6-61.9 69.4-76.5l8-3.5c20.8-9.2 43.3-14 66.1-14c44.6 0 84.8 26.8 101.9 67.9L281 232.7l21.4 10.7c15.8 7.9 22.2 27.1 14.3 42.9s-27.1 22.2-42.9 14.3L247 287.3c-10.3-5.2-18.4-13.8-22.8-24.5l-9.6-23-19.3 65.5 49.5 54c5.4 5.9 9.2 13 11.2 20.8l23 92.1c4.3 17.1-6.1 34.5-23.3 38.8s-34.5-6.1-38.8-23.3l-22-88.1-70.7-77.1c-14.8-16.1-20.3-38.6-14.7-59.7l16.9-63.5zM68.7 398l25-62.4c2.1 3 4.5 5.8 7 8.6l40.7 44.4-14.5 36.2c-2.4 6-6 11.5-10.6 16.1L54.6 502.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L68.7 398z" /></svg>
                                    <h3>{walking2Desti.time}</h3>
                                    <h4>{walking2Desti.distance} m</h4>
                                </div>
                            </InfoWindow>
                        )}
                        {(user2Desti && directionsUserToTram &&
                            <InfoWindow position={userMid}
                                onCloseClick={() => setUser2Desti(emptyRouteInfo)}>
                                <div className={`popup-route-info black-border`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="popup-tram-icon" viewBox="0 0 320 512">
                                        <path fill={user2Desti.color} d="M160 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM126.5 199.3c-1 .4-1.9 .8-2.9 1.2l-8 3.5c-16.4 7.3-29 21.2-34.7 38.2l-2.6 7.8c-5.6 16.8-23.7 25.8-40.5 20.2s-25.8-23.7-20.2-40.5l2.6-7.8c11.4-34.1 36.6-61.9 69.4-76.5l8-3.5c20.8-9.2 43.3-14 66.1-14c44.6 0 84.8 26.8 101.9 67.9L281 232.7l21.4 10.7c15.8 7.9 22.2 27.1 14.3 42.9s-27.1 22.2-42.9 14.3L247 287.3c-10.3-5.2-18.4-13.8-22.8-24.5l-9.6-23-19.3 65.5 49.5 54c5.4 5.9 9.2 13 11.2 20.8l23 92.1c4.3 17.1-6.1 34.5-23.3 38.8s-34.5-6.1-38.8-23.3l-22-88.1-70.7-77.1c-14.8-16.1-20.3-38.6-14.7-59.7l16.9-63.5zM68.7 398l25-62.4c2.1 3 4.5 5.8 7 8.6l40.7 44.4-14.5 36.2c-2.4 6-6 11.5-10.6 16.1L54.6 502.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L68.7 398z" /></svg>
                                    <h3>{user2Desti.time}</h3>
                                    <h4>{user2Desti.distance} m</h4>
                                </div>
                            </InfoWindow>
                        )}
                        {(origin2Desti.distance &&
                            <InfoWindow position={origin2Desti.position}
                                onCloseClick={() => setOrigin2Desti(emptyRouteInfo)}>
                                <div className={`popup-route-info ${origin2Desti.color}-border`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="popup-tram-icon" viewBox="0 0 448 512">
                                        <path fill={origin2Desti.color} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
                                    <h3>{origin2Desti.time}</h3>
                                    <h4>{origin2Desti.distance}</h4>
                                </div>
                            </InfoWindow>
                        )}
                        {(origin2Trans.distance &&
                            <InfoWindow position={origin2Trans.position}
                                onCloseClick={() => setOrigin2Trans(emptyRouteInfo)}>
                                <div className={`popup-route-info ${origin2Trans.color}-border`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="popup-tram-icon" viewBox="0 0 448 512">
                                        <path fill={origin2Trans.color} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
                                    <h3>{origin2Trans.time}</h3>
                                    <h4>{origin2Trans.distance}</h4>
                                </div>
                            </InfoWindow>
                        )}
                        {(trans2Desti.distance &&
                            <InfoWindow position={trans2Desti.position}
                                onCloseClick={() => setTrans2Desti(emptyRouteInfo)}>
                                <div className={`popup-route-info ${trans2Desti.color}-border`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="popup-tram-icon" viewBox="0 0 448 512">
                                        <path fill={trans2Desti.color} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
                                    <h3>{trans2Desti.time}</h3>
                                    <h4>{trans2Desti.distance}</h4>
                                </div>
                            </InfoWindow>
                        )}

                        {direction &&
                            <DirectionsRenderer directions={direction}
                                key='origin-direct'
                                options={{
                                    polylineOptions: {
                                        strokeColor: 'transparent',
                                        strokeOpacity: 0,
                                        strokeWeight: 0,
                                        icons: [
                                            {
                                                icon: {
                                                    path: google.maps.SymbolPath.CIRCLE,
                                                    scale: 3,
                                                    strokeColor: 'black',
                                                    fillColor: 'black',
                                                    fillOpacity: 1,
                                                    strokeWeight: 0
                                                },
                                                offset: '0%',
                                                repeat: '10px'
                                            }
                                        ],
                                        zIndex: 2
                                    },
                                    suppressMarkers: true
                                }}
                            />}
                        {directionsUserToTram &&
                            <DirectionsRenderer directions={directionsUserToTram}
                                key='user-direct'
                                options={{
                                    polylineOptions: {
                                        strokeColor: 'transparent',
                                        strokeOpacity: 0,
                                        strokeWeight: 0,
                                        icons: [
                                            {
                                                icon: {
                                                    path: google.maps.SymbolPath.CIRCLE,
                                                    scale: 3,
                                                    strokeColor: 'orange',
                                                    fillColor: 'orange',
                                                    fillOpacity: 1,
                                                    strokeWeight: 0
                                                },
                                                offset: '0%',
                                                repeat: '10px'
                                            }
                                        ],
                                        zIndex: 2
                                    },
                                    suppressMarkers: true
                                }}
                            />}
                        <Polyline
                            key='tramData'
                            path={polyDirect.path}
                            onLoad={onPolyDirectLoad}
                            options={PolylineOptions(polyDirect.tramColor, directState)}
                        />
                        <Polyline
                            key='transData124'
                            path={transferDirect.path}
                            onLoad={onPolyDirectLoad}
                            options={PolylineOptions(transferDirect.tramColor, transferState)}
                        />
                        <Polyline
                            key={`poly`}
                            path={filterRoute.path}
                            onLoad={onFilterRouteLoad}
                            options={PolylineOptions(filterRoute.color, showRoute)}
                        />

                        {(!fromMarker || !toMarker) && markers.map((marker) => (
                            <Marker
                                className="marker-icon"
                                key={marker.id}
                                position={marker.position}
                                icon={marker.icon}
                                title={marker.title}
                                onClick={() => clickMarker(marker)}
                                onMouseOver={() => setHoverMarker(marker)}
                                onMouseOut={() => setHoverMarker(removePopup)}
                            />
                        ))}
                        {hoverMarker.title != '' && !toMarker && (
                            <InfoWindow
                                position={hoverMarker.position}
                                onCloseClick={() => setHoverMarker(removePopup)}
                                onMouseOut={() => setHoverMarker(removePopup)}
                            >
                                <div className="marker-popup">
                                    <img src={hoverMarker.image} />
                                    <strong>{hoverMarker.title}</strong>
                                    <div className="tram-color-container">

                                        {hoverMarker.colors?.length > 0 &&
                                            hoverMarker.colors.map((data, index) => (
                                                <svg key={`popoup${index}`} xmlns="http://www.w3.org/2000/svg" className="popup-tram-color" viewBox="0 0 448 512">
                                                    <path fill={data} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
                                            ))}
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                        {user && liveTram.length > 0 && liveTram.map((marker) => (
                            <Marker
                                className="marker-icon"
                                key={marker.id}
                                icon={marker.icon}
                                position={marker.position}
                                title={marker.title}
                            />
                        ))}
                        {(eventHover &&
                            <InfoWindow position={eventHover.position}
                                onCloseClick={() => setEventHover(null)}
                            >
                                <div class="popup-event-info">
                                    <img src={eventHover.imageUrl} />
                                    <h2>{eventHover.title}</h2>
                                    <h3> Start: {convertDateTime(eventHover.startDate)}</h3>
                                    <h3> End: {convertDateTime(eventHover.endDate)}</h3>
                                </div>
                            </InfoWindow>
                        )}
                        {eventMarker.length > 0 && eventMarker.map((marker) => (
                            <Marker
                                className="marker-icon"
                                key={marker.id}
                                icon={marker.icon}
                                position={marker.position}
                                title={marker.title}
                                onMouseOver={() => handleMouseHoverEvent(marker)}
                                onMouseOut={() => handleMouseOutEvent()}
                            />
                        ))}

                    </GoogleMap>
                </>
            )}
                <Display fromMarker={fromMarker}
                    toMarker={toMarker}
                    removeToMarker={handleRemoveToMarker}
                    removeFromMarker={handleRemoveFromMarker}
                    onSelectFrom={handleSelectFromMarker}
                    onSelectTo={handleSelectToMarker}
                    distance={distance}
                    time={time}
                    result={result}
                    markers={markers}
                    walkingDistance={walkingDistance}
                    userWalkToTram={user2Desti}
                    transferStation={transferStation}
                />
        </div>
    )
}

export default React.memo(MapComponent)
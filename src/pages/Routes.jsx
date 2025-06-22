import './Routes.css';
import react, { act, useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { realtimeDb, fetchFromDb, editFromDb, auth } from '../config/firebase';
import RouteMap from '../components/RouteMap';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
const Routes = () => {
    const navigate = useNavigate();
    const [routeData, setRouteData] = useState([]);
    const [routeColor, setRouteColor] = useState([]);

    const loadRoute = async () => {
        try {
            const getRoute = await fetchFromDb("adminRoutes");
            if (getRoute) {
                console.log(getRoute);
                let routeFormat = [];
                let routeColorFormat = [];
                for (const routeObject of getRoute) {
                    const routePath = Object.values(routeObject);
                    console.log(routePath);
                    const color = routePath.pop();
                    console.log(routePath);
                    routeColorFormat.push(color);
                    routeFormat.push(routePath);
                }
                setRouteColor(routeColorFormat);
                setRouteData(routeFormat);
                //setRouteData(testData);
            }
        } catch (e) {
            console.log(e);
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser)
                setUser(currentUser);
            else {
                alert("Please login to view this webpage");
                navigate('/');
            }
        });
        return () => unsubscribe();
    }, [auth]);

    useEffect(() => {
        loadRoute();
    }, []);

    return (
        <div className='admin-page'>
            <Navbar />
            <div className="admin-content">
                <h1 className="cat-header event-color">Routes</h1>
                <div className="data-con">
                    {routeData && routeData.map((data, index) => (
                        <div className="route-map-wrapper">
                            <RouteMap routeData={data} routeColor={routeColor[index]} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Routes

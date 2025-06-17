import './DetailView.css'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import TramTable from './TramTable';

const DetailView = ({ detail }) => {

    const [tramColor, setTramColor] = useState([]);
    const [nearbyStore, setNearbyStore] = useState([]);
    const [showTime, setShowTime] = useState(false);
    const [timeTable, setTimeTable] = useState([]);
    const getStore = (detail) => {
        let storeData = [];
        const building = Object.values(detail.Buildings);
        for (const data of building) {
            if (data.hasOwnProperty('Stores')) {
                const store = Object.values(data.Stores);
                for (const info of store) {
                    if(info.hasOwnProperty('image'))
                        storeData.push(info);
                }
            }
        }
        console.log(storeData);
        setNearbyStore(storeData);
    }

    const getTimeTable = (detail) => {
        setTimeTable(detail.timeTable);
    }
    useEffect(() => {
        if (detail) {
            console.log(detail.Buildings);
            setTramColor([]);
            if ('colors' in detail) {
                console.log(detail.colors);
                setTramColor(detail.colors);
            }
            getStore(detail);
            getTimeTable(detail);
            /*
            if (detail.Buildings.length > 0) {
                console.log("yes");
                for (const data of detail.Buildings) {
                    console.log(data);
                }
            }
                */

            //setNearbyStore(storeData);
            //console.log(storeData);
        }

    }, [])
    const handleShowTramTable = () => {
        setShowTime(true);
    };

    const handleCloseTramTable = () => {
        console.log("checked")
        setShowTime(false);
    };

    return (
        <div className="detail-view">
            {showTime && (
                    <TramTable timeTable = {timeTable} showTramTable={showTime} closeTramTable={handleCloseTramTable} /> // Pass the onClose function
                )}
            <div class="title-image-con">
                <h3>{detail.title}</h3>
                 <svg xmlns="http://www.w3.org/2000/svg" className="timetable-btn" viewBox="0 0 512 512"
                onClick={() => handleShowTramTable()}>
                <path d="M64 256l0-96 160 0 0 96L64 256zm0 64l160 0 0 96L64 416l0-96zm224 96l0-96 160 0 0 96-160 0zM448 256l-160 0 0-96 160 0 0 96zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"/></svg>
                <div className="tram-color-container">
                    {tramColor.length > 0 && tramColor.map((data, index) => (
                        <svg key={index} xmlns="http://www.w3.org/2000/svg" className="tram-color" viewBox="0 0 448 512">
                            <path fill={data} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg>
                    ))}
                </div>
                <img class="detail-img" src={detail.image} />
            </div>
            <div class="detail-con">
                <div className="store-con">
                    {nearbyStore.length > 0 && nearbyStore.map((data, index) => (
                        <div className="store-card" key={`store${index}`}>
                            <img className="store-img" src={data.image} />
                        </div>
                    ))}
                </div>
                {detail.Buildings && Object.keys(detail.Buildings).map((data) => (
                    <div className="detail-card" key={data}>
                        <img className="building-img" src={detail.Buildings[data].image} />
                        <p>{detail.Buildings[data].Description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DetailView
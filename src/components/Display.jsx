import "../components/Display.css"
import React, { useEffect, useState } from 'react'
import Survey from "./Survey";
import DetailView from "./DetailView";
import { userIconToUrl } from '../icons/userIcon';

const Display = ({ fromMarker,
    toMarker,
    removeToMarker,
    removeFromMarker,
    onSelectFrom, // New prop
    onSelectTo,
    distance,
    result,
    walkingDistance,
    time,
    transferStation,
    userWalkToTram,
    markers,
    handleShowOption,
    handleHideOption,
    showOption
}) => {

    const [isDisplayVisible, setDisplayVisible] = useState(true);
    const [isSurveyVisible, setSurveyVisible] = useState(false);
    const [isSimVisible, setSimVisible] = useState(true);
    const [isDetailVisible, setDetailVisible] = useState(false);
    const [detail, setDetail] = useState(null);
    const [fromValue, setFromValue] = useState('');
    const [toValue, setToValue] = useState('');

    const userIcon = userIconToUrl("Black");

    useEffect(() => {
        if (fromMarker) {
            setFromValue(fromMarker.title);
            console.log(fromMarker);
        }
    }, [fromMarker])
    useEffect(() => {
        if (toMarker) {
            setToValue(toMarker.title);
            console.log(toMarker);
        }
    }, [toMarker])
    useEffect(() => {
        if (result) {
            console.log(result);
        }
    }, [result])
    useEffect(() => {
        if (transferStation) {
            console.log(transferStation);
        }
    }, [result])


    const handleToOrigin = (event) => {
        const selectedValue = event.target.value;
        console.log(selectedValue);
        const selectedMarker = markers.find(marker => marker.title === selectedValue);
        //console.log(selectedValue);
        setFromValue(selectedValue);
        onSelectFrom(selectedMarker);
    }
    const handleToDestination = (event) => {
        const selectedValue = event.target.value;
        const selectedMarker = markers.find(marker => marker.title === selectedValue);
        //console.log(selectedValue);
        setToValue(selectedValue); //
        onSelectTo(selectedMarker);
    }
    const handleRemoveToMarker = () => {
        setToValue(''); //
        removeToMarker();
    }

    const handleRemoveFromMarker = () => {
        setFromValue(''); //
        removeFromMarker();
    }
    if (fromMarker) {
        //console.log(fromMarker);
    }
    const toggleNavbar = () => {
        setDisplayVisible(!isDisplayVisible);
    }

    const toggleSurvey = () => {
        setSimVisible(false);
        setDetailVisible(false);
        setSurveyVisible(true);
    }

    const toggleSimulation = () => {
        setSurveyVisible(false);
        setDetailVisible(false);
        setSimVisible(true)
    }
    const toggleDetail = (data) => {
        setSurveyVisible(false);
        if (data) {
            if (data.title === "Current Position") {
                return;
            }
            setDetail(data);
            setSimVisible(false);
            setDetailVisible(true);
        } else {
            setDetailVisible(false);
            setSimVisible(true);
        }
    }

    const hideDetail = () => {
        setDetailVisible(false);
        setSimVisible(true);
    }
    /*
    const toggleDetailsView = (data) => {
        setSurveyVisible(false);
        console.log(fromMarker);
        if (data){
            setDetailVisible(true);
            setSimVisible(false);
            setDetail(data);
        }else{
            setSimVisible(true);
            setDetailVisible(false);
        }
    }
    */
    return (
        <div>
            <svg xmlns="http://www.w3.org/2000/svg" onClick={() => toggleSurvey()} className="survey-btn hover-big" viewBox="0 0 384 512"><path d="M192 0c-41.8 0-77.4 26.7-90.5 64L64 64C28.7 64 0 92.7 0 128L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64l-37.5 0C269.4 26.7 233.8 0 192 0zm0 64a32 32 0 1 1 0 64 32 32 0 1 1 0-64zM128 256a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zM80 432c0-44.2 35.8-80 80-80l64 0c44.2 0 80 35.8 80 80c0 8.8-7.2 16-16 16L96 448c-8.8 0-16-7.2-16-16z" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" className={isDisplayVisible ? 'popup-btn' : 'popup-offscreen'} onClick={toggleNavbar} viewBox="0 0 512 512"><path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM151.2 217.4c-4.6 4.2-7.2 10.1-7.2 16.4c0 12.3 10 22.3 22.3 22.3l41.7 0 0 96c0 17.7 14.3 32 32 32l32 0c17.7 0 32-14.3 32-32l0-96 41.7 0c12.3 0 22.3-10 22.3-22.3c0-6.2-2.6-12.1-7.2-16.4l-91-84c-3.8-3.5-8.7-5.4-13.9-5.4s-10.1 1.9-13.9 5.4l-91 84z" /></svg>
            <div className={isDisplayVisible ? 'display-c text-color' : 'display-offscreen'}>
                {isSimVisible && <div className='sim-show'>
                    <div className="select-c">
                        <h1>Origin</h1>
                        {fromMarker && <svg xmlns="http://www.w3.org/2000/svg" onClick={() => handleRemoveFromMarker()} className='cancel-station hover-big' viewBox="0 0 512 512">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" /></svg>}
                        <input list="from_tram_station" className="select-input" onChange={handleToOrigin} value={fromValue} />
                        <datalist id="from_tram_station">
                            <option value=''>
                                Select Origin
                            </option>
                            {markers.map((option) => (
                                <option key={option.id} value={option.title}>
                                </option>
                            ))}
                        </datalist>
                        {fromMarker && (
                            <img src={fromMarker.image ? fromMarker.image :
                                "https://cdn-icons-png.flaticon.com/512/8/8110.png"
                            } className="img-org" onClick={() => toggleDetail(fromMarker)}>
                            </img>)}
                        {!fromMarker && (
                            <img src='https://cdn-icons-png.flaticon.com/512/8/8110.png' className="img-org">
                            </img>)}
                        {userWalkToTram && userWalkToTram.distance && (
                            <div className="current-pos-con">
                                <div className="current-walk-info">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="user-walk-icon" viewBox="0 0 320 512">
                                        <path fill={userWalkToTram.color} d="M160 48a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zM126.5 199.3c-1 .4-1.9 .8-2.9 1.2l-8 3.5c-16.4 7.3-29 21.2-34.7 38.2l-2.6 7.8c-5.6 16.8-23.7 25.8-40.5 20.2s-25.8-23.7-20.2-40.5l2.6-7.8c11.4-34.1 36.6-61.9 69.4-76.5l8-3.5c20.8-9.2 43.3-14 66.1-14c44.6 0 84.8 26.8 101.9 67.9L281 232.7l21.4 10.7c15.8 7.9 22.2 27.1 14.3 42.9s-27.1 22.2-42.9 14.3L247 287.3c-10.3-5.2-18.4-13.8-22.8-24.5l-9.6-23-19.3 65.5 49.5 54c5.4 5.9 9.2 13 11.2 20.8l23 92.1c4.3 17.1-6.1 34.5-23.3 38.8s-34.5-6.1-38.8-23.3l-22-88.1-70.7-77.1c-14.8-16.1-20.3-38.6-14.7-59.7l16.9-63.5zM68.7 398l25-62.4c2.1 3 4.5 5.8 7 8.6l40.7 44.4-14.5 36.2c-2.4 6-6 11.5-10.6 16.1L54.6 502.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L68.7 398z" /></svg>
                                    <h3>{userWalkToTram.time}</h3>
                                    <h4>{userWalkToTram.distance} m</h4>
                                </div>
                                <h1>↑</h1>
                            </div>
                        )}
                    </div>
                    {transferStation &&
                        <div className="transfer-c">
                            <h1>{transferStation.title}</h1>
                            <img className="transfer-icon" src="/transfer-icon.png" />
                            <img src={transferStation.image} onClick={() => toggleDetail(transferStation)} />
                        </div>}
                    <div className="select-c">
                        <h1>Destination</h1>
                        {toMarker && <svg xmlns="http://www.w3.org/2000/svg" onClick={() => handleRemoveToMarker()} className='cancel-station hover-big' viewBox="0 0 512 512">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" /></svg>}
                        <input list="to_tram_station" className="select-input" onChange={handleToDestination} value={toValue} />
                        <datalist id="to_tram_station">
                            {markers.map((option) => (
                                <option key={option.id} value={option.title}>
                                </option>
                            ))}
                        </datalist>
                        <img src={toMarker ? toMarker.image :
                            'https://cdn-icons-png.flaticon.com/512/8/8110.png'} className="img-org" onClick={() => toggleDetail(toMarker)}></img>
                    </div>

                    <div className="select-info-c">

                        {result && result.length > 0 &&
                            result.map((data, index) => (
                                data.isWalking && (
                                    <div className="info-c" key={`walk-data${index}`}>
                                        <h1 onClick={() => handleShowOption()} className="suggest-walking hover-big">Suggestion -- Walking</h1>
                                        {showOption && (
                                            <div className="info-row">
                                                <div className="info-data">
                                                    <h3>Total Time:</h3>
                                                    <h4>{data.walkingTime?.text || '--'}</h4>
                                                </div>
                                                <div className="info-data">
                                                    <h3>Distance:</h3>
                                                    <h4>{data.walkingDistance ? `${data.walkingDistance} m` : '--'}</h4>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            ))
                        }

                        {result && result.length > 0 &&
                            <div className='info-c' >
                                <h1 onClick={() => handleHideOption()} className="simu-schedule hover-big">Simulation -- Scheduled</h1>
                                {!showOption && (
                                    <>
                                        <div className="info-row">
                                            <div className="info-data">
                                                <h3>Total Time:</h3>
                                                <h4>{time ? time : '--'}</h4>
                                            </div>
                                            <div className="info-data">
                                                <h3>Distance:</h3>
                                                <h4>{distance ? distance + ' Km' : ''}</h4>
                                            </div>
                                        </div>
                                        <div className="info-row">
                                            <div className="info-data">
                                                <h3>Arrival Time: </h3>
                                                <h4>{result.length ? result[0].arrivalTime : '--'}</h4>
                                            </div>
                                            <div className="info-data">
                                                <h3>Color:</h3>
                                                <h4>{result.length ? <svg xmlns="http://www.w3.org/2000/svg" className="popup-tram-icon" viewBox="0 0 448 512">
                                                    <path fill={result[0].color} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg> : '--'}
                                                </h4>
                                            </div>
                                        </div>
                                        {result.length > 1 &&
                                            <div className="info-row">
                                                <div className="info-data">
                                                    <h3>Transfer Arrival : </h3>
                                                    <h4>{result.length > 1 ? result[1].arrivalTime : '--'}</h4>
                                                </div>
                                                <div className="info-data">
                                                    <h3>Transfer color:</h3>
                                                    <h4>{result.length > 1 ? <svg xmlns="http://www.w3.org/2000/svg" className="popup-tram-icon" viewBox="0 0 448 512">
                                                        <path fill={result[1].color} d="M96 0C43 0 0 43 0 96L0 352c0 48 35.2 87.7 81.1 94.9l-46 46C28.1 499.9 33.1 512 43 512l39.7 0c8.5 0 16.6-3.4 22.6-9.4L160 448l128 0 54.6 54.6c6 6 14.1 9.4 22.6 9.4l39.7 0c10 0 15-12.1 7.9-19.1l-46-46c46-7.1 81.1-46.9 81.1-94.9l0-256c0-53-43-96-96-96L96 0zM64 128c0-17.7 14.3-32 32-32l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96zM272 96l80 0c17.7 0 32 14.3 32 32l0 96c0 17.7-14.3 32-32 32l-80 0c-17.7 0-32-14.3-32-32l0-96c0-17.7 14.3-32 32-32zM64 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm288-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" /></svg> : '--'}
                                                    </h4>
                                                </div>
                                            </div>
                                        }
                                    </>
                                )}
                            </div>
                        }
                    </div>
                </div>}

                {isSurveyVisible &&
                    <div className='survey-show'>
                        <svg xmlns="http://www.w3.org/2000/svg" onClick={() => toggleSimulation()} className="survey-back" viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
                        <Survey />
                    </div>
                }
                {isDetailVisible &&
                    <div className='detail-show'>
                        <svg xmlns="http://www.w3.org/2000/svg" onClick={() => toggleSimulation()} className="survey-back" viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
                        <DetailView detail={detail} />
                    </div>}
            </div>
        </div>
    )
}

export default Display
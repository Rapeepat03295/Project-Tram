import './Event.css'
import react, { act, useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { realtimeDb, fetchFromDb, editFromDb, fetchNewestFirst } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AddEvent from '../components/AddEvent';
import EditEvent from '../components/EditEvent';
const Event = () => {
    const [user, setUser] = useState(null);
    const [event, setEvent] = useState([]);
    const [archEvent, setArchEvent] = useState([]);
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [showEditEvent, setShowEditEvent] = useState(false);
    const [eventEditData, setEventEditData] = useState(null);

    const loadEvent = async () => {
        try {
            const getEvent = await fetchNewestFirst("events");
            if (getEvent) {
                let deleted = [];
                let active = [];
                for (const data of getEvent) {
                    console.log(data);
                    if (data.status == 'active') {
                        active.push(data);
                    } else {
                        deleted.push(data);
                    }
                }
                setArchEvent(deleted);
                setEvent(active);
            }
        } catch (e) {
            console.log(e);
        }
    }
    useEffect(() => {
        loadEvent();
    }, []);

    const handleArchiveEvent = async (data) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                const dataEdit = {
                    ...data,
                    status: "Deleted"
                }
                const checkEdit = await editFromDb(dataEdit, "events", dataEdit.id);
                if (checkEdit) {
                    loadEvent();
                }
                alert("Data Archived Successfully");
            } catch (e) {
                console.log(e);
                alert("failed to archive event");
            }
        }
    }
    const restoreArchiveEvent = async (data) => {
        if (window.confirm('Are you sure you want to restore this event?')) {
            try {
                const archiveData = {
                    ...data,
                    status: "active"
                }
                console.log(archiveData);

                const editState = await editFromDb(archiveData, "events", data.id);
                if (editState) {
                    alert("data restored")
                    loadEvent();
                }
            } catch (e) {
                console.log(e);
                alert("failed to restore event");
            }
        }
    }
    const handleDeleteEvent = (id) => {
        console.log(id);
        if (window.confirm('Are you sure you want to delete this event?')) {
            const eventsRef = ref(realtimeDb, `events/${id}`);
            remove(eventsRef)
                .then(() => {
                    alert("Event Deleted!");
                })
                .catch((error) => {
                    console.error("Error deleting an event", error);
                    alert("Failed to delete event. Please try again.");
                });
        }
    }
    const handleArchiveAllEvent = async () => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                for (const data of event) {
                    const dataEdit = {
                        ...data,
                        status: "Deleted"
                    }
                    const checkEdit = await editFromDb(dataEdit, "events", dataEdit.id);
                }
                alert("Data Archived Successfully");
            } catch (e) {
                alert("failed to archive event");
            }
        }
    }

    const handleDeleteAllEvent = (id) => {
        console.log(id);
        if (window.confirm('Are you sure you want to delete this event?')) {
            const eventsRef = ref(realtimeDb, `events`);
            remove(eventsRef)
                .then(() => {
                    alert("Event Deleted!");
                })
                .catch((error) => {
                    console.error("Error deleting an event", error);
                    alert("Failed to delete event. Please try again.");
                });
        }
    }
    const convertDateTime = (date) => {
        const dateObj = new Date(date);
        const localDateTimeStr = dateObj.toLocaleString();
        return localDateTimeStr;
    }
    // **** modal show handler ***** //
    const handleShowCreateEvent = () => {
        setShowAddEvent(true);
    };

    const handleCloseCreateEvent = () => {
        setShowAddEvent(false);
    };
    const handleShowEditEvent = (data) => {
        setEventEditData(data);
        setShowEditEvent(true);
    };

    const handleCloseEditEvent = () => {
        setShowEditEvent(false);
    };

    return (
        <div className='admin-page'>
            <Navbar />
            <div className="admin-content">
                <h1 className="cat-header event-color">Events</h1>
                <div className="btn-container">
                    <button className="add-data event-color" onClick={() => handleShowCreateEvent()}> + Add Event</button>
                    <div className="delete-icon-container" onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveAllEvent()
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="bin-icon" viewBox="0 0 448 512" >
                            <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                            Delete All Events   
                    </div>
                </div>
                {showAddEvent && (
                    <AddEvent showAddEvent={showAddEvent} closeAddEvent={handleCloseCreateEvent} /> // Pass the onClose function
                )}
                {showEditEvent && (
                    <EditEvent showEditEvent={showEditEvent} closeEditEvent={handleCloseEditEvent} editData={eventEditData} /> // Pass the onClose function
                )}
                <div className="data-con">
                    {event && event.map((data) => (
                        <div className="event-card" key={data.id} onClick={() => handleShowEditEvent(data)}>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveEvent(data);
                            }} className="delete-event">x</button>
                            <h1 className="data-header event-color">{data.name}</h1>
                            <img className="data-img" src={data.imageUrl} />
                            <h2 className="data-desc">{data.description}</h2>
                            <h3 className="data-date">Start: {convertDateTime(data.startDate)}</h3>
                            <h3 className="data-date">End: {convertDateTime(data.endDate)}</h3>
                        </div>
                    ))}
                </div>
                {archEvent.length > 0 && <h1 className = "archive-header">Archive Events</h1>}
                <div className="data-con">
                    {archEvent.length > 0 && archEvent.map((data) => (
                        <div className="event-card-restore" key={data.id} onClick={() => handleShowEditEvent(data)}>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(data.id);
                            }} className="delete-event">x</button>
                            <h1 className="data-header event-color">{data.name}</h1>
                            <img className="data-img" src={data.imageUrl} />
                            <h2 className="data-desc">{data.description}</h2>
                            <h3 className="data-date">Start: {convertDateTime(data.startDate)}</h3>
                            <h3 className="data-date">End: {convertDateTime(data.endDate)}</h3>
                            <button className="add-data event-color" onClick={(e) => {
                                e.stopPropagation();
                                restoreArchiveEvent(data)
                            }}>Restore event</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Event

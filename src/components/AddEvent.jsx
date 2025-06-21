import './AddEvent.css'
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ref, push, set, onValue } from 'firebase/database';
import { addEventWithImage, realtimeDb } from '../config/firebase';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import SimpleMap from './SimpleMap';

const AddEvent = ({ showAddEvent, closeAddEvent }) => {
    const [user, setUser] = useState(null);
    const [eventData, setEventData] = useState({
        name: '',
        description: '',
        location: null,
        startDate: '',
        endDate: '',
        status: 'active'
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);
    const previewImage = (e) => {
        if (e) {
            setImageFile(e);
            setImagePreview(URL.createObjectURL(e));
        }
    }
    const handleLocationChange = (newLocation) => {
        setEventData(prevData => ({
            ...prevData,
            location: newLocation
        }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEventData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleAddEvent = async () => {
        if (!eventData.name.trim() || !eventData.description.trim() || !eventData.startDate || !eventData.endDate || !eventData.location) {
            alert("Please fill in all fields and select a location.");
        }
        if (!user) {
            alert("Please sign in to create an event.");
            return;
        }
        const eventsRef = ref(realtimeDb, 'events');
        const newEventRef = push(eventsRef);

        setEventData(prevData => ({
            ...prevData,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
        }));
        try{
        await addEventWithImage(newEventRef.key, eventData, imageFile);
            alert("event added successfully");
            closeAddEvent();
        }catch(e){
            alert("failed to add event")
        }
        /*
        set(newEventRef, eventData)
            .then(() => {
                alert("Event created successfully!");
                closeAddEvent();
            })
            .catch((error) => {
                console.error("Error creating event:", error);
                alert("Failed to create event. Please try again.");
            });
        */
    }
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    return (
        <div className="modal-wrapper">
            <form className="add-modal">
                <h1 className="modal-header">Create Event</h1>
                <div className="input-group">
                    <label className="create-label" htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={eventData.name}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="create-label" htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={eventData.description}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="input-group">
                    <label className="create-label" htmlFor="startDate">Start Date</label>
                    <input
                        type="datetime-local"
                        id="startDate"
                        name="startDate"
                        value={eventData.startDate}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="input-group">
                    <label className="create-label" htmlFor="endDate">End Date</label>
                    <input
                        type="datetime-local"
                        id="endDate"
                        name="endDate"
                        value={eventData.endDate}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="event-map-con">
                    <SimpleMap
                        onLocationChange={handleLocationChange} // Pass the callback
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="image">Event Image</label>
                    <input
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={e => previewImage(e.target.files[0])}
                    />
                </div>
                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Preview" style={{ maxWidth: "200px", maxHeight: "200px" }} />
                    </div>
                )}
                <div className="btn-group">
                    <button className="create-btn" type="button" onClick={() => handleAddEvent()}>Create</button>
                    <button className="cancel-btn" type="button" onClick={closeAddEvent}>Cancel</button>
                </div>
            </form>
        </div >
    );
};

export default AddEvent
import './Feedback.css'
import react, { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { realtimeDb, fetchFromDb, editFromDb } from '../config/firebase';
const Feedback = () => {
    const [user, setUser] = useState(null);
    const [feedback, setFeedback] = useState([]);
    const [archFeedback, setArchFeedback] = useState([]);
    const loadFeedback = async () => {
        try {
            const getFeedback = await fetchFromDb("feedback");
            if (getFeedback) {
                let deleted = [];
                let active = [];
                console.log(getFeedback);
                for (const data of getFeedback) {
                    if (data.status == 'active') {
                        active.push(data);
                    } else {
                        deleted.push(data);
                    }
                }
                setArchFeedback(deleted);
                setFeedback(active);
            }
        } catch (e) {
            console.log(e);
        }
    }
    useEffect(() => {
        loadFeedback();
    }, [feedback]);

    const convertDateTime = (date) => {
        const dateObj = new Date(date);
        const localDateTimeStr = dateObj.toLocaleString();
        return localDateTimeStr;
    }

    const handleArchiveFeedback = async (data) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            try {
                const dataEdit = {
                    ...data,
                    status: "Deleted"
                }
                const checkEdit = await editFromDb(dataEdit, "feedback", dataEdit.id);
                alert("Data Archived Successfully");
            } catch (e) {
                console.log(e);
                alert("failed to archive data");
            }
        }
    }
    const restoreArchiveFeedback = async (data) => {
        if (window.confirm('Are you sure you want to delete this data?')) {
            try {
                const archiveData = {
                    ...data,
                    status: "active"
                }
                console.log(archiveData);

                const editState = await editFromDb(archiveData, "feedback", data.id);
                if (editState) {
                    alert("data restored")
                }
            } catch (e) {
                console.log(e);
                alert("failed to restore event");
            }
        }
    }
    const handleDeleteFeedback = (id) => {
        if (window.confirm('Are you sure you want to delete this feedback?')) {
            const feedbackRef = ref(realtimeDb, `feedback/${id}`);
            remove(feedbackRef)
                .then(() => {
                    alert("feedback Deleted!");
                })
                .catch((error) => {
                    console.error("Error deleting an feedback", error);
                    alert("Failed to delete feedback. Please try again.");
                });
        }
    }

    return (
        <div className='admin-page'>
            <Navbar />
            <div className="admin-content">
                <h1 className="cat-header fb-color">Feedback</h1>
                <div className="data-con">
                    {feedback && feedback.map((data) => (
                        <div className="event-card" key={data.id}>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveFeedback(data)
                            }} className="delete-event">x</button>
                            <h1 className="fb-header fb-color">{data.email}</h1>
                            <p className="data-date">{data.message}</p>
                            <h3 className="data-date">{convertDateTime(data.timestamp)}</h3>
                        </div>
                    ))}
                </div>
                {archFeedback.length > 0 && <h1 className = "archive-header">Archive Feedback</h1>}
                <div className="data-con">
                    {archFeedback && archFeedback.map((data) => (
                        <div className="event-card" key={data.id}>
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFeedback(data.id)
                            }} className="delete-event">x</button>
                            <h1 className="fb-header fb-color">{data.email}</h1>
                            <p className="data-date">{data.message}</p>
                            <h3 className="data-date">{convertDateTime(data.timestamp)}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Feedback
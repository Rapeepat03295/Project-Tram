import './TramTable.css';
import react, { act, useEffect, useState } from 'react';
const TramTable = ({ timeTable, showTramTable, closeTramTable }) => {

    const [weekday, setWeekday] = useState([]);
    const [weekend, setWeekend] = useState([]);
    useEffect(() => {
        if (timeTable) {
            const calendar = {
                color: '',
                time: []
            }
            const weekdayArr = [];
            const weekendArr = [];
            const dataWeek = Object.keys(timeTable['Weekday']);
            const dataEnd = Object.keys(timeTable['Weekend']);
            //setWeekday(dataWeek);
            //setWeekend(dataEnd);
            for (const tramColor of dataWeek) {
                const data = { ...calendar };
                data.color = tramColor;
                data.time = timeTable['Weekday'][tramColor];
                weekdayArr.push(data)
            }
            for (const tramColor of dataEnd) {
                const data = { ...calendar };
                data.color = tramColor;
                data.time = timeTable['Weekend'][tramColor];
                weekendArr.push(data)
            }

            setWeekday(weekdayArr);
            setWeekend(weekendArr);
            console.log(weekdayArr, weekendArr);
        }
    }, [timeTable]);


    return (
        <div className="modal-wrapper">
            <div className="calendar-wrapper">
                {weekday.length > 0 &&
                    <div className="weekday-table">
                        <h1>Monday-Friday</h1>
                        {weekday.map((calendar, index) => (
                            <table className="calendar-row">
                                <thead>
                                    <tr>
                                        <th key={`header-color-${index}`} className="sticky-header">
                                            {calendar.color}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="time-txt">
                                    {calendar.time.map((timeSlot, timeIndex) => (
                                        <tr key={`time-row-${timeIndex}`}>
                                            <td key={`data-${timeIndex}-${timeIndex}`}>
                                                {timeSlot || ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ))}
                    </div>
                }
                {weekend.length > 0 &&
                    <div className="weekday-table">
                        <h1>Saturday-Sunday</h1>
                        {weekend.map((calendar, index) => (
                            <table className="calendar-row">
                                <thead>
                                    <tr>
                                        <th key={`header-color-${index}`} className="sticky-header">
                                            {calendar.color}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="time-txt">
                                    {calendar.time.map((timeSlot, timeIndex) => (
                                        <tr key={`time-row-${timeIndex}`}>
                                            <td key={`data-${timeIndex}-${timeIndex}`}>
                                                {timeSlot || ''}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ))}
                    </div>
                }
                {<button className="cancel-btn-calendar" type="button" onClick={closeTramTable}>x</button>}
            </div>
        </div >
    )
}

export default TramTable;
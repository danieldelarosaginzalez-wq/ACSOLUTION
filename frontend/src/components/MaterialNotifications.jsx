import React, { useState, useEffect } from 'react';
import { materialDistributionService } from '../services/materialDistributionService';

const MaterialNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Load notifications logic here
    }, []);

    return (
        <div className="material-notifications">
            <h3>Material Notifications</h3>
            {notifications.length === 0 ? (
                <p>No notifications</p>
            ) : (
                <ul>
                    {notifications.map((notification, index) => (
                        <li key={index}>{notification.message}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MaterialNotifications;
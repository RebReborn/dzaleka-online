import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import "../styles/notifications.css";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, "notifications"),
            where("receiverId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } else {
                setNotifications([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="notifications-container">
            <h2>Notifications</h2>
            {loading ? (
                <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
                <p>No new notifications</p>
            ) : (
                <ul>
                    {notifications.map((notif) => (
                        <li key={notif.id} className="notification-item">
                            <span className="notif-text">
                                {notif.type === "like" ? "liked" : "commented on"} your post.
                            </span>
                            <span className="notif-time">{new Date(notif.timestamp?.seconds * 1000).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;

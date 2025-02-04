import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import "../styles/notifications.css";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const q = query(
            collection(db, "notifications"),
            where("receiverId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="notifications-container">
            <h2>Notifications</h2>
            {notifications.length === 0 ? <p>No new notifications</p> : notifications.map((notif) => (
                <p key={notif.id}>
                    {notif.type === "like" ? "liked" : "commented on"} your post.
                </p>
            ))}
        </div>
    );
};

export default Notifications;

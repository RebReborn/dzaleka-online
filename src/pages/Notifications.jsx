import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom"; // ✅ Redirect user when clicking notification
import "../styles/notifications.css";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // ✅ Navigation to posts

    useEffect(() => {
        if (!auth.currentUser) return;

        console.log("📩 Fetching notifications for:", auth.currentUser.uid);

        const q = query(
            collection(db, "notifications"),
            where("receiverId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log("🔥 Snapshot received:", snapshot.docs.length);
            console.log("🔥 Querying notifications for:", auth.currentUser?.uid);


            if (!snapshot.empty) {
                const fetchedNotifications = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    console.log("📩 Notification Data:", data);

                    if (!data || !data.message || !data.timestamp) {
                        console.warn("⚠️ Invalid notification:", data);
                        return null;
                    }
                    if (!data || !data.timestamp) {
                        console.warn("⚠️ Invalid notification:", data);
                        return null;
                    }


                    return { id: doc.id, ...data };
                }).filter(Boolean); // Remove null values

                setNotifications(fetchedNotifications);
            } else {
                console.log("⚠️ No notifications found.");
                setNotifications([]);
            }
        }, (error) => {
            console.error("❌ Firestore Error:", error);
        });

        return () => unsubscribe();
    }, []);

    // ✅ Function to redirect user to post when clicking a notification
    const handleNotificationClick = (postId) => {
        console.log("Navigating to post:", postId); // ✅ Debug Log

        if (postId) {
            navigate(`/post/${postId}`); // ✅ Redirects to the post page
        } else {
            console.warn("⚠️ No postId found in notification.");
        }
    };


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
                        <li
                            key={notif.id}
                            className="notification-item"
                            onClick={() => handleNotificationClick(notif.postId)} // ✅ Click sends user to the post
                            style={{ cursor: notif.postId ? "pointer" : "default" }} // ✅ Only clickable if there's a postId
                        >
                            <span className="notif-text">
                                {notif.senderName} {notif.type === "like" ? "liked" : "commented on"} your post.
                            </span>
                            <span className="notif-time">
                                {notif.timestamp?.seconds
                                    ? new Date(notif.timestamp.seconds * 1000).toLocaleString()
                                    : "Unknown time"}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Notifications;

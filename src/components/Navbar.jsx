import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    orderBy,
    writeBatch
} from "firebase/firestore";
import { FiHome, FiUser, FiPlusCircle, FiBell } from "react-icons/fi";
import "../styles/navbar.css";

const Navbar = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hideNavbar, setHideNavbar] = useState(false);
    const navigate = useNavigate();
    let lastScrollY = window.scrollY;

    useEffect(() => {
        // Dynamically inject meta tag to prevent zooming
        const metaTag = document.createElement("meta");
        metaTag.name = "viewport";
        metaTag.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
        document.head.appendChild(metaTag);
    }, []);


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

            if (!snapshot.empty) {
                const fetchedNotifications = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    console.log("📩 Notification Data:", data);

                    if (!data || !data.type || !data.timestamp) {
                        console.warn("⚠️ Invalid notification:", data);
                        return null;
                    }

                    return { id: doc.id, ...data };
                }).filter(Boolean); // Remove null values

                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter((notif) => !notif.seen).length);
                console.log("Fetched Notifications:", fetchedNotifications);

            } else {
                console.log("⚠️ No notifications found.");
                setNotifications([]);
            }
        }, (error) => {
            console.error("❌ Firestore Error:", error);
        });

        return () => unsubscribe();
    }, []);



    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setHideNavbar(currentScrollY > lastScrollY && currentScrollY > 50);
            lastScrollY = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // ✅ Mark all notifications as read
    const markAllAsRead = async () => {
        if (!notifications.length) return;

        const batch = writeBatch(db);
        notifications.forEach((notification) => {
            if (!notification.seen) {
                const notificationRef = doc(db, "notifications", notification.id);
                batch.update(notificationRef, { seen: true });
            }
        });

        await batch.commit();
        setUnreadCount(0);
    };

    // ✅ Handle notification click (navigate to post)
    console.log("✅ handleNotificationClick function is being called");

    const handleNotificationClick = (postId) => {
        if (postId) {
            console.log(`🔔 Notification clicked. Navigating to post: ${postId}`);
            navigate(`/post/${postId}`);
            setShowDropdown(false);
        } else {
            console.warn("⚠️ No post ID found in notification.");
        }
    };




    return (
        <>
            <nav className={`navbar ${hideNavbar ? "hidden-navbar" : ""}`}>
                <div className="nav-left">
                    <Link to="/feed" className="nav-logo">Dzaleka Cty</Link>
                </div>
                <div className="nav-icons">
                    <Link to="/feed" className="nav-icon"><FiHome /></Link>

                    {/* ✅ Notification Dropdown */}
                    <div className="notification-container" onClick={() => {
                        setShowDropdown(!showDropdown);
                        markAllAsRead();
                    }}>
                        <FiBell className="nav-icon notification-icon" />
                        {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
                    </div>

                    <Link to="/profile" className="nav-icon"><FiUser /></Link>
                </div>

                {showDropdown && (
                    <div className="notification-dropdown">
                        {notifications.length === 0 ? (
                            <p>No notifications yet</p>
                        ) : (
                            notifications.map((notif) => (
                                <p
                                    key={notif.id}
                                    className="notif-item"
                                    onClick={() => handleNotificationClick(notif.postId)}
                                    style={{
                                        cursor: notif.postId ? "pointer" : "default",
                                        background: notif.seen ? "#f5f5f5" : "#d1e7fd", // ✅ Highlight unread
                                    }}
                                >
                                    <strong>{notif.senderName}</strong> {notif.type === "like" ? "liked" : "commented on"} your post.
                                </p>
                            ))
                        )}
                    </div>
                )}

            </nav>

            <Link to="/create-post" className="floating-post-btn">
                <FiPlusCircle />
            </Link>
        </>
    );
};

export default Navbar;

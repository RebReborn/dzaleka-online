import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase";
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    writeBatch
} from "firebase/firestore";
import { FiHome, FiUser, FiPlusCircle, FiBell } from "react-icons/fi";
import "../styles/navbar.css";

const Navbar = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hideNavbar, setHideNavbar] = useState(false);
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

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", auth.currentUser.uid),
            where("seen", "==", false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setUnreadCount(fetchedNotifications.length);
            setNotifications(fetchedNotifications);
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

    return (
        <>
            <nav className={`navbar ${hideNavbar ? "hidden-navbar" : ""}`}>
                <div className="nav-left">
                    <Link to="/feed" className="nav-logo">Dzaleka Online</Link>
                </div>
                <div className="nav-icons">
                    <Link to="/feed" className="nav-icon"><FiHome /></Link>

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
                                <p key={notif.id}>{notif.message}</p>
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

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
import { MdDarkMode, MdLightMode } from "react-icons/md"; // ✅ Import Theme Icons
import "../styles/navbar.css";

const Navbar = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [hideNavbar, setHideNavbar] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const navigate = useNavigate();
    let lastScrollY = window.scrollY;

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    // ✅ Toggle Theme Function
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, "notifications"),
            where("receiverId", "==", auth.currentUser.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const fetchedNotifications = snapshot.docs.map((doc) => ({
                    id: doc.id, ...doc.data(),
                }));

                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter((notif) => !notif.seen).length);
            } else {
                setNotifications([]);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            <nav className={`navbar ${hideNavbar ? "hidden-navbar" : ""}`}>
                <div className="nav-left">
                    <Link to="/feed" className="nav-logo">Dzaleka Cty</Link>
                </div>
                <div className="nav-icons">
                    <Link to="/feed" className="nav-icon"><FiHome /></Link>

                    <div className="notification-container" onClick={() => {
                        setShowDropdown(!showDropdown);
                        setUnreadCount(0);
                    }}>
                        <FiBell className="nav-icon notification-icon" />
                        {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
                    </div>

                    <Link to="/profile" className="nav-icon"><FiUser /></Link>

                    {/* ✅ Theme Toggle Icon */}
                    <span className="theme-icon" onClick={toggleTheme}>
                        {theme === "light" ? <MdDarkMode /> : <MdLightMode />}
                    </span>
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
                                    onClick={() => navigate(`/post/${notif.postId}`)}
                                    style={{
                                        cursor: notif.postId ? "pointer" : "default",
                                        background: notif.seen ? "#f5f5f5" : "#d1e7fd",
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

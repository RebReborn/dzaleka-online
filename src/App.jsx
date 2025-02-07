import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Newsfeed from "./pages/Newsfeed.jsx";
import Notifications from "./pages/Notifications.jsx";
import Navbar from "./components/Navbar.jsx";
import "./styles/global.css";

const App = () => {
    useEffect(() => {
        // ✅ Prevent Zooming (Pinch, Double-Tap & Keyboard Shortcuts)
        const preventZoom = (event) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault(); // Prevent zooming but allow scrolling
            }
        };

        // ✅ Allow scrolling while preventing zoom
        document.addEventListener("wheel", (event) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
            }
        }, { passive: false });

        document.addEventListener("gesturestart", (event) => {
            event.preventDefault(); // Disable pinch zoom on touch devices
        });

        // ✅ Prevent keyboard zooming but allow other key events
        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "-" || event.key === "0")) {
                event.preventDefault();
            }
        });

        // ✅ Proper cleanup to avoid memory leaks
        const removePreventZoom = () => {
            document.removeEventListener("wheel", preventZoom);
            document.removeEventListener("gesturestart", preventZoom);
            document.removeEventListener("keydown", preventZoom);
        };

        // Call removePreventZoom when needed to remove event listeners

    }, []);

    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} /> {/* ✅ Dynamic Profile Route */}
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/feed" element={<Newsfeed />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
};

export default App;

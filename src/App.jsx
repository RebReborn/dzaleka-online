import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Newsfeed from "./pages/Newsfeed.jsx";
import Notifications from "./pages/Notifications.jsx";
import Navbar from "./components/Navbar.jsx";
import PostDetail from "./components/PostDetail";
import SignUp from "./pages/SignUp";
import PostPage from "./pages/PostPage"; // ✅ Import PostPage
import "./styles/global.css";

const App = () => {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

    useEffect(() => {
        // ✅ Apply the theme to <html>
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    // ✅ Toggle Theme Function
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    useEffect(() => {
        // ✅ Prevent Zooming (Pinch, Double-Tap & Keyboard Shortcuts)
        const preventZoom = (event) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault(); // Prevent zooming but allow scrolling
            }
        };

        document.addEventListener("wheel", preventZoom, { passive: false });
        document.addEventListener("gesturestart", preventZoom);
        document.addEventListener("keydown", (event) => {
            if ((event.ctrlKey || event.metaKey) && (event.key === "+" || event.key === "-" || event.key === "0")) {
                event.preventDefault();
            }
        });

        return () => {
            document.removeEventListener("wheel", preventZoom);
            document.removeEventListener("gesturestart", preventZoom);
            document.removeEventListener("keydown", preventZoom);
        };
    }, []);

    return (
        <Router>
            <Navbar />

            {/* ✅ Theme Toggle Button */}
            <button onClick={toggleTheme} className="theme-toggle">
                {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>

            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} /> {/* ✅ Dynamic Profile Route */}
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/feed" element={<Newsfeed />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="*" element={<Navigate to="/login" />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/post/:postId" element={<PostPage />} />
                <Route path="/post/:postId" element={<PostDetail />} />
            </Routes>
        </Router>
    );
};

export default App;

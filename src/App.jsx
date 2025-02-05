import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Newsfeed from "./pages/Newsfeed.jsx";
import Notifications from "./pages/Notifications.jsx";
import Navbar from "./components/Navbar.jsx";
import "./styles/global.css";

const AppContent = () => {
    const location = useLocation();
    const hideNavbar = location.pathname === "/login" || location.pathname === "/signup";

    return (
        <div>
            {!hideNavbar && <Navbar />} {/* ✅ Navbar only on non-login pages */}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/feed" element={<Newsfeed />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </div>
    );
};

const App = () => (
    <Router>
        <AppContent />
    </Router>
);

export default App;

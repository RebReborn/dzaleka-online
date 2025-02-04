import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Newsfeed from "./pages/Newsfeed.jsx";
import Notifications from "./pages/Notifications.jsx";
import Navbar from "./components/Navbar.jsx"; // Import Navbar

const App = () => {
    return (
        <Router>
            <Navbar /> {/* Show Navbar on all pages */}
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/feed" element={<Newsfeed />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/create" element={<CreatePost />} />
                {/* More routes will be added later */}
            </Routes>
        </Router>
    );
};

export default App;

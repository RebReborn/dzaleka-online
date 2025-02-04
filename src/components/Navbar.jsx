import React from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css"; // Ensure the correct CSS file

const Navbar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        auth.signOut().then(() => {
            navigate("/"); // Redirect to login page after logout
        });
    };

    return (
        <nav className="navbar">
            <h2>Dzaleka Online</h2>
            <ul>
                <li><Link to="/feed">Home</Link></li>
                <li><Link to="/create">Create Post</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/notifications">Notifications</Link></li>
                <li><button onClick={handleLogout}>Logout</button></li>
            </ul>
        </nav>
    );
};

export default Navbar;

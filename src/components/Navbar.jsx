import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth"; 
import { db, auth } from "../firebase"; 

import { FiHome, FiUser, FiLogOut, FiPlusCircle } from "react-icons/fi";
import "../styles/navbar.css";

const Navbar = () => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUserData(userSnap.data());
                }
            }
        };
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="nav-left">
                <Link to="/feed" className="nav-logo">Dzaleka Online</Link>
            </div>
            <div className="nav-icons">
                <Link to="/feed" className="nav-icon"><FiHome /></Link>
                <Link to="/profile" className="nav-icon"><FiUser /></Link>
                <button onClick={handleLogout} className="nav-icon logout-btn"><FiLogOut /></button>
            </div>

            {/* Floating Post Button */}
            <Link to="/create-post" className="floating-post-btn">
                <FiPlusCircle />
            </Link>
        </nav>
    );
};

export default Navbar;

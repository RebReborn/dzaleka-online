import React, { useState, useEffect } from "react";
import { auth, signInWithGoogle } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // Make sure the path is correct

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // If user is already logged in, redirect them
        auth.onAuthStateChanged((user) => {
            if (user) {
                navigate("/feed"); // Redirect to the newsfeed page
            }
        });
    }, []);

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/feed"); // Redirect to the newsfeed page
        } catch (error) {
            console.error("Login Error:", error.message);
            alert(error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithGoogle();
            navigate("/feed"); // Redirect to the newsfeed page
        } catch (error) {
            console.error("Google Login Error:", error.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to Dzaleka Online</h2>
            <form onSubmit={handleEmailLogin}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Login</button>
            </form>
            <button onClick={handleGoogleLogin}>Sign in with Google</button>
        </div>
    );
};

export default Login;

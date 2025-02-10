import React, { useState, useRef } from "react";
import { db, auth } from "../firebase";
import { addDoc, collection, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/create-post.css";

const CreatePost = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // ✅ Debugging in development mode only
    if (import.meta.env.MODE === "development") {
        console.log("Cloudinary Cloud Name:", import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
        console.log("Cloudinary Upload Preset:", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    }

    const uploadToCloudinary = async (file) => {
        const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
            console.error("❌ Cloudinary credentials are missing. Check your .env file.");
            return null;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            setLoading(true);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`❌ Cloudinary upload failed: ${response.statusText}`);

            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("❌ Cloudinary Upload Error:", error);
            Swal.fire({ icon: "error", title: "Upload failed", text: "Image upload failed. Try again." });
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateUserActivity = async (activityType) => {
        if (!auth.currentUser) return;

        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        let userData = userSnap.data();
        let currentDate = new Date().toDateString();
        let lastActiveDate = userData.lastActiveDate || null;
        let points = userData.points || 0;
        let streak = userData.streak || 0;

        const activityPoints = {
            postWithImage: 10,
            postWithoutImage: 5,
            comment: 3,
            story: 7,
        };
        points += activityPoints[activityType] || 0;

        if (lastActiveDate === currentDate) {
            console.log("🔥 User already active today, streak remains:", streak);
        } else if (lastActiveDate === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString()) {
            streak += 1;
            console.log("✅ Streak increased! Current streak:", streak);
        } else {
            streak = 1;
            console.log("⚠️ Missed a day, streak reset to:", streak);
        }

        await updateDoc(userRef, {
            points,
            streak,
            lastActiveDate: currentDate,
        });
    };

    const handlePost = async () => {
        if (!content.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Oops...",
                text: "Post content cannot be empty!",
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }

        setLoading(true);
        let imageUrl = "";

        if (image) {
            imageUrl = await uploadToCloudinary(image);
            if (!imageUrl) {
                setLoading(false);
                return;
            }
        }

        try {
            await addDoc(collection(db, "posts"), {
                userId: auth.currentUser.uid,
                username: auth.currentUser.displayName || "Anonymous",
                title: title.trim() || "",
                content: content.trim(),
                imageUrl,
                createdAt: Timestamp.now(),
                likes: [],
                comments: [],
            });

            Swal.fire({
                icon: "success",
                title: "Post Created!",
                text: "Your post has been shared successfully.",
                timer: 2000,
                showConfirmButton: false,
            });

            updateUserActivity(image ? "postWithImage" : "postWithoutImage");

            // ✅ Reset form
            setTitle("");
            setContent("");
            setImage(null);
            if (fileInputRef.current) fileInputRef.current.value = "";

            navigate("/feed");
        } catch (error) {
            console.error("❌ Firestore Error:", error);
            Swal.fire({ icon: "error", title: "Post Failed", text: "Something went wrong. Try again." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post-container">
            <h2>Create a New Post</h2>
            <input
                type="text"
                placeholder="Enter a title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="post-title-input"
                disabled={loading}
            />
            <textarea
                placeholder="Share something..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
                disabled={loading}
            />

            {image && (
                <div className="image-preview">
                    <img src={URL.createObjectURL(image)} alt="Preview" className="preview-image" />
                    <button className="remove-image" onClick={() => setImage(null)}>✖</button>
                </div>
            )}

            <button onClick={handlePost} disabled={loading || !content.trim()}>
                {loading ? "Posting..." : "Post"}
            </button>
        </div>
    );
};

export default CreatePost;

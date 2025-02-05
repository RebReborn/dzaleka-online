import React, { useState } from "react";
import { db, auth } from "../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/create-post.css";

const CreatePost = () => {
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Function to upload image to Cloudinary
    const uploadToCloudinary = async (file) => {
        const CLOUDINARY_CLOUD_NAME = "dsanxqxlr"; // Replace with your Cloudinary cloud name
        const CLOUDINARY_UPLOAD_PRESET = "ml_default"; // Replace with your Cloudinary preset

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: formData }
            );

            if (!response.ok) throw new Error(`Cloudinary upload failed: ${response.statusText}`);

            const data = await response.json();
            return data.secure_url; // ✅ Ensure imageUrl is returned
        } catch (error) {
            console.error("Cloudinary Upload Error:", error);
            return null;
        }
    };

    const handlePost = async () => {
        if (!content.trim()) {
            alert("Post content cannot be empty!");
            return;
        }

        setLoading(true);
        let imageUrl = "";

        if (image) {
            imageUrl = await uploadToCloudinary(image);
        }

        await addDoc(collection(db, "posts"), {
            userId: auth.currentUser.uid,
            username: auth.currentUser.displayName || "Anonymous",
            content,
            imageUrl,
            createdAt: Timestamp.now(),
            likes: [],
            comments: [],
        });

        setLoading(false);
        alert("Post created!");
        navigate("/feed");
    };

    return (
        <div className="post-container">
            <h2>Create a New Post</h2>
            <textarea
                placeholder="Share something..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
            />

            {image && (
                <div className="image-preview">
                    <img src={URL.createObjectURL(image)} alt="Preview" className="preview-image" />
                </div>
            )}

            <button onClick={handlePost} disabled={loading}>
                {loading ? "Posting..." : "Post"}
            </button>
        </div>
    );
};

export default CreatePost;

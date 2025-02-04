import React, { useState } from "react";
import { db, storage, auth } from "../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "../styles/create-post.css";


const CreatePost = () => {
    const [content, setContent] = useState("");
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    const handlePost = async () => {
        if (!content.trim()) {
            alert("Post content cannot be empty!");
            return;
        }

        let imageUrl = "";
        if (image) {
            const imageRef = ref(storage, `posts/${auth.currentUser.uid}/${image.name}`);
            await uploadBytes(imageRef, image);
            imageUrl = await getDownloadURL(imageRef);
        }

        await addDoc(collection(db, "posts"), {
            userId: auth.currentUser.uid,
            content,
            imageUrl,
            createdAt: Timestamp.now(),
            likes: 0,
            comments: [],
        });

        alert("Post created!");
        navigate("/feed");
    };

    return (
        <div className="post-container">
            <h2>Create a New Post</h2>
            <textarea placeholder="Share something..." value={content} onChange={(e) => setContent(e.target.value)} />
            <input type="file" onChange={(e) => setImage(e.target.files[0])} />
            <button onClick={handlePost}>Post</button>
        </div>
    );
};

export default CreatePost;

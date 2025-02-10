import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import "../styles/comments.css";

const CommentsSection = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const commentBoxRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (post.comments) {
            setComments(post.comments);
        } else {
            setComments([]);
        }
    }, [post]);

    // ✅ Auto-focus input when comment section opens
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // ✅ Close comment box when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (commentBoxRef.current && !commentBoxRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return;

        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        let username = "Anonymous";
        let userProfilePic = "https://i.pravatar.cc/40";

        if (userSnap.exists()) {
            username = userSnap.data().name || "Anonymous";
            userProfilePic = userSnap.data().photoURL || userProfilePic;
        }

        const newCommentData = {
            userId,
            username,
            text: newComment,
            createdAt: new Date().toISOString(),
            userProfilePic
        };

        const postRef = doc(db, "posts", post.id);
        await updateDoc(postRef, {
            comments: arrayUnion(newCommentData)
        });

        setComments([...comments, newCommentData]);
        setNewComment("");
    };

    return (
        <div className="comment-overlay">
            <div className="comment-box" ref={commentBoxRef}>
                <button className="close-btn" onClick={onClose}>✖</button>
                <h3>Comments</h3>

                {/* ✅ Scrollable Comment List */}
                <div className="comment-list">
                    {comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={index} className="comment-item">
                                <img src={comment.userProfilePic} alt="User" className="comment-profile-pic" />
                                <div className="comment-content">
                                    <strong>{comment.username}</strong>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-comments">No comments yet.</p>
                    )}
                </div>

                {/* ✅ Comment Input Field */}
                <div className="comment-input-box">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="comment-input"
                        ref={inputRef}
                    />
                    <button onClick={handleCommentSubmit} className="comment-btn">Post</button>
                </div>
            </div>
        </div>
    );
};

export default CommentsSection;

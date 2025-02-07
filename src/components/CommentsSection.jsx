import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import "../styles/comments.css";

const CommentsSection = ({ post, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        if (post.comments) {
            setComments(post.comments);
        } else {
            setComments([]);
        }
    }, [post]);

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
            createdAt: new Date(),
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
            <div className="comment-box">
                <button className="close-btn" onClick={onClose}>✖</button>
                <h3>Comments</h3>

                <div className="comment-list">
                    {comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={index} className="comment-item">
                                <img src={comment.userProfilePic} alt="User" className="comment-profile-pic" />
                                <div>
                                    <strong>{comment.username}</strong>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-comments">No comments yet.</p>
                    )}
                </div>

                <div className="comment-input-box">
                    <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="comment-input"
                    />
                    <button onClick={handleCommentSubmit} className="comment-btn">Post</button>
                </div>
            </div>
        </div>
    );
};

export default CommentsSection;

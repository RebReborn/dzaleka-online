import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import "../styles/comments.css"; // Import the new comment styles
import { FaTimes } from "react-icons/fa";

const CommentsSection = ({ postId, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    useEffect(() => {
        const fetchComments = async () => {
            const postRef = doc(db, "posts", postId);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                setComments(postSnap.data().comments || []);
            }
        };

        fetchComments();
    }, [postId]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const user = auth.currentUser;
        if (!user) return;

        const newCommentData = {
            userId: user.uid,
            username: user.displayName || "Anonymous",
            text: newComment,
            createdAt: new Date(),
        };

        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, {
            comments: arrayUnion(newCommentData),
        });

        setComments([...comments, newCommentData]);
        setNewComment("");
    };

    return (
        <div className="comment-modal">
            <div className="modal-content">
                {/* Modal Header */}
                <div className="modal-header">
                    <h3>Comments</h3>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                {/* Comment List */}
                <div className="modal-body">
                    <div className="comments">
                        {comments.length === 0 ? (
                            <p className="no-comments">No comments yet.</p>
                        ) : (
                            comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <div className="commenter-img">
                                        <img src="https://via.placeholder.com/32" alt="User" />
                                    </div>
                                    <div className="comment-content">
                                        <div className="commenter-info">
                                            <h4>{comment.username}</h4>
                                            <span>• Just now</span>
                                        </div>
                                        <p>{comment.text}</p>
                                        <div className="comment-actions">
                                            <button>Like</button>
                                            <button>Reply</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Comment Input */}
                <div className="modal-footer">
                    <form className="comment-form" onSubmit={handleCommentSubmit}>
                        <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit">Post</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CommentsSection;

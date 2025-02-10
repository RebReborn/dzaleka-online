import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const PostDetail = () => {
    const { postId } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) {
            console.error("❌ No Post ID found in URL.");
            return;
        }

        const fetchPost = async () => {
            try {
                console.log(`📩 Fetching post: ${postId}`);
                const postRef = doc(db, "posts", postId);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {
                    setPost({ id: postSnap.id, ...postSnap.data() });
                } else {
                    console.error("⚠️ Post not found.");
                    setPost(null);
                }
            } catch (error) {
                console.error("❌ Error fetching post:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [postId]);

    if (loading) return <p>Loading post...</p>;
    if (!post) return <p>⚠️ Post not found.</p>;

    return (
        <div className="post-container">
            <h2>{post.title || "No Title"}</h2>
            <p>{post.content || "No content available."}</p>
            {post.imageUrl && <img src={post.imageUrl} alt="Post" className="post-image" />}
        </div>
    );
};

export default PostDetail;

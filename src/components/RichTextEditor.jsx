import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Default Quill theme

const RichTextEditor = ({ onSave }) => {
    const [content, setContent] = useState("");

    const handleSave = () => {
        onSave(content); // Pass content back to parent
    };

    return (
        <div className="rich-text-editor">
            <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                placeholder="Write your poem or story here..."
                modules={modules}
                formats={formats}
            />
            <button onClick={handleSave} className="post-button">Post</button>
        </div>
    );
};

// ✅ Configure Toolbar Options
const modules = {
    toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ align: [] }],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
    ],
};

const formats = [
    "font",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "align",
    "color",
    "background",
    "list",
    "bullet",
    "blockquote",
    "code-block",
    "link",
    "image",
];

export default RichTextEditor;

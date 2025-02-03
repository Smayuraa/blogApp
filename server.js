const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const path = require('path');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔹 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
        process.exit(1); // Exit the application if MongoDB connection fails
    });

const BlogSchema = new mongoose.Schema({
    title: String,
    content: String,
    imageUrl: String
});

const Blog = mongoose.model("Blog", BlogSchema);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 API Routes
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Create Blog Post
app.post("/blogs", upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;

        // Upload the image to Cloudinary
        const image = req.file;
        let imageUrl = "";

        if (image) {
            const result = await cloudinary.uploader.upload(image.path);
            imageUrl = result.secure_url;

            // Delete the image from the local directory after uploading to Cloudinary
            fs.unlinkSync(image.path);
        }

        const newBlog = new Blog({ title, content, imageUrl });
        await newBlog.save();
        res.json({ message: "Blog Created", blog: newBlog });
    } catch (err) {
        console.error("Error creating blog:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

// ✅ Get All Blogs
app.get("/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.json(blogs);
    } catch (err) {
        console.error("Error fetching blogs:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

// ✅ Get Single Blog by ID
app.get("/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        res.json(blog);
    } catch (err) {
        console.error("Error fetching blog by ID:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

// ✅ Update Blog
app.put("/blogs/:id", async (req, res) => {
    try {
        const { title, content } = req.body;
        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, { title, content }, { new: true });

        if (!updatedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json({ message: "Blog Updated", blog: updatedBlog });
    } catch (err) {
        console.error("Error updating blog:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});

// ✅ Delete Blog
app.delete("/blogs/:id", async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

        if (!deletedBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json({ message: "Blog Deleted" });
    } catch (err) {
        console.error("Error deleting blog:", err);
        res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
});
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);
console.log("Cloudinary Config:", process.env.CLOUDINARY_CLOUD_NAME);

// 🔹 Server Listen
app.listen(5000, () => console.log("Server running on http://localhost:5000"));

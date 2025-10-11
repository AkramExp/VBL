const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.log('MongoDB connection error:', error));

// Middleware
app.use(cors({ origin: "https://ivl-vbl.vercel.app" }));
app.use(express.json());

// Use organized routes
app.use('/api', require('./routes'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

require('./models/database');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const commentRoutes = require('./routes/comments');
const reservationRoutes = require('./routes/reservations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} ${req.method} ${req.path}`);
    next();
});

// Serve static files with proper headers
app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: '1d', // Cache static assets for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        // Set proper MIME types for CSS and JS files
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache'); // Don't cache HTML files
        }
    }
}));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/reservations', reservationRoutes);

app.get('/api/health', (req, res) => {
    res.json({ message: 'FitStyle API is running!' });
});

// Handle 404 for API routes that don't exist
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        next();
    }
});

// Catch-all handler: send back index.html file for any non-API routes
// This enables client-side routing for the SPA
app.use((req, res) => {
    console.log(`Serving index.html for route: ${req.path}`);
    res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
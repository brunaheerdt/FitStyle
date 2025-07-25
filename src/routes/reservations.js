const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { product_id, contact_email, contact_phone, notes } = req.body;
        
        if (!product_id || !contact_email) {
            return res.status(400).json({ error: 'Product ID and contact email are required' });
        }
        
        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const existingReservation = await Reservation.checkExistingReservation(product_id, req.user.id);
        if (existingReservation) {
            return res.status(400).json({ error: 'You already have an active reservation for this product' });
        }
        
        const newReservation = await Reservation.create({
            product_id,
            user_id: req.user.id,
            contact_email,
            contact_phone: contact_phone || null,
            notes: notes || null
        });
        
        res.status(201).json({
            message: 'Reservation made successfully! The owner will contact you soon.',
            reservation: newReservation
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const reservations = await Reservation.getByUserId(req.user.id);
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching user reservations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reservations = await Reservation.getAll();
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching all reservations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/product/:productId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productId = req.params.productId;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const reservations = await Reservation.getByProductId(productId);
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching product reservations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reservationId = req.params.id;
        const { status } = req.body;
        
        const validStatuses = ['pending', 'contacted', 'completed', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Valid status is required', 
                validStatuses 
            });
        }
        
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        const result = await Reservation.updateStatus(reservationId, status);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        res.json({ 
            message: 'Reservation status updated successfully',
            status 
        });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const reservationId = req.params.id;
        
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You can only cancel your own reservations' });
        }
        
        const result = await Reservation.delete(reservationId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Reservation not found' });
        }
        
        res.json({ message: 'Reservation cancelled successfully' });
    } catch (error) {
        console.error('Error deleting reservation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
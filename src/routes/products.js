const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const products = await Product.getAll();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.getWithComments(productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, brand, image_url, price, size, color } = req.body;
        
        if (!name || !description || !brand) {
            return res.status(400).json({ error: 'Name, description, and brand are required' });
        }
        
        const newProduct = await Product.create({
            name,
            description,
            brand,
            image_url,
            price,
            size,
            color
        });
        
        res.status(201).json({
            message: 'Product created successfully',
            product: newProduct
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, description, brand, image_url, price, size, color } = req.body;
        
        if (!name || !description || !brand) {
            return res.status(400).json({ error: 'Name, description, and brand are required' });
        }
        
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const result = await Product.update(productId, {
            name,
            description,
            brand,
            image_url,
            price,
            size,
            color
        });
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const updatedProduct = await Product.findById(productId);
        res.json({
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        
        const existingProduct = await Product.findById(productId);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const result = await Product.delete(productId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
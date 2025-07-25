const db = require('./database');

class Product {
    static async create(productData) {
        return new Promise((resolve, reject) => {
            const { name, description, brand, image_url, price, size, color } = productData;
            
            const sql = `INSERT INTO products (name, description, brand, image_url, price, size, color) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [name, description, brand, image_url, price, size, color], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...productData });
                }
            });
        });
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM products ORDER BY created_at DESC`;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM products WHERE id = ?`;
            
            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async update(id, productData) {
        return new Promise((resolve, reject) => {
            const { name, description, brand, image_url, price, size, color } = productData;
            
            const sql = `UPDATE products 
                        SET name = ?, description = ?, brand = ?, image_url = ?, 
                            price = ?, size = ?, color = ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?`;
            
            db.run(sql, [name, description, brand, image_url, price, size, color, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM products WHERE id = ?`;
            
            db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    static async getWithComments(id) {
        return new Promise(async (resolve, reject) => {
            try {
                const productSql = `SELECT * FROM products WHERE id = ?`;
                
                db.get(productSql, [id], async (err, product) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!product) {
                        resolve(null);
                        return;
                    }
                    
                    try {
                        // Use Comment model to get properly nested comments
                        const Comment = require('./Comment');
                        const comments = await Comment.getByProductId(id);
                        resolve({ ...product, comments });
                    } catch (commentErr) {
                        reject(commentErr);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = Product;
const db = require('./database');

class Reservation {
    static async create(reservationData) {
        return new Promise((resolve, reject) => {
            const { product_id, user_id, contact_email, contact_phone, notes } = reservationData;
            
            const sql = `INSERT INTO reservations (product_id, user_id, contact_email, contact_phone, notes) 
                        VALUES (?, ?, ?, ?, ?)`;
            
            db.run(sql, [product_id, user_id, contact_email, contact_phone, notes], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...reservationData });
                }
            });
        });
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.username, u.email as user_email, p.name as product_name, p.brand, p.price 
                FROM reservations r 
                JOIN users u ON r.user_id = u.id 
                JOIN products p ON r.product_id = p.id 
                ORDER BY r.created_at DESC
            `;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, p.name as product_name, p.brand, p.price, p.image_url 
                FROM reservations r 
                JOIN products p ON r.product_id = p.id 
                WHERE r.user_id = ? 
                ORDER BY r.created_at DESC
            `;
            
            db.all(sql, [userId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async getByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.username, u.email as user_email 
                FROM reservations r 
                JOIN users u ON r.user_id = u.id 
                WHERE r.product_id = ? 
                ORDER BY r.created_at DESC
            `;
            
            db.all(sql, [productId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE reservations SET status = ? WHERE id = ?`;
            
            db.run(sql, [status, id], function(err) {
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
            const sql = `DELETE FROM reservations WHERE id = ?`;
            
            db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT r.*, u.username, u.email as user_email, p.name as product_name, p.brand 
                FROM reservations r 
                JOIN users u ON r.user_id = u.id 
                JOIN products p ON r.product_id = p.id 
                WHERE r.id = ?
            `;
            
            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async checkExistingReservation(productId, userId) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id FROM reservations WHERE product_id = ? AND user_id = ? AND status != 'cancelled'`;
            
            db.get(sql, [productId, userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = Reservation;
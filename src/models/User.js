const db = require('./database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        return new Promise((resolve, reject) => {
            const { username, email, password, role = 'user' } = userData;

            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    reject(err);
                    return;
                }

                const sql = `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;

                db.run(sql, [username, email, hashedPassword, role], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, username, email, role });
                    }
                });
            });
        });
    }

    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE email = ?`;

            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, username, email, role, created_at FROM users WHERE id = ?`;

            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC`;

            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static async updateRole(userId, newRole) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET role = ? WHERE id = ?`;

            db.run(sql, [newRole, userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    static async updateUser(userId, userData) {
        return new Promise((resolve, reject) => {
            const { username, email } = userData;
            const sql = `UPDATE users SET username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

            db.run(sql, [username, email, userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    User.findById(userId).then(resolve).catch(reject);
                }
            });
        });
    }

    static async deleteUser(userId) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM users WHERE id = ?`;

            db.run(sql, [userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    static async toggleUserStatus(userId, isActive) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_active = ? WHERE id = ?`;

            db.run(sql, [isActive, userId], function (err) {
                if (err) {
                    reject(err);
                } else {
                    User.findById(userId).then(resolve).catch(reject);
                }
            });
        });
    }

    static async getUserStats(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.role,
                    u.created_at,
                    COUNT(DISTINCT c.id) as comment_count,
                    COUNT(DISTINCT r.id) as reservation_count
                FROM users u
                LEFT JOIN comments c ON u.id = c.user_id
                LEFT JOIN reservations r ON u.id = r.user_id
                WHERE u.id = ?
                GROUP BY u.id
            `;

            db.get(sql, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static async getAllWithStats() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.role,
                    u.created_at,
                    u.is_active,
                    COUNT(DISTINCT c.id) as comment_count,
                    COUNT(DISTINCT r.id) as reservation_count
                FROM users u
                LEFT JOIN comments c ON u.id = c.user_id
                LEFT JOIN reservations r ON u.id = r.user_id
                GROUP BY u.id
                ORDER BY u.created_at DESC
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
}

module.exports = User;

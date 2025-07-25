const db = require('./database');

class Comment {
    static async create(commentData) {
        return new Promise((resolve, reject) => {
            const { product_id, user_id, content, status, parent_id = null } = commentData;
            
            // Calculate level based on parent
            if (parent_id) {
                const getParentLevel = `SELECT level FROM comments WHERE id = ?`;
                db.get(getParentLevel, [parent_id], (err, parent) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const level = parent ? Math.min(parent.level + 1, 2) : 0; // Max 3 levels (0, 1, 2)
                    const sql = `INSERT INTO comments (product_id, user_id, content, status, parent_id, level) VALUES (?, ?, ?, ?, ?, ?)`;
                    
                    db.run(sql, [product_id, user_id, content, status, parent_id, level], function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ id: this.lastID, ...commentData, level });
                        }
                    });
                });
            } else {
                const sql = `INSERT INTO comments (product_id, user_id, content, status, parent_id, level) VALUES (?, ?, ?, ?, ?, ?)`;
                
                db.run(sql, [product_id, user_id, content, status, null, 0], function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...commentData, level: 0 });
                    }
                });
            }
        });
    }

    static async getByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, u.username 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.product_id = ? 
                ORDER BY 
                    CASE WHEN c.parent_id IS NULL THEN c.created_at ELSE 
                        (SELECT created_at FROM comments WHERE id = c.parent_id) END DESC,
                    c.parent_id IS NULL DESC,
                    c.created_at DESC
            `;

            db.all(sql, [productId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Organize comments into nested structure
                    const nestedComments = this.buildNestedStructure(rows);
                    resolve(nestedComments);
                }
            });
        });
    }

    static buildNestedStructure(comments) {
        const commentMap = new Map();
        const rootComments = [];

        // First pass: create comment objects and map them
        comments.forEach(comment => {
            comment.replies = [];
            commentMap.set(comment.id, comment);
        });

        // Second pass: build the nested structure
        comments.forEach(comment => {
            if (comment.parent_id === null) {
                rootComments.push(comment);
            } else {
                const parent = commentMap.get(comment.parent_id);
                if (parent) {
                    parent.replies.push(comment);
                }
            }
        });

        // Third pass: sort replies within each comment thread by newest first
        const sortReplies = (comments) => {
            comments.forEach(comment => {
                if (comment.replies.length > 0) {
                    comment.replies.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    sortReplies(comment.replies);
                }
            });
        };

        sortReplies(rootComments);
        return rootComments;
    }

    static async getAll() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, u.username, p.name as product_name 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN products p ON c.product_id = p.id 
                ORDER BY c.created_at DESC
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

    static async delete(id) {
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM comments WHERE id = ?`;

            db.run(sql, [id], function (err) {
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
                SELECT c.*, u.username, p.name as product_name 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN products p ON c.product_id = p.id 
                WHERE c.id = ?
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

    static async update(id, content) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

            db.run(sql, [content, id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    Comment.findById(id).then(resolve).catch(reject);
                }
            });
        });
    }

    static async moderate(id, action, reason = null) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE comments SET status = ?, moderation_reason = ?, moderated_at = CURRENT_TIMESTAMP WHERE id = ?`;

            db.run(sql, [action, reason, id], function (err) {
                if (err) {
                    reject(err);
                } else {
                    Comment.findById(id).then(resolve).catch(reject);
                }
            });
        });
    }

    static async getByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, u.username, p.name as product_name 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = ? 
                ORDER BY c.created_at DESC
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
}

module.exports = Comment;

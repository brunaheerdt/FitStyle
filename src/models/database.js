const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database/fitstyle.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeTables();
    }
});

function initializeTables() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            brand TEXT NOT NULL,
            image_url TEXT,
            price TEXT,
            size TEXT,
            color TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            moderation_reason TEXT NULLABLE,
            moderated_at DATETIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            contact_email TEXT NOT NULL,
            contact_phone TEXT,
            notes TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'completed', 'cancelled')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`
    ];

    tables.forEach((tableSQL, index) => {
        db.run(tableSQL, (err) => {
            if (err) {
                console.error(`Error creating table ${index + 1}:`, err.message);
            } else {
                console.log(`Table ${index + 1} initialized successfully`);
            }
        });
    });

    insertSampleData();
}

function insertSampleData() {
    db.get("SELECT COUNT(*) as count FROM products", async (err, row) => {
        if (err) {
            console.error('Error checking products:', err.message);
            return;
        }

        if (row.count === 0) {
            const sampleProducts = [
                {
                    name: "Brazilian Activewear Top",
                    description: "Stylish Brazilian fitness top with vibrant colors and comfortable fit",
                    brand: "Fitness Brasil",
                    image_url: "/images/sample-top.jpg",
                    price: "€35",
                    size: "M",
                    color: "Tropical Green"
                },
                {
                    name: "Rio Beach Leggings",
                    description: "High-waisted leggings inspired by Rio's beach culture",
                    brand: "Rio Active",
                    image_url: "/images/sample-leggings.jpg",
                    price: "€45",
                    size: "S",
                    color: "Ocean Blue"
                },
                {
                    name: "Capoeira Movement Shorts",
                    description: "Flexible shorts designed for capoeira and fitness movements",
                    brand: "Movimento",
                    image_url: "/images/sample-shorts.jpg",
                    price: "€30",
                    size: "L",
                    color: "Sunset Orange"
                }
            ];

            const insertProduct = db.prepare(`
                INSERT INTO products (name, description, brand, image_url, price, size, color)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            sampleProducts.forEach(product => {
                insertProduct.run([
                    product.name,
                    product.description,
                    product.brand,
                    product.image_url,
                    product.price,
                    product.size,
                    product.color
                ], (err) => {
                    if (err) {
                        console.error('Error inserting sample product:', err.message);
                    }
                });
            });

            insertProduct.finalize(() => {
                console.log('Sample products inserted successfully');
            });

        }
        db.all("SELECT * FROM users where username = 'admin'", (err, row) => {
            if (err) {
                console.error('Error checking users:', err.message);
                return;
            }

            console.log('Users count:', row);

            if (row.length === 0) {

                const sampleUsers = [
                    {
                        username: "admin",
                        email: "admin@fitstyle.com",
                        password: "admin123",
                        role: "admin"
                    }
                ];

                const insertUser = db.prepare(`
                INSERT INTO users (username, email, password_hash, role)
                VALUES (?, ?, ?, ?)
            `);

                sampleUsers.forEach(user => {
                    bcrypt.hash(user.password, 10, (err, hashedPassword) => {
                        if (err) {
                            console.error('Error hashing password:', err.message);
                            return;
                        }
                        insertUser.run([
                            user.username,
                            user.email,
                            hashedPassword,
                            user.role
                        ], (err) => {
                            if (err) {
                                console.error('Error inserting sample user:', err.message);
                            }
                        });
                    });
                });
            }
        });
    });
}

module.exports = db;

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

        `DROP TABLE IF EXISTS products; CREATE TABLE IF NOT EXISTS products (
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
            parent_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
            level INTEGER DEFAULT 0,
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
                        "name": "Top Fitness Feminino Preto com Bojo Aura",
                        "description": "Top fitness preto com sustentação, ideal para treinos intensos. Confeccionado com tecido de alta performance e tecnologia dry-fit.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/top-fitness-feminino-preto-com-bojo-aura-dlk-84314/311347.jpg?w=1000&h=1428&v=202506301526",
                        "price": "R$ 55,79",
                        "size": "P/M/G",
                        "color": "Preto",
                    },
                    {
                        "name": "Bermuda de Treino Feminina com Bolsos",
                        "description": "Bermuda de treino preta com bolsos laterais, perfeita para academia e atividades ao ar livre. Tecido respirável e confortável.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/bermuda-de-treino-feminina-preta-com-bolsos-basica-dlk-84529/312186.jpg?w=1000&h=1428&v=202506021156",
                        "price": "R$ 86,39",
                        "size": "P/M/G/GG",
                        "color": "Preto",
                    },
                    {
                        "name": "Macaquinho Fitness com Zíper e Recortes Aura",
                        "description": "Macaquinho fitness preto moderno com zíper frontal e recortes estratégicos. Peça versátil para treinos e uso casual.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/macaquinho-fitness-feminino-preto-com-ziper-e-recortes-aura-dlk-84528/312180.jpg?w=1000&h=1428&v=202505261400",
                        "price": "R$ 129,59",
                        "size": "P/M/G",
                        "color": "Preto",
                    },
                    {
                        "name": "Legging Seamless+ Feminina Energy",
                        "description": "Legging sem costura com tecnologia energy, proporcionando máximo conforto e liberdade de movimento. Cintura alta modeladora.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/calca-legging-happiness-com-elastico-lateral-grafite-dlk-79495/293681.jpg?w=1000&h=1428&v=202501231555",
                        "price": "R$ 98,50",
                        "size": "P/M/G/GG",
                        "color": "Verde Militar",
                    },
                    {
                        "name": "Top fitness feminino terracota com decote v transpassado lush dlk",
                        "description": "Top cropped com estampa tropical brasileira, ideal para yoga e pilates. Tecido macio e elástico com proteção UV.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/top-fitness-feminino-terracota-com-decote-v-transpassado-lush-dlk-84544/312242.jpg?w=1000&h=1428&v=202507210916",
                        "price": "R$ 42,90",
                        "size": "P/M/G",
                        "color": "Estampado Tropical",
                    },
                    {
                        "name": "Conjunto Fitness Feminino Crossfit",
                        "description": "Conjunto completo para crossfit com top de alta sustentação e legging compressora. Performance e estilo em uma peça só.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/short-fitness-feminino-preto-com-recorte-canelado-seamless-dlk-83020/306738.jpg?w=1000&h=1428&v=no-value",
                        "price": "R$ 156,80",
                        "size": "P/M/G",
                        "color": "Preto",
                    },
                    {
                        "name": "Cropped regata feminino off white canelado lush dlk",
                        "description": "Regata fitness com tecnologia dry-fit, tecido que absorve o suor e seca rapidamente. Ideal para corrida e academia.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/cropped-regata-feminino-off-white-canelado-lush-dlk-84311/311334.jpg?w=1000&h=1428&v=202504031528",
                        "price": "R$ 38,70",
                        "size": "P/M/G/GG",
                        "color": "White",
                    },
                    {
                        "name": "Calça Legging Fitness Cintura Alta",
                        "description": "Legging de cintura alta modeladora com compressão gradual. Tecido premium com proteção UV e toque aveludado.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/calca-legging-happiness-basica-com-brilho-cereja-dlk-79370/293254.jpg?w=1000&h=1428&v=202504231634",
                        "price": "R$ 112,40",
                        "size": "P/M/G/GG",
                        "color": "Vinho",
                    },
                    {
                        "name": "Short Saia Fitness Feminino",
                        "description": "Short saia fitness com shorts interno, perfeito para tênis e atividades esportivas. Design moderno e feminino.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/short-saia-feminino-preto-com-recortes-em-tela-harmony-dlk-83803/309400.jpg?w=1000&h=1428&v=202501231555",
                        "price": "R$ 67,90",
                        "size": "P/M/G",
                        "color": "Preto com detalhes brancos",
                    },
                    {
                        "name": "Top Fitness Feminino Longline Aura",
                        "description": "Top longline com sustentação média, ideal para yoga e pilates. Acabamento sem costura e tecnologia antibacteriana.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/top-fitness-feminino-nude-com-franzido-lush-dlk-84540/312226.jpg?w=1000&h=1428&v=202506120958",
                        "price": "R$ 71,25",
                        "size": "P/M/G",
                        "color": "Nude",
                    },
                    {
                        "name": "Bermuda Ciclista Fitness Básica",
                        "description": "Bermuda ciclista básica de alta compressão, ideal para musculação e treinos funcionais. Não marca e não enrola.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/bermuda-modelo-ciclista-happiness-com-bolso-preta-e-prata-dlk-79514/293753.jpg?w=1000&h=1428&v=no-value",
                        "price": "R$ 53,60",
                        "size": "P/M/G/GG",
                        "color": "Grafite",
                    },
                    {
                        "name": "Body Fitness Feminino Energy",
                        "description": "Body fitness com recortes estratégicos e tule nas laterais. Peça sofisticada para aulas de dança e zumba.",
                        "brand": "DLK Modas",
                        "image_url": "https://dlkmodas.fbitsstatic.net/img/p/body-fitness-feminino-preto-manga-longa-com-ziper-harmony-dlk-83786/309340.jpg?w=1000&h=1428&v=202501231555",
                        "price": "R$ 143,20",
                        "size": "P/M/G",
                        "color": "Preto com tule",
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

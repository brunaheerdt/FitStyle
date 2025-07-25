const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'fitstyle.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Starting comments migration for nested replies...');

// Add parent_id column to comments table
db.serialize(() => {
    // Add parent_id column if it doesn't exist
    db.run(`ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('✅ parent_id column already exists');
            } else {
                console.error('❌ Error adding parent_id column:', err.message);
            }
        } else {
            console.log('✅ Added parent_id column to comments table');
        }
        
        // Add level column to track nesting depth
        db.run(`ALTER TABLE comments ADD COLUMN level INTEGER DEFAULT 0`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log('✅ level column already exists');
                } else {
                    console.error('❌ Error adding level column:', err.message);
                }
            } else {
                console.log('✅ Added level column to comments table');
            }
            
            // Create indexes for better performance
            db.run(`CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id)`, (err) => {
                if (err) {
                    console.error('❌ Error creating parent_id index:', err.message);
                } else {
                    console.log('✅ Created index for parent_id column');
                }
                
                db.run(`CREATE INDEX IF NOT EXISTS idx_comments_product_parent ON comments(product_id, parent_id)`, (err) => {
                    if (err) {
                        console.error('❌ Error creating composite index:', err.message);
                    } else {
                        console.log('✅ Created composite index for product_id and parent_id');
                    }
                    
                    // Close database after all operations
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('🎉 Comments migration completed successfully!');
                        }
                    });
                });
            });
        });
    });
});


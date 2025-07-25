const http = require('http');

const testRoutes = [
    '/',
    '/products', 
    '/profile',
    '/admin',
    '/admin/users',
    '/admin/comments',
    '/product/123',
    '/api/health',
    '/api/nonexistent'
];

const port = 3000;

async function testRoute(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    path,
                    status: res.statusCode,
                    contentType: res.headers['content-type'],
                    isHTML: data.includes('<html>'),
                    isJSON: res.headers['content-type']?.includes('application/json')
                });
            });
        });

        req.on('error', (e) => {
            resolve({
                path,
                error: e.message
            });
        });

        req.end();
    });
}

async function runTests() {
    console.log('Testing frontend route handling...\n');
    
    for (const route of testRoutes) {
        try {
            const result = await testRoute(route);
            
            if (result.error) {
                console.log(`❌ ${route}: Error - ${result.error}`);
            } else if (route.startsWith('/api/')) {
                // API routes should return JSON
                if (result.isJSON) {
                    console.log(`✅ ${route}: API route working (${result.status})`);
                } else {
                    console.log(`⚠️  ${route}: Expected JSON response (${result.status})`);
                }
            } else {
                // Frontend routes should return HTML
                if (result.isHTML && result.status === 200) {
                    console.log(`✅ ${route}: Frontend route working (${result.status})`);
                } else {
                    console.log(`⚠️  ${route}: Expected HTML response (${result.status})`);
                }
            }
        } catch (error) {
            console.log(`❌ ${route}: ${error.message}`);
        }
    }
    
    console.log('\nRoute testing complete!');
}

runTests();
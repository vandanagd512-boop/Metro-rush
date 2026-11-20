const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

let PORT = 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function createServer() {
    const server = http.createServer((req, res) => {
        let reqUrl = req.url.split('?')[0];
        if (reqUrl === '/') reqUrl = '/index.html';

        const safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
        const filePath = path.join(BASE_DIR, safePath);

        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found');
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*'
            });

            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        });
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} in use, trying ${PORT + 1}...`);
            PORT++;
            server.listen(PORT, '0.0.0.0');
        } else {
            console.error('Server error:', err);
        }
    });

    function getLocalIpAddresses() {
        const interfaces = os.networkInterfaces();
        const ips = [];
        for (const name of Object.keys(interfaces)) {
            for (const net of interfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    ips.push(net.address);
                }
            }
        }
        return ips;
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log('======================================================');
        console.log('  METRO RUSH: SKYRAIL SURGE - ACTIVE GAME SERVER');
        console.log('======================================================');
        console.log(`\n> Desktop Browser:    http://localhost:${PORT}`);
        const localIps = getLocalIpAddresses();
        if (localIps.length > 0) {
            console.log('> Mobile / Phone (Wi-Fi):');
            localIps.forEach(ip => {
                console.log(`   http://${ip}:${PORT}`);
            });
        }
        console.log('\nGame is live and ready to play!\n');
    });
}

createServer();

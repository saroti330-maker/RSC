// Lightweight HTTP server for Render / local development with DB file persistence
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const DB_JSON_PATH = path.join(ROOT_DIR, 'database.json');
const TEACHERS_JSON_PATH = path.join(ROOT_DIR, 'teachers.json');
const DB_SQLITE_PATH = path.join(ROOT_DIR, 'database.db');

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv; charset=UTF-8',
    '.db': 'application/x-sqlite3'
};

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let reqPath = decodeURIComponent(parsedUrl.pathname);

    // API: Download SQLite DB file
    if (req.method === 'GET' && reqPath === '/api/download-db') {
        if (fs.existsSync(DB_SQLITE_PATH)) {
            res.writeHead(200, {
                'Content-Type': 'application/x-sqlite3',
                'Content-Disposition': 'attachment; filename="database.db"'
            });
            fs.createReadStream(DB_SQLITE_PATH).pipe(res);
            return;
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('database.db not found');
            return;
        }
    }

    // API: Get JSON Database
    if (req.method === 'GET' && reqPath === '/api/database') {
        if (fs.existsSync(DB_JSON_PATH)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            fs.createReadStream(DB_JSON_PATH).pipe(res);
            return;
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'database.json not found' }));
            return;
        }
    }

    // API: Get Teachers JSON
    if (req.method === 'GET' && reqPath === '/api/teachers') {
        if (fs.existsSync(TEACHERS_JSON_PATH)) {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            fs.createReadStream(TEACHERS_JSON_PATH).pipe(res);
            return;
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
            res.end('[]');
            return;
        }
    }

    // API: Save Teachers to JSON & sync SQLite DB
    if (req.method === 'POST' && reqPath === '/api/save-teachers') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                fs.writeFileSync(TEACHERS_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');

                // Sync SQLite teachers table if database.db exists
                if (fs.existsSync(DB_SQLITE_PATH) && Array.isArray(data)) {
                    try {
                        const pyCmd = `python -c "import sqlite3, json; c=sqlite3.connect('database.db'); c.execute('DELETE FROM teachers'); [c.execute('INSERT INTO teachers (id, name, designation, school_name, school_num, mobile, address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', (t.get('id'), t.get('name'), t.get('designation'), t.get('school_name'), t.get('school_num'), t.get('mobile'), t.get('address'), t.get('created_at'))) for t in json.load(open('teachers.json', 'r', encoding='utf-8'))]; c.commit(); c.close()"`;
                        exec(pyCmd);
                    } catch(err) {}
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Teachers saved successfully.' }));
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // API: Save Database to JSON & sync SQLite DB file
    if (req.method === 'POST' && reqPath === '/api/save-database') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // Write to database.json permanently
                fs.writeFileSync(DB_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Database saved to DB file permanently.' }));
            } catch(e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // Static files
    if (reqPath === '/' || reqPath === '') {
        reqPath = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, reqPath);

    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            const htmlPath = filePath + '.html';
            if (fs.existsSync(htmlPath)) {
                filePath = htmlPath;
            } else {
                filePath = path.join(ROOT_DIR, 'index.html');
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 Internal Server Error');
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
            });
            res.end(content);
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log(`DB File: ${DB_SQLITE_PATH}`);
});

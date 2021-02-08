const http = require('http');
const https = require('https');

function requestAPI (options, conn, data) {
    return new Promise((resolve, reject) => {
        let req;

        // send request
        if (conn) {
            // send https request
            conn = 'https';
            req = https.request(options, (res) => {
                if (options.method === 'GET')
                    handleGetRequest(res, resolve);
            });
        } else {
            // send http request
            conn = 'http';
            req = http.request(options, (res) => {
                if (options.method === 'GET')
                    handleGetRequest(res, resolve);
            });
        }
    
        // error handler
        req.on("error", (err) => reject(new Error(`Error upon ${conn} ${options.method} request: ${err.message}`)));
    
        // write data
        if (options.method != 'GET') {
            req.write(data);
        }
        
        // close connection
        req.end();
    });
}

function handleGetRequest (res, resolve) {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => resolve(data));
}

module.exports = requestAPI;

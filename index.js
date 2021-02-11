const fs = require('fs').promises;
const rpio = require('rpio');
const mariadb = require('mariadb');
const rc522 = require('./build/Debug/rfid_rc522');

/* ====== Setup ====== */

const dTypes = {
    IN: 'IN',
    OUT: 'OUT',
    PAY: 'PAY'
}

let device;
let stationId;

setup();

async function setup () {
    try {
        // read setup file and set device options
        const data = await fs.readFile('./src/setup.json', {encoding: 'utf8'});
        const options = JSON.parse(data);

        device = options.dType;
        stationId = options.stationId;
    } catch (err) {
        console.error(`Error reading setup file: ${err}`);
    }

    try {
        // set default for LEDs to LOW
        if (device != dTypes.PAY) {
            rpio.open(3, rpio.OUTPUT, rpio.LOW);
            rpio.open(5, rpio.OUTPUT, rpio.LOW);
        }
    } catch (err) {
        console.error(`Error setting LEDs default LOW: ${err}`);
    }

    try {
        // monitor tag
        setInterval(checkForTag, 20);
        console.log('Searching for tags ...');
    } catch (err) {
        console.error(`Error monitoring tokens: ${err}`);
    }
}


/* ====== Detect tags and read UID ====== */

let gCurrentTag = undefined;

function checkForTag () {
    let ret = rc522.checkForTag();

    if ((ret === undefined) && (gCurrentTag !== undefined)) {
        // We have a tag, and there isn't one on the reader
        console.log('tagRemoved', gCurrentTag);
        gCurrentTag = undefined;
    } else if ((ret !== undefined) && (gCurrentTag === undefined)) {
        // We don't have a tag, but there's one on the reader
        gCurrentTag = ret;
        tagDetected(gCurrentTag);
    }
}

/* ====== Act upon tag detection depending on device type ====== */

async function tagDetected (id) {
    console.log(`Tag with UID ${id} detected.`);

    switch (device) {
        case dTypes.IN:
            checkIn(id);
            break;
        case dTypes.OUT:
            checkOut(id);
            blink('green');
            break;
        case dTypes.PAY:
            pay(id);
            break;
    }
}

async function checkIn (tagId) {
    console.log('check in');
    if (tagId != 2) {
        const res = await queryDatabase(`INSERT INTO journey_log(token_id, station_id) values('${tagId}', ${stationId})`);
        console.log(JSON.stringify(res));
        const result = res.toString();
        console.log(result);
        if (result.includes('OkPacket')) {
            blink('green');
        } else {
            blink('red');
        }
    }
}

async function checkOut (tagId) {
    console.log('check out');
    queryDatabase("SELECT station_id FROM journey_log WHERE token_id = '?'", tagId);
}

async function pay (tagId) {
    console.log('pay');
    queryDatabase(`INSERT INTO journey_log(token_id, station_id) values('${tagId}', ${stationId})`);
}

/* ====== Hardware related actions ====== */

function blink (colour) {
    if (colour === 'red') {
        rpio.write(5, rpio.HIGH);
        rpio.sleep(1);
        rpio.write(5, rpio.LOW);
    } else if (colour === 'green') {
        rpio.write(3, rpio.HIGH);
        rpio.sleep(1);
        rpio.write(3, rpio.LOW);
    }
}

/* ====== Database connection ====== */
// buildt upon example code from https://mariadb.com/kb/en/getting-started-with-the-nodejs-connector/

const pool = mariadb.createPool({
     host: '10.0.0.175', 
     user:'pi', 
     password: 'raspberry',
     database: 'go',
     connectionLimit: 5
});

async function queryDatabase(query) {
    let conn;
    let res;
    try {
	    conn = await pool.getConnection();
        res = conn.query(query);
    } catch (err) {
        console.error(`Error querying database: ${err}`);
    } finally {
        conn.end();
        return res;
    }
}

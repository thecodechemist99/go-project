const rpio = require('rpio');
const mariadb = require('mariadb');
const rc522 = require('./build/Debug/rfid_rc522');

/* ====== Detect tags and read UID ====== */

let gCurrentTag = undefined;
console.log('Searching for tags ...');

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

// monitor tag
setInterval(checkForTag, 20);

/* ====== Act upon tag detection depending on device type ====== */

const dTypes = {
    IN: 0,
    OUT: 1,
    PAY: 2
}
rpio.open(3, rpio.OUTPUT, rpio.LOW);
rpio.open(5, rpio.OUTPUT, rpio.LOW);

////// Device Settings //////
const device = dTypes.IN;
const stationId = 0;
/////////////////////////////

function tagDetected (id) {
    console.log(`Tag with UID ${id} detected.`);
    blink('green');

    switch (device) {
        case dTypes.IN:
            checkIn(id);
            break;
        case dTypes.OUT:
            checkOut(id);
            break;
        case dTypes.PAY:
            pay(id);
            break;
    }
}

async function checkIn (tagId) {
    queryDatabase("INSERT INTO journey_log(token_id, station_id) value(?, ?)", [tagId, stationId]);
}

async function checkOut (tagId) {
    queryDatabase("SELECT * FROM journey_log WHERE token_id = '?'", tagId);
}

async function pay (tagId) {
    queryDatabase("INSERT INTO journey_log(token_id, station_id) value(?, ?)", [tagId, stationId]);
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
     connectionLimit: 5
});

async function queryDatabase(query, vars) {
    let conn;
    try {
	    conn = await pool.getConnection();
	    const res = await conn.query(query, vars);
	    console.log(res);
    } catch (err) {
        console.error(`Error querying database: ${err}`);
    } finally {
        if (conn) return conn.end();
    }
}

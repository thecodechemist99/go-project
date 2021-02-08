const rpio = require('rpio');
const rc522 = require('./build/Debug/rfid_rc522');
const requestApi = require('./src/requestApi');

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
        readPage(4);
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

const device = dTypes.IN;
const stationId = 0;

function tagDetected (id) {
    console.log(`Tag with UID ${id} detected.`);
    blink('green');

    switch (device) {
        case 0:
            checkIn(id);
            break;
        case 1:
            checkOut(id);
            break;
        case 2:
            pay(id);
            break;
    }
}

function checkIn () {
//    checkApi();
}

function checkOut () {
//    checkApi();
}

function pay () {
//    checkApi();
}

function blink (colour) {
    if (colour === 'red') {
        rpio.write(5, rpio.HIGH);
        setTimeout(() => {
            rpio.write(5, rpio.LOW);
        }, 100);
    } else if (colour === 'green') {
        rpio.write(3, rpio.HIGH);
        setTimeout(() => {
            rpio.write(3, rpio.LOW);
        }, 100);
    }
}

async function checkApi (params) {
    // set request options
    const options = {
        hostname: '10.0.0.175:port',
        path: '/note?query=' + encodeURI(query),
        method: 'GET'
    };
    
    // send request
    const data = await requestApi(options, config.https, null);
    const json = JSON.parse(data);
}

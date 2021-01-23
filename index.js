const rc522 = require('./build/Debug/rfid_rc522');

let gCurrentTag = undefined;
console.log('Script running ...');

function checkForTag () {
    let ret = rc522.checkForTag();

    if ((ret === undefined) && (gCurrentTag !== undefined)) {
        // We have a tag, and there isn't one on the reader
        console.log('tagRemoved', gCurrentTag);
        gCurrentTag = undefined;
    } else if ((ret !== undefined) && (gCurrentTag === undefined)) {
        // We don't have a tag, but there's one on the reader
        gCurrentTag = ret;
        console.log('tagPresented', gCurrentTag);
        // writePage(1, 'test');
        // readPage(1);
    }
}

function readPage (page) {
    rc522.readPage(page, (err, retVal) => {
        if (err === 0) {
            
        }
        console.log(retVal, err);
    });
}

function writePage (page, str) {
    if (typeof str != 'string') {
        str = str.toString();
    }
    let data = Buffer.from(str);
    console.log(`Attempting to write ${data} ...`)
    rc522.writePage(page, data, (err, retVal) => {
        if (err === 0) {

        }
        console.log(retVal, err);
    });
}

// monitor tag
setInterval(checkForTag, 20);

//const rfid = require('rfid-rc522');

//console.log('Waiting for input ...');
//rfid.registerTagCallback(tagDetected);

//function tagDetected (info) {
//    if (info === 'tagPresented') {
//        console.log('Tag presented.');
//
//      // let buf = Buffer.alloc(4);
//      // buf.write('test');
//
//      let buf = Buffer.from('test');
//      console.log(buf);
//        rfid.writePage(5, buf, readTag);
//        // rfid.writePage(0, 'test', readTag);
//      // readTag();
//    } else {
//        console.log('Tag removed.');
//    }
//}
//
//function readTag () {
//    for (let i = 0; i < 100; i++) {
//      rfid.readPage(i, printPage);
//    }
//}

//function printPage (page) {
//    console.log(page);
//    // console.log(page.toString('utf-8'));
//}
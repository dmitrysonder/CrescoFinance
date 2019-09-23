const Cryptr = require('cryptr');
const fs = require('fs');
const path = require('path');
let hashPath = path.resolve(__dirname, 'hash.txt');

const cryptr = new Cryptr("password");
 
const es = cryptr.encrypt('12words');
const ds = cryptr.decrypt(es);


fs.writeFileSync(hashPath,es,{encoding:'utf8',flag:'w'});
console.log(es);
console.log(ds);

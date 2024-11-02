const forge = require('node-forge');
const fs = require("fs");

const publicKeyPem = fs.readFileSync("./publicKey.pem", 'utf8');
const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
const encrypted = publicKey.encrypt("Among Drip", 'RSA-OAEP');
const encryptedDataBase64 = forge.util.encode64(encrypted);
// console.log(encrypted);
// console.log(forge.util.encode64(encrypted));

const encryptedData = forge.util.decode64(encryptedDataBase64);

const privateKeyPem = fs.readFileSync("./privateKey.pem", 'utf8');
const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
console.log(privateKey);
const decryptedData = privateKey.decrypt(encryptedData, 'RSA-OAEP');

// Convert decrypted data back to string
const plaintext = forge.util.decodeUtf8(decryptedData);

console.log('Decrypted Message:', plaintext);

const crypto = require("crypto");
const fs = require("fs");

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048
});

// Export the keys to PEM format
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' });
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

fs.writeFileSync('publicKey.pem', publicKeyPem);
console.log('Public Key saved to publicKey.pem');

fs.writeFileSync('privateKey.pem', privateKeyPem);
console.log('Private Key saved to privateKey.pem');
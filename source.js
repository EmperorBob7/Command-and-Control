// Code for a Socket Source (Runs Commands)
require('dotenv').config()
const fs = require('fs');
const io = require("socket.io-client");
const crypto = require('crypto'); // Import the crypto module

const socket = io(`${process.env.IP}:${process.env.PORT}`);
console.log(`Connect to ${process.env.IP}:${process.env.PORT}`);
let publicKey, symmetricKey = null;
let connected = false;
try {
    publicKey = fs.readFileSync(process.env.PUBLIC_FILE, 'utf8');
} catch (error) {
    console.error("Error reading public key:", error);
    exit();
}

let lastChallenge = null;

socket.on("connect", () => {
    if(connected) {
        return;
    }
    const role = "source";
    socket.emit("joinRoom", role, process.env.NAME);
    console.log(`Joined room as ${role}`);
});

// Socket ID of Client
socket.on("connectionRequest", (socketID) => {
    console.log("Request Received");
    const challenge = generateChallenge();
    // Encrypt the challenge using the public key
    const encryptedChallenge = encryptChallenge(challenge);
    socket.emit('encryptedChallenge1', socketID, encryptedChallenge);
});

socket.on("decrypted2", (socketID, decrypted) => {
    console.log("Decryption Received", socketID);
    if (!socketID || !decrypted || decrypted != lastChallenge || lastChallenge == null) {
        return socket.emit('rejectFromServer', "Failed Decryption");
    }
    connected = true;
    const key = crypto.randomBytes(32); // 32 bytes for AES-256
    const keyBase64 = key.toString('base64'); // base64 for sharing
    console.log("My AES", keyBase64);
    const encryptedAES = encryptChallenge(keyBase64);
    socket.emit('symmetric1', socketID, encryptedAES);
    symmetricKey = keyBase64;
});

function generateChallenge() {
    const randomNumber = Math.random();
    lastChallenge = randomNumber.toString();
    return lastChallenge;
}

function encryptChallenge(challenge) {
    const buffer = Buffer.from(challenge, 'utf8');
    const encrypted = crypto.publicEncrypt({ key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING }, buffer);
    return encrypted.toString('base64');
}

// let challenge = crypto.publicEncrypt(publicKey, Buffer.from("SUS"));
// console.log(challenge);
// let privateKey = fs.readFileSync("./privateKey.pem", "utf8");
// console.log(crypto.privateDecrypt(privateKey, challenge).toString());


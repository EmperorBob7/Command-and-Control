// Code for a Socket Source (Runs Commands)
require('dotenv').config()
const fs = require('fs');
const io = require("socket.io-client");
const crypto = require('crypto'); // Import the crypto module
const { exec } = require('child_process');

const socket = io(`${process.env.IP}`);
console.log(`Connect to ${process.env.IP}`);
let publicKey, symmetricKey = null;
let connected = false;
let connectedSocketID = null;
try {
    publicKey = fs.readFileSync(process.env.PUBLIC_FILE, 'utf8');
} catch (error) {
    console.error("Error reading public key:", error);
    process.exit(1);
}

let lastChallenge = null;

socket.on("connect", () => {
    if (connected) {
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
    connectedSocketID = socketID;
    const key = crypto.randomBytes(32); // 32 bytes for AES-256
    const keyBase64 = key.toString('base64'); // base64 for sharing
    const encryptedAES = encryptChallenge(keyBase64);
    socket.emit('symmetric1', socketID, encryptedAES);
    symmetricKey = keyBase64;
});

socket.on("command", (socketID, encrypted) => {
    if (!socketID || !encrypted) {
        return socket.emit('rejectFromServer', "Failed Decryption");
    }
    const keyBuffer = Buffer.from(symmetricKey, 'base64');
    const ciphertextBuffer = Buffer.from(encrypted.ciphertext, 'base64');
    const ivBuffer = Buffer.from(encrypted.iv, 'base64');
    // Decrypt the data
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(ciphertextBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');
    console.log("Command: ", decrypted);
    exec(`echo '${decrypted}' | sudo strace -o /dev/null /bin/sh`, (error, stdout, stderr) => {
        let result = "";
        if (error) {
            result = error.message;
        } else if (stderr) {
            result = stderr;
        } else {
            result = stdout;
        }
        // Output the result
        socket.emit("result", socketID, encryptAES(result));
    });
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

function encryptAES(plaintext) {
    const key = Buffer.from(symmetricKey, 'base64'); // symmetricKey is Base64 encoded
    const iv = crypto.randomBytes(16); // 16 bytes for AES
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return {
        ciphertext: encrypted, // Ciphertext in Base64
        iv: iv.toString('base64') // IV in Base64
    };
}

socket.on("pingResponse", (isConnected) => {
    connected = isConnected;
});

const interval = setInterval(() => {
    console.log("Timeout Test");
    if(!connected) {
        process.exit(1);
    } else {
        socket.emit("pingID", connectedSocketID);
    }
}, 15000);

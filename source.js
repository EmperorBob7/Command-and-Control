// Code for a Socket Source (Runs Commands)
require('dotenv').config()
const io = require("socket.io-client");
const crypto = require('crypto'); // Import the crypto module

const socket = io(`${process.env.IP}:${process.env.PORT}`);
console.log(`Connect to ${process.env.IP}:${process.env.PORT}`);

socket.on("connect", () => {
    const role = "source";
    socket.emit("joinRoom", role, process.env.NAME, process.env.PASSWORD);
    console.log(`Joined room as ${role}`);
});

socket.on("connectionRequest", (data) => {
    const publicKey = process.env.PASSWD;
    const challenge = generateChallenge();
    // Encrypt the challenge using the public key
    const encryptedChallenge = encryptChallenge(challenge, publicKey);
    socket.emit('encryptedChallenge', { encryptedChallenge });
});

function generateChallenge() {
    const randomNumber = Math.random();
    return randomNumber.toString();
}

function encryptChallenge(challenge, publicKey) {
    const buffer = Buffer.from(challenge, 'utf8');
    const encrypted = crypto.publicEncrypt(publicKey, buffer);
    return encrypted.toString('base64');
}
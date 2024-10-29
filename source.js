// Code for a Socket Source (Runs Commands)
require('dotenv').config()
const io = require("socket.io-client");
const socket = io(`${process.env.IP}:${process.env.PORT}`);
console.log(`Connect to ${process.env.IP}:${process.env.PORT}`);

socket.on("connect", () => {
    const role = "source";
    socket.emit("joinRoom", role, process.env.NAME, process.env.PASSWORD);
    console.log(`Joined room as ${role}`);
});

// socket.on("someEvent", (data) => {
//     console.log("Received data:", data);
// });

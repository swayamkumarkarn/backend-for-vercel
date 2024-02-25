require('dotenv').config({ path: './config.env' });

const express = require('express');
const http = require('http');
const connectDB = require('./server-utils/connectDB');
const { Server } = require("socket.io")
const {createServer} = require("http")

const app = express();
app.use(express.json());
const cors = require("cors");
const PORT = process.env.PORT || 5000;
const server = createServer(app);

const io = require("socket.io")(8900, {
  cors: {
    origin: "*",
  },
});

connectDB()
var corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  methods: "GET, PUT, DELETE, POST, PATCH",
};

app.use(cors(corsOptions));

app.use("/chatapi/v1/chat", require("./api/chats"));
app.use("/chatapi/v1/message", require("./api/message"));
app.listen(PORT, () => console.log(`Server Started at ${PORT}`));


io.on("connection", (socket) => {
  //connected to correct id
  console.log("Socket Io")
  socket.on("setup", (userData) => {
    socket.join(userData._id);

    socket.emit("connected");
  });

  socket.on("join-chat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop-typing", (room) => socket.in(room).emit("stop-typing"));

  socket.on("new-message", (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    if (!chat.users) return console.log(`chat.users not defined`);

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message-received", newMessageReceived);
    });
  });

  socket.off("setup", () => {
    socket.leave(userData._id);
  });
});

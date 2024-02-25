require('dotenv').config({ path: './config.env' });

const express = require('express');
const http = require('http');
const next = require('next');
const connectDB = require('./server-utils/connectDB');

const app = express();
app.use(express.json());
const server = http.Server(app);
const io = require('socket.io')(server,{cors:{origins: '*',}});
const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;
const cors = require('cors');

require('./server-utils/friend')(io);

const {
  addUser,
  removeUser,
  findConnectedUser,
} = require('./server-utils/sockets');
const {
  loadMessages,
  sendMessage,
  setMessageToUnread,
  setMessageToRead,
} = require('./server-utils/chat');

const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

connectDB();

io.on('connection', (socket) => {
  socket.on('join', async ({ userId }) => {
    const users = await addUser(userId, socket.id);
    await setMessageToRead(userId);
    setInterval(() => {
      socket.emit('connectedUsers', {
        users: users.filter((user) => user.userId !== userId),
      });
    }, 10000);
  });



  socket.on('loadMessages', async ({ userId, messagesWith }) => {
    const { chat, error } = await loadMessages(userId, messagesWith);
    if (!error) {
      socket.emit('messagesLoaded', { chat });
    } else {
      socket.emit('noChatFound');
    }
  });

  socket.on('newMessage', async ({ userId, receiver, message }) => {
    const { newMessage, error } = await sendMessage(userId, receiver, message);
    const receiverSocket = await findConnectedUser(receiver);
    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit('newMessageReceived', { newMessage });
    } else {
      await setMessageToUnread(receiver);
    }
    if (!error) {
      socket.emit('messageSent', { newMessage });
    }
  });

  socket.on('disconnect', () => {
    removeUser(socket.id);
  });
});



var corsOptions = {
    origin: process.env.FE_NEXT_API_URL,
    optionsSuccessStatus: 200,
    methods: "GET, PUT, DELETE, POST, PATCH, HEAD"
}

app.use(cors(corsOptions));

nextApp.prepare().then(() => {
  app.use('/api/search', require('./api/search'));
  app.use('/api/signup', require('./api/signup'));
  app.use('/api/onboarding', require('./api/onboarding'));
  app.use('/api/auth', require('./api/auth'));
  app.use('/api/posts', require('./api/posts'));
  app.use('/api/profile', require('./api/profile'));
  app.use('/api/notifications', require('./api/notifications'));
  app.use('/api/chats', require('./api/chats'));
  app.use('/api/badges', require('./api/badges'));
  app.use('/api/stats', require('./api/stats'));
  app.use('/api/comments', require('./api/comments'));
  app.use('/api/friendrequests', require('./api/friendrequests'));
  app.use('/api/teams', require('./api/teams'));
  app.use('/api/tournaments', require('./api/tournaments'));
  app.use('/api/rankings', require('./api/rankings'));
  app.use('/api/leagues', require('./api/leagues'));
  app.use('/api/filters', require('./api/filters'));
  app.use('/api/arenas', require('./api/arenas'));
  app.use('/api/uploads', require('./api/uploads'));
  app.use('/api/player', require('./api/player'));
  app.use('/api/all', require('./api/all'));
  app.use('/api/games', require('./api/games'));
  app.use('/api/discover', require('./api/discover'));
  app.use('/api/postchatusers', require('./api/postchatusers'));
  app.use('/api/brand', require('./api/brand'));
  app.use('/api/company', require('./api/company'));
  app.use('/api/matches', require('./api/matches'));
  app.use('/api/tournamentstat',require("./api/tournamentstat"))
  app.use('/api/jobs',require("./api/jobs"))
  app.use('/api/transactions',require("./api/transactions"))
  app.use('/api/squads',require("./api/squads"))
  app.use('/api/challenges',require("./api/challenges"))
  app.use('/api/rigsdata',require("./api/rigsdata"))
  app.use('/api/admin',require("./api/admin"))
  app.use('/api/listings',require("./api/listings"))
  app.use('/api/recruit',require("./api/recruit"))
  app.use('/api/tournamentRules', require("./api/tournamentRules"))
  app.use('/api/battlepass',require("./api/battlepass"))
  app.use('/api/tasks',require("./api/task"))
  app.use('/api/level',require("./api/level"))
  app.use('/api/attribute',require("./api/attribute"))
  app.use('/api/groups',require("./api/groups"))
  app.use('/api/maps',require("./api/maps"))

  //Routes for esports API calls
  app.use('/api/extapi', require('./api/extapi'));

  //Server side API routes.
  app.use('/api/blockchain', require('./routes/blockchain'));
  app.use('/api/stripe', require('./routes/stripe'));

/*
app.use(function (req, res, next) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
res.setHeader('Access-Control-Allow-Credentials', true);
next();
});
*/

  app.all('*', (req, res) => handle(req, res));
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Express server running on port ${PORT}`);
  });
});

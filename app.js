const express = require('express');
const session = require('express-session');
const http = require('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const resultsRouter = require('./server/routers');
const lobbiesRouter = require('./server/routers/lobbies');
const usersRouter = require('./server/routers/users');
// magesh
const shellRouter  = require('./server/routers/shell');
const twitterRouter = require('./server/routers/twitter');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({secret: '$2y$12$bxwP0kYY9wqyjUgORJTgnu09u4/40N5Q4rewgJps6.KMSWRGyWN4m', resave: true, saveUninitialized: false}));

app.use(cors());

app.use('/results', resultsRouter);
app.use('/lobbies', lobbiesRouter);
app.use('/users', usersRouter);
// magesh
app.use('/shell', shellRouter);
app.use('/twitter', twitterRouter);

const port = process.env.PORT || '3000';
app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => console.log('server running on localhost:' + port));

require('dotenv').config();
require('events').EventEmitter.defaultMaxListeners = 20;
const express = require('express');
const db = require('./config/db');
const app = express();
const cors = require('cors');

app.use(cors({
    origin: ['https://invoice-generator-lyart.vercel.app', 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


const FileRoute = require('./routes/Files');
const invoiceRoute = require('./routes/invoiceRoute');
const dispatchRoute = require('./routes/dispatchRoute');

app.get('/', (req, res) => {
    res.send("invoice generator backend");
});

app.use('/api', FileRoute);
app.use('/api', invoiceRoute);
app.use('/api', dispatchRoute);


app.listen(process.env.PORT, () => {
    console.log("the server is running on 5000");
});

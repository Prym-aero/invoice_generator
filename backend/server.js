require('events').EventEmitter.defaultMaxListeners = 20;
const express = require('express');
const db = require('./config/db');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors({
    origin: ['https://invoice-generator-lyart.vercel.app', 'http://localhost:5174']
}))
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));


const FileRoute = require('./routes/Files');
const budgetRoute = require('./routes/budget');
const invoiceRoute = require('./routes/invoiceRoute');


app.get('/', (req, res) => {
    res.send("invoice generator backend");
});

app.use('/api', FileRoute);
app.use('/api', budgetRoute)
app.use('/api', invoiceRoute);


app.listen(process.env.PORT, () => {
    console.log("the server is running on 5000");
});

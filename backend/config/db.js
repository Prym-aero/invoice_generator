const mongoose = require('mongoose')
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("Invoice database connected successfully"))
    .catch((err) => console.log("the error in addding database is : ", err))


module.exports = mongoose;
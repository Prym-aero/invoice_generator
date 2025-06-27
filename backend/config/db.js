require('dotenv').config();
const mongoose = require('mongoose')

console.log('connectinig to mongo db', process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Invoice database connected successfully"))
    .catch((err) => console.log("the error in addding database is : ", err))


module.exports = mongoose;
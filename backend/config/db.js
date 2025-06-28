
const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI;



mongoose.connect(MONGO_URI)
    .then(() => console.log("Invoice database connected successfully"))
    .catch((err) => console.log("the error in addding database is : ", err))


module.exports = mongoose;
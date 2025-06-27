require('dotenv').config();
const mongoose = require('mongoose')

console.log('connectinig to mongo db', process.env.MONGO_URI);

mongoose.connect("mongodb+srv://softwareprymaerospace:xPb0CVMljp2lnsdP@invoice-cluster.zmcpuhe.mongodb.net/invoiceGenerator?retryWrites=true&w=majority&appName=invoice-cluster")
    .then(() => console.log("Invoice database connected successfully"))
    .catch((err) => console.log("the error in addding database is : ", err))


module.exports = mongoose;
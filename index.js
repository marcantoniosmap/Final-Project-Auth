const express = require('express');
const app = express();
const router = require('express').Router();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

//import routes
const authRoute = require('./routes/auth');
const userProjectRoute = require('./routes/userProject');

dotenv.config();

const port = process.env.PORT || 8000

//Connect to DB
mongoose.connect(process.env.DB_CONNECTION,{ useNewUrlParser: true,useUnifiedTopology: true,useFindAndModify: false },()=>{
    console.log("connected to db");
});

//middlewares
app.use(express.json());
app.use(cors());


//ROUTES
app.get('/',(req,res)=>{
    res.send('we are here');
});

app.use('/api/user', authRoute);
app.use('/api/userProject',userProjectRoute);

app.listen(port,()=>{
    console.log(`listening on port ${port}`)
})
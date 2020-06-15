const app = require('./server');

//import routes
const authRoute = require('./routes/auth');
const userProjectRoute= require('./routes/userProject');

dotenv.config();


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

//just so i can commit this time

app.listen(8000);

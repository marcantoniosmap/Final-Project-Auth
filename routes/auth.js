const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerValidation,loginValidation}= require('../validation')
const verify = require('./verifyToken');


router.post('/register', async(req,res) =>{

    //validate before submit
    const {error}= registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    
    const emailExist = await User.findOne({email: req.body.email});
    if (emailExist) return res.status(400).send('Email Already exists');


    //HASH THE PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashPassword= await bcrypt.hash(req.body.password, salt);

     const user = new User({
         name: req.body.name,
         email: req.body.email,
         password: hashPassword,
     });
     try{
         const savedUser = await user.save();
         res.send({status:'success',user: user._id});
     }catch(err){
         res.status(400).send({status:'failed',info:'error occured'});
     }
});

router.post('/login', async (req, res)=>{
    console.log("hello");
   //validate before submit
    const {error}= loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).send('Email or password is wrong');


    //check if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    
    //Create token
    const token = jwt.sign({_id: user._id},process.env.TOKEN_SECRET,{expiresIn:129600});
    res.header('auth-token', token);
    res.send({token:token,id:user._id});
});


router.get('/checkToken/:token',async(req,res)=>{
    const token = req.params.token;
    if(!token) res.status(401).send('Access Denied');
    else{
        try{
            const verified = jwt.verify(token, process.env.TOKEN_SECRET);
            const expired=verified.exp;

            if (Date.now()>= expired*1000){
                res.status(403).send('Expired Token');
            }else{
                req.user= verified;
                res.status(200).send(req.user);
            }
    
        } catch (err){
            res.status(403).send('Invalid Token');
        }
    }
  

});

router.get('/:id',verify,async(req,res)=>{
   try{
    const user = await User.findOne({_id:req.params.id});
    const retUser={
        _id: user._id,
        name: user.name,
        email:user.email
    };
    res.status(200).send(retUser);
   }catch(err){
       res.status(400).send({err:err});
   }
 
})

router.get('/',async (req,res)=>{
    const user = await User.find();
    if (user){
        res.status(200).send({ status: "OK" });
    }else{
        res.status(400).send({err:"no good"});
    }
});



module.exports= router;
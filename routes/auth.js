const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerValidation,loginValidation}= require('../validation')
const verify = require('./verifyToken');
const UserProject = require('../model/UserProject');
const fetch = require('node-fetch');


const domainUrl= 'https://project.cogether.me';
// const domainUrl = 'https://localhost:9000'
const deleteUrl = domainUrl+'/delete/'


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
         res.status(400).send('error occured');
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


router.put('/update',verify,async(req,res)=>{
    const user = await User.findOne({_id:req.body._id});
    if (user.id===req.user._id){
        const updateUser = await User.updateOne(
            {_id:user.id},
            {$set:{name:req.body.name}}
        );
        res.status(200).send({status:"OK"})
    } else{
        res.status(400).send({err:"cannot update name"});
    }
});

router.put('/updatePassword',verify,async(req,res)=>{
    try{
        const user = await User.findOne({_id:req.body._id});
        if (user.id===req.user._id){
        const validPass = await bcrypt.compare(req.body.password, user.password);
        if (!validPass) return res.status(400).send({err:'unable to change password'});

        //hash
        const salt = await bcrypt.genSalt(10);
        const hashPassword= await bcrypt.hash(req.body.newPassword, salt);
        const updateUser = await User.updateOne(
            {_id:user.id},
            {$set:{password:hashPassword}}
        );
        res.status(200).send({status:"OK"})
    } else{
        res.status(400).send({err:"cannot change password"});
    }
}catch(err){
    res.status(400).send({err:err});
}
});

const deleteProject =async (project_id,token)=>{
    try{
      const deletePrj = await fetch(deleteUrl+project_id,
        {method:'DELETE', headers:{
          "Content-Type":'application/json',
          "auth-token":token
        }, body:JSON.stringify({
          idList:idList})});
          const json = await deletePrj.json();
          return json;
    } catch (err){
        return(err);
    }

}

router.delete('/deleteUser/:id',verify,async(req,res)=>{
    try{
        const user = await User.findOne({_id:req.params.id});
        if(user.id=== req.user._id){
            const projects = await UserProject.find({user_id:user.id});
            // const projectCOllaborated = await UserProject.find({user_id:user.id,ownership_type:"collaborator"});
            const deletedUser = await User.deleteOne({_id:req.params.id});
            for(project of projects){
                if (project.ownership_type==='owner'){
                    try{
                        const deleteProjects = await deleteProject(project._id,req.header('auth-token'));
                    }catch(err){
                        console.log(err);
                    }
                }else{
                    const deleteAsCollaborator = await UserProject.delete({project_id:project.project_id,user_id:user.id});
                }
            }
            res.status(400).send({status:'OK'});
        }
    }catch(err){
        res.status(400).send({err:err});
    }
})

router.get('/:id',verify,async(req,res)=>{
    if (req.user._id !== req.params.id) return res.status(400).send({err:'unauthorized'});
   try{
    const user = await User.findOne({_id:req.params.id});
    const projectOwned = await UserProject.find({user_id:req.params.id,ownership_type:"owner"});
    const projectCollab = await UserProject.find({user_id:req.params.id,ownership_type:"collaborator"});
    const retUser={
        _id: user._id,
        name: user.name,
        email:user.email,
        project_owner: projectOwned.length,
        project_collab : projectCollab.length,

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
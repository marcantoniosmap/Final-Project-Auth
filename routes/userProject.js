const router = require('express').Router();
const verify = require('./verifyToken');
const UserProject = require('../model/UserProject');

const fetch = require('node-fetch');
const User = require('../model/User');


// const domainForProjectAPI = 'http://CogetherProject-env.eba-hmw9hpih.ap-southeast-1.elasticbeanstalk.com'
const domainForProjectAPI = 'https://project.cogether.me'
// const domainForProjectAPI = 'http://localhost:9000'
const GETPROJECTURL=domainForProjectAPI+'/api/project/';
const GETMULTIPLEPROJECTURL=domainForProjectAPI+'/api/project/getProjects'


router.get('/',verify,async(req,res)=>{
  const user_id= req.user._id;
    const getProjects = async (url,idList,token) =>{
      try{
        const userProject = await fetch(url,
          {method:'POST', headers:{
            "Content-Type":'application/json',
            "auth-token":token
          }, body:JSON.stringify({
            idList:idList})});
            const json = await userProject.json();
            console.log(userProject);
            return json;
          } catch (err){
            return(err);
          }
        }
  try{
    const userProject = await UserProject.find({user_id:user_id});
    console.log(user_id);
    const projectArr=userProject.map(project=>project.project_id);
    const json = await getProjects(GETMULTIPLEPROJECTURL,projectArr,req.header('auth-token'));
    console.log(json);
    res.status(200).send(json);
  } catch(err){
    return res.status(400).send({err:err});
  }



});

router.post('/create',verify,async(req,res)=>{
  const userProject = new UserProject({
    user_id:req.body.user_id,
    project_id:req.body.project_id,
    ownership_type:req.body.ownership_type
  });
  console.log(userProject);
  try{
    const userProjectSaved= await userProject.save();
    res.status(200).send({status:'OK'});
  }catch(err){
    res.status(400).send({status:err});
  }
});

router.post('/findOne',verify,async(req,res)=>{
  try{
    const userProject = await UserProject.findOne(
                                  {project_id:req.body.cred.project_id,
                                    user_id:req.body.cred.user_id});
    res.status(200).send(userProject);
  }catch(err){
    res.status(400).send({status:err});
  }
});

router.delete('/delete/:id',verify,async(req,res)=>{
  try{
    const deleteUserProject = await UserProject.deleteMany({project_id:req.params.id});
    res.status(200).send({status:'OK'});
  }catch(err){
    res.status(400).send({status:err});
  }

})

router.post('/collab',verify,async(req,res)=>{
  const user = req.user._id;
  const project_id = req.body.project_id;
  const sharedPassword = req.body.sharedPassword;

  const getProjects= async (id,token)=>{
    try{
      const response = await fetch(GETPROJECTURL+id,
                                  {method:'GET',headers:{
                                    'auth-token':token
                                  }});
      const data = await response.json(); 
      return data;
    }catch(err){
      return err;
    }
  }
  const project=await getProjects(project_id,req.header('auth-token'));
  const getUserProject = await UserProject.findOne({project_id:project,user_id:user});

  if (getUserProject){
    res.status(200).send({status:"OK"});
  }
  else if (project.sharedPassword===sharedPassword){
    const userProject = new UserProject({
      user_id: user,
      project_id:project_id,
      ownership_type:"collaborator"
    })
    try{
      const savedUserProject = await userProject.save();
      res.status(200).send({status:"OK"});
    }catch(err){
      res.status(400).send({status:err});
    }
  }else{
    res.status(400).send({status:"error to collab"});
  }

});
router.get('/getCollaborator/:id',verify,async(req,res)=>{
    const project_id = req.params.id;
    try{
        const userProjectList = await UserProject.find({project_id:project_id,ownership_type:'collaborator'});
        const retArr=[]
        for(user of userProjectList){
            const userDetail = await User.findOne({_id:user.user_id});
            retArr.push({_id:user.user_id,email:userDetail.email});
        }
        res.status(200).send(retArr);
    }catch(err){
        res.status(400).send({err:err});
    }
    
});

router.post('/leave/:id',verify,async(req,res)=>{
  const project_id = req.params.id;
  try{
    const project = await UserProject.findOne({project_id:project_id,ownership_type:'owner'});
    if(req.user._id===project.user_id) return res.status(400).send({err:"You can't leave"});
    const deletedValue = await UserProject.deleteOne({project_id:project_id,user_id:req.user._id});
    res.status(200).send({status:'OK'});
  }catch(err){
    res.status(400).send({err:err});
  }

});



module.exports = router;
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user_id :{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    project_id:{
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Project'
    },
    ownership_type:{
        type:String,
        required:true
    }
    
});

module.exports = mongoose.model('UserProject', postSchema);
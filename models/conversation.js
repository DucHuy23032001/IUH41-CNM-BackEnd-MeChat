const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    name:[],
    imageLink:[],
    lastMessage: {type:Schema.Types.ObjectId,ref:'Message',default:null},
    members :[{type: Schema.Types.ObjectId,required:true, ref: 'User'}] ,
    createdBy:{type:Schema.Types.ObjectId,required:true, ref:'User'},
    deleteBy:[{type:Schema.Types.ObjectId, ref:'User'}],
    isGroup:{
        type:Boolean,
        default:false
    },
    isCalling:{
        type:Boolean,
        default:false
    }
})

module.exports = mongoose.model("Conversation",conversationSchema);
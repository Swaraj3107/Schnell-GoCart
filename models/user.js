const mongoose=require("mongoose");
const Schema = mongoose.Schema;

const Product=require("./product.js");

const passportLocalMongoose = require('passport-local-mongoose');
//This passport-local-mongoose itself will add the username and  password which will bem hash and salt 

const UserSchema=new Schema({
    email:{
        type:String,
        required:true
    },
    cart: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Product' // This links the items in the cart to your Product model
        }
    ]
});

UserSchema.plugin(passportLocalMongoose);//By default it will give username and password to the person this libraray;

module.exports = mongoose.model('User', UserSchema);
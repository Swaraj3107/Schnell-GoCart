const mongoose=require("mongoose");

const Schema = mongoose.Schema;

const productSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    weight:{
        type:Number,
        required:true,
    },
    price:{
        type:Number,
        default:100
    }

});


const Product=mongoose.model("Product",productSchema);
module.exports=Product;

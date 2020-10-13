const Product = require("../models/product");
const formidable=require("formidable")
const_=require("lodash")
const fs=require("fs");
const { sortBy } = require("lodash");


exports.getProductById=(req,res,next,id) => {

    Product.findById(id)
    .populate("category")
    .exec((err,product) => {
      if(err){
          return res.status(400).json({
              error: "Product not Found"
          });
      }
req.product=product;
next();
    });
};

exports.createProduct=(req,res) => {
let form=new formidable.IncomingForm();
form.keepExtensions=true;
form.parse(req,(err,fields,file)=>{
    if(err){
        return res.status(400).json({
            error:"Problem with image"
        });
    }

//destructure the fields
const {name,description,price,category,stock}=fields;

if(
    !name ||
    !description ||
    !price ||
    !category ||
    !stock
){
  return res.status(400).json({
      error: "please include all fields"
  });
}

  //to do restrictions
  let product=new Product(fields);

  //handle file here
  if(file.photo){
      if(file.photo.size>3000000){
          return res.status(400).json({
              error: "File size too big"
          });
      }
      product.photo.data=fs.readFileSync(file.photo.path);
      product.photo.contentType=file.photo.type;
  }
   //save to DB
 product.save((err,product)=>{
     if(err){
         res.status(400).json({
             error:"Saving Tshirt in DB failed"
         });
     }
     res.json(product);
 });

});
};

exports.getProduct=(req,res) =>
{
    req.product.photo=undefined
    return res.json(req.product)
}

//photo middlware
exports.photo=(req,res,next) => {
    if(req.product.photo.data)
    {
        res.set("Content-Type",req.product.photo)
        return res.send(req.product.photo.data)
    }
    next();
}

//delete controlles
 exports.deleteProduct= (req,res) => {
     let product =req.product;
     product.remove((err,deletedProduct) => {
    return res.status(400).json({
        error:"Failed to delete product"
    });
    res.json({
      message: "Deletion was a success",
      deletedProduct
    });
     });
 };

 //update controllers
 exports.updateProduct =(req,res) => {
  
let form=new formidable.IncomingForm();
form.keepExtensions=true;
form.parse(req,(err,fields,file)=>{
    if(err){
        return res.status(400).json({
            error:"Problem with image"
        });
    }


  //updation record
  let product=req.product;
  product=_.extend(product,fields)

  //handle file here
  if(file.photo){
      if(file.photo.size>3000000){
          return res.status(400).json({
              error: "File size too big"
          });
      }
      product.photo.data=fs.readFileSync(file.photo.path);
      product.photo.contentType=file.photo.type;
  }
   //save to DB
 product.save((err,product)=>{
     if(err){
         res.status(400).json({
             error:"Updation failed"
         });
     }
     res.json(product);
 });

});

 };

 //product listing

 exports.getAllProducts =(req,res) => {
    
    let limit = req.query.limit ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
    Product.find()
     .select("-photo")
     .populate("category")
     .sort([[sortBy,"asc"]])
     .limit(limit)
     .exec((err,products) => {
         if(err){
         return res.status(400).json({
             error: "NO product FOUND"
         });

        }
        res.json(products)
     });
 };

 exports.getAllUniqueCategories =() =>{
     Product.distinct("category", {} ,(err,category) => {
         if(err){
             return res.status(400).json({
                 error:"No category found"
             });
         }
         res.json(category)
     })
 }

exports.updateStock =(req,res,next) => {
    let myOperations = req.body.order.products.map(prod =>{
        return {
            updateOne: {
                filter: {_id: prod._id},
                update: {$inc: {stock: -prod.count, sold: +prod.count}}
            }
        }
    })

    Product.bulkWrite(myOperations,{},(err,products) =>{
        if(err)
       {
           return res.status(400).json({
               error: "Bulk operations failed"
           })
       } 
       next();
    });
};

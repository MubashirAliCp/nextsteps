var db = require('../config/connection')
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { response } = require('../app');
const objectId = require('mongodb').ObjectId
const multer = require('multer');
const { ObjectId } = require('mongodb');
const { status } = require('express/lib/response');




module.exports = {

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('login success');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('login failed');
                resolve({ status: false })
            }
        })
    },

    // addProduct: (product, callback) => {
    //     console.log(product);
    //     db.get().collection('product').insertOne(product).then((data) => {
    //         console.log(data)
    //         callback(data.insertedId)
    //     })
    // },
    productUpload: (proData, imagesData)=> new Promise(async(resolve,reject)=>{
        const price=parseInt(proData.price)
        let product ={
           title:proData.title,
           brand:proData.brand,
           price:price,
           discount:proData.discount,
        //    gender:proData.gender,
           gender:proData.gender,
        //    category:proData.category,
           category:proData.category,
           size:[
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               {size:proData.size,stock:proData.stok},
               
            //    {two:proData.two},
            //    {three:proData.three},
            //    {four:proData.four},
            //    {five:proData.five},
            //    {six:proData.six},
            //    {seven:proData.seven},
            //    {eight:proData.eight},
            //    {nine:proData.nine},
            //    {ten:proData.ten},
            //    {eleven:proData.eleven},
            //    {twelve:proData.twelve},
            //    {thirteen:proData.thirteen},
           ],
           image:imagesData
        }


        db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .insertOne(product)
        .then((status)=>{
            if(status){
                console.log("resolve++++++++++",status);
                resolve(status)
            }else{
                console.log("errr");
                reject(error)
            }
        })
    }),


    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(products)
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            console.log(users);
            resolve(users)
        })
    },


    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectId(prodId) }).then((response) => {
                console.log(response);
                resolve(response)

            })
        })
    },


    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },


    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
        .updateOne({_id:objectId(proId)},{
            $set:{
                title:proDetails.title,
                brand:proDetails.brand,
                price:proDetails.price,
                discount:proDetails.discount,
                gender:proDetails.gender,
                category:proDetails.category,
                occasion:proDetails.occasion

            }
        })
        .then((response)=>{
            console.log(response);
            resolve()
        })
        })
       
    },

    getAllorders: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()

            resolve(products)
        })
    }
}
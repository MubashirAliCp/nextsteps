var db = require('../config/connection')
var collection = require('../config/collections');
const bcrypt = require('bcrypt');
const objectId = require('mongodb').ObjectId
const multer = require('multer');
const { ObjectId } = require('mongodb');
// const { status } = require('express/lib/response');




module.exports = {

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    console.log('status',status);
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
    },

// coupennn.........

    getAllCoupons: () => {
        console.log("heeeeeeeeeee");
    return new Promise(async (resolve, reject) => {
      const AllCoupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray();
      resolve(AllCoupons);
    });
},


deletecoupon: (couponId) => {
    return new Promise(async (resolve, reject) => {
      const deletecoupon = await db.get().collection(collection.COUPON_COLLECTION).deleteOne({
        _id:objectId(couponId),
      });
      resolve(deletecoupon);
    });
  },

  AddCoupon: (data) => {
    return new Promise(async (resolve, reject) => {
      const newCoupon = ({
        couponName: data.couponName,
        couponCode: data.CoupoCode,
        limit: data.Limit,
        expirationTime: data.ExpireDate,
        discount: data.discount,
      });
      await db.get().collection(collection.COUPON_COLLECTION).insertOne(newCoupon);
      resolve(); 
    });
  },



//   dashbord...........................

salesReport:(data)=>{
    let response={}
       let {startDate,endDate} = data

  let d1, d2, text;
  if (!startDate || !endDate) {
      d1 = new Date();
      d1.setDate(d1.getDate() - 7);
      d2 = new Date();
      text = "For the Last 7 days";
    } else {
      d1 = new Date(startDate);
      d2 = new Date(endDate);
      text = `Between ${startDate} and ${endDate}`;
    }
 

// Date wise sales report
const date = new Date(Date.now());
console.log("Fpjiu");
const month = date.toLocaleString("default", { month: "long" });

       return new Promise(async(resolve,reject)=>{

let salesReport=await db.get().collection(collection.ORDER_COLLECTION).aggregate([

{
  $match: {
    date: {
      $lt: d2,
      $gte: d1,
    },
  },
},
{
 $match:{status:'placed'}
},
{
  $group: {
    _id: { $dayOfMonth: "$date" },
    total: { $sum: "$total" },
  },
},
]).toArray();


//  let brandReport = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
//    {
//      $match:{status:'placed'}
//     },
//    {
//       $unwind: "$products",
//     },{
//       $project:{
//           brand: "$products.brand",
//           quantity:"$products.quantity"
//       }
//     },{
//       $group:{
//           _id:'$brand',
//           totalAmount: { $sum: "$quantity" },
    
//       }
//     }
    
//     ]).toArray()



let orderCount = await db.get().collection(collection.ORDER_COLLECTION).find({date:{$gt : d1, $lt : d2}}).count()


let totalAmounts=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
 {
   $match:{status:'placed'}
  },
 {
   $group:
   {
     _id: null,
     totalAmount: { $sum:"$total"}

     
   }
 }
]).toArray()

// let totalAmountRefund=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
//  {
//    $match:{status:'placed'}
//   },
//  {
//    $group:
//    {
//      _id: null,
//      totalAmount: { $sum:'$amountToBeRefunded'
//        }

     
//    }
//  }
// ]).toArray()

console.log('5555555555555555555555555555555555555555555555555555555555555555555555');
// console.log(totalAmountRefund);




response.salesReport=salesReport
// response.brandReport=brandReport
response.orderCount=orderCount
response.totalAmountPaid=totalAmounts[0].totalAmount
// response.totalAmountRefund=totalAmountRefund[0].totalAmount

resolve(response)      
       })
        
     }




}
var db = require('../config/connection')
var collection = require('../config/collections');
const bcrypt = require('bcrypt')
var nodeMailer = require('nodemailer')
const { ObjectId } = require('mongodb');
require('dotenv').config();

const collections = require('../config/collections');
const Razorpay = require('razorpay');
// const { resolve } = require('path');

var instance = new Razorpay({
    key_id: process.env.RAZORPAY_ID,
    key_secret:process.env.RAZORPAY_KEY,
});
  
module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                         
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
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            console.log(products);
            resolve(products)
        })
    },


    getProducts: (proId) => {
       
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: ObjectId(proId) })
            console.log(products);
            resolve(products)
        })
    },






    addToCart: (proId, userId) => {
        let proObj = {
            item: ObjectId(proId),
            quantity: 1

        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then(() => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        // item: 1, quantity: 1, products: 1
                    }
                },
                // {
                //     $unwind : '$products'
                // }


            ]).toArray()
            console.log(cartItems);


            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve(true)
                    })


            }



        })
    },
    removeFromcart: (data, user) => {
        return new Promise(async (resolve, reject) => {
            console.log(data);
            // const cart=data.cart
            console.log("999999999999999");
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: ObjectId(data.cart) },

                    {
                        $pull: { products: { item: ObjectId(data.product) } }
                    }).then((response) => {
                        console.log("[[[[[[[[[[");
                        resolve({ removeProduct: true })
                    })
        })
    },






    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },

                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$products.price'] } }
                    }
                }


            ]).toArray()
            if (total.length != 0) {

                resolve(total[0].total)
            } else {

                reject()
            }

        })
    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    villaname: order.villaname,
                    mobile: order.mobile,
                    state: order.state,
                    postcode: order.postcode
                },
                userId: ObjectId(order.userId),
                paymentMethode: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                resolve(response.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            resolve(cart.products)
        })

    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ _id: ObjectId(userId) }).toArray()
            resolve(orders)
        })
    },
    getUserallOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: ObjectId(userId) }).toArray()
            resolve(orders)
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }



            ]).toArray()
            console.log("eeeeeeeeeeeeeeeeeeeeyy", orderItems);
            resolve(orderItems)
        })
    },

    generateRazorpay: (orderId, total) => {
        console.log("]]]]]]]]]]]]]]]]]]]]]]]]]]]");
        console.log(total);
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            };
            console.log("option...........", options);
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {

                    console.log("new orderrrrrrrrrrr", order);
                    resolve(order)

                }
            })

        })
    },

    verifyPayment: (details) => new Promise((resolve, reject) => {
        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', "lyCLswGQfWwNZ5iIfR1eRTjG");
        hmac.update(
            `${details['payment[razorpay_order_id]']}|${details['payment[razorpay_payment_id]']}`,
        );
        hmac = hmac.digest('hex');

        if (hmac == details['payment[razorpay_signature]']) {
            resolve();
        } else {

            reject(err);
        }
    }),

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: ObjectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },


    // whislist..........




    getwishlistProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                    }
                }


            ]).toArray()


            resolve(wishlistItems)
        })
    },



    addTowishlist: (proId, userId) => {
        let proObj = {
            item: ObjectId(proId),
            // quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                console.log(proExist);
                if (proExist != -1) {
                    resolve({ err: "already added in wishlist" })
                }
                else {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            }
            else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    removeFromwishlist: (data, user) => {
        return new Promise(async (resolve, reject) => {
            console.log(data);
            db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: ObjectId(data.cart) },

                    {
                        $pull: { products: { item: ObjectId(data.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
        })
    },


    // addess upload//////////////////////

    addaddress: (proData, userid) => new Promise(async (resolve, reject) => {
        // const price=parseInt(proData.price)
        let address = {
            user: ObjectId(userid),
            name: proData.name,
            home: proData.home,
            city: proData.city,
            state: proData.city,
            phone: proData.phone,
            pincode: proData.pincode
            //    image:imagesData
        }


        db.get()
            .collection(collection.ADDRESS_COLLECTION)
            .insertOne(address)
            .then((status) => {
                if (status) {
                    console.log("resolve++++++++++", status);
                    resolve(status)
                } else {
                    console.log("errr");
                    reject(error)
                }
            })
    }),

    getAllAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let address = await db.get().collection(collection.ADDRESS_COLLECTION).find({user:ObjectId(userId)}).sort({ _id: -1 }).limit(2).toArray()
            console.log("............", address);
            resolve(address)
        })
    }

}
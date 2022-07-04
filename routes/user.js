const express = require('express');
const session = require('express-session');
// const { redirect } = require('express/lib/response');

const adminHelpers = require('../helpers/admin-helpers');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const moment = require('moment');
const store = require ('../middlewear/multer')
const { addressUpload } = require('../helpers/user-helpers');
const verifyLogin = (req,res,next)=>{
  if (req.session.logedIn){
    next()
  }else{
    res.redirect('/login')  
  }
}

/* GET home page. */
router.get('/',  function (req, res, next) {
  if (req.session.user){
    const user = req.session.user
    let cartCount = userHelpers.getCartCount(req.session.user._id).then((count)=>{
      req.session.user.cartCount = count 
    })
  }
  adminHelpers.getAllProducts().then((products)=>{
    let user = req.session.user
    res.render('user/home',{ title: 'Express', user: req.session.user,products });
  })
});

router.get('/login', (req, res) => {
  if (
    req.session.logedIn
  ) {
    res.redirect('/')
  
  } else {
    res.render('user/login', { "loginErr": req.session.loginErr })
    req.session.loginErr=false
  }
})

router.get('/signup', (req, res) => {
  res.render('user/signup')
})

router.post('/register', (req, res) => {
  console.log(req.body)
  userHelpers.doSignup(req.body).then((response) => {
    req.session.loggedIn = true
    req.session.user = response.user
    console.log(response);
    res.redirect('/login')
  })
})


router.post('/login', (req, res) => {
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = "Invalid user name or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/men', (req, res) => {
  userHelpers.getAllProducts().then((products)=>{

  res.render('user/men-products',{products,user:req.session.user})
})   
}) 
  
router.get('/cart',async(req,res)=>{
 
  let products=await userHelpers.getCartProducts(req.session.user._id)
  console.log(products);
for(let i=0;i<products.length;i++){ 
  products[i].products.total=products[i].quantity*products[i].products.price
}
console.log(products)
 userHelpers.getTotalAmount(req.session.user._id).then((total)=>{

  console.log(total);  
  
  res.render('user/cart',{products,user: req.session.user,total})
 }).catch(()=>{
  req.session.emptyCart=true
  res.render('user/empty-cart',{user:req.session.user})
 
 })

})


router.get('/product-view/:id',(req,res)=>{
  userHelpers.getProducts(req.params.id).then((response)=>{
    const products=response
    // console.log(products);
    // console.log("kjhhhhhhhhhhh");
    // let user = req.session.user
  res.render('user/productview',{products,user:req.session.user})
  })
})
 

router.get('/addto-cart/:id',(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/')
    res.json({status:true})
  })

})




router.post('/change-quantity',(req,res,next)=>{
// console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then((response)=>{
  res.json(response)  

  })
})

router.post('/remove-Product-forcart',(req,res,next)=>{
  // console.log("shfshfjkdshfshfsh");
  userHelpers.removeFromcart(req.body,req.session.user._id).then(()=>{
    res.json({status:true})
  })
}) 

router.get('/place-order',async(req,res)=>{
  let total= await userHelpers.getTotalAmount(req.session.user._id)
  let user=req.session.user
  res.render('user/payment',{total,user})  
})

router.post('/place-order', async(req,res)=>{
  
  let products= await userHelpers.getCartProductList(req.body.userId)
  let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
  
  userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
    req.session.orderId = orderId
    if(req.body['payment-methode']==='COD'){
      res.json({codSuccess:true})
    }else{ 
      // console.log("cod..................."); 
      userHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
        res.json(response)
      })   
    } 
     
  })    
 
}) 


 
router.get('/order-success',async(req,res)=>{
  // console.log(req.session.orderId);
  let orders=await userHelpers.getUserOrders(req.session.orderId)
  // console.log(orders+"");
  res.render('user/order-success',{user:req.session.user,orders})
})
 
router.get('/your-orders/:id',async(req,res)=>{
  let products=await userHelpers.getOrderProducts(req.params.id)
  // console.log("[[[[[[[",products);
  res.render('user/your-orders',{user:req.session.user,products})
}) 
 
  
router.post('/verify-payment',(req,res)=>{
  // console.log("req.bodyyyyyyy",req.body);

  console.log("jdshjhjk");
  userHelpers.verifyPayment(req.body).then(()=>{
  //  console.log("req.......",req.body);
userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
  console.log("payment succesfull");
  res.json({status:true})
})
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:""})
  })
})
 

router.get('/my-orders',async(req,res)=>{
  let orders=await userHelpers.getUserallOrders(req.session.user._id)
  res.render('user/my-orders',{user:req.session.user,orders})
})


router.get('/profile',(req,res)=>{let cartCount = userHelpers.getCartCount(req.session.user._id).then((count)=>{
  req.session.user.cartCount = count 
})
    res.render('user/profile',{user:req.session.user})
})


// wishlist.....

router.get('/whishlist/:id',(req,res)=>{
  console.log("hi.........")
  userHelpers.addTowishlist(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/')
    res.json({status:true}) 
  })
})

router.get('/whishlist',async (req,res)=>{
  let wishlist=await userHelpers.getwishlistProducts(req.session.user._id)
// console.log(wishlist);
  res.render('user/wishlist',{wishlist,user:req.session.user})
})

router.post('/remove-Product-forwishlist',(req,res,next)=>{
  // console.log("wishlist......remove");
  userHelpers.removeFromwishlist(req.body,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})  



router.get('/add-address',(req,res)=>{
  res.render("user/address-book",{user:req.session.user})
})


router.get('/address',(req,res)=>{
  if(req.session.user){
    let user=req.session.user
  userHelpers.getAllAddress(user._id).then((address)=>{
    console.log(address);
  res.render('user/address',{address1:address[0],address2:address[1],user})
  })
}
})

// addres.....................


router.post('/add-address', (req, res) => {
  console.log(req.body);
   
  if(req.session.user){
    let user=req.session.user
    userHelpers.addaddress(req.body,user._id).then((status)=>{
      req.session.added=true
      res.redirect('/address')
    }).catch(((error)=>{
      
    }))
  }
   

})

module.exports = router;

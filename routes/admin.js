const express = require('express');

const adminHelpers = require('../helpers/admin-helpers');
const router = express.Router();
const adminHelper = require('../helpers/admin-helpers')
const store = require ('../middlewear/multer')
const fs = require('fs');
const userHelpers = require('../helpers/user-helpers')
// const { status } = require('express/lib/response');
const moment = require('moment');
const { getOrderCount } = require('../helpers/admin-helpers');
/* GET users listing. */


router.get('/', (req, res) => {
   
  if ( 
    req.session.adminloggedIn
  ) {
    let orderCount = adminHelpers.getOrderCount2(req.session.admin._id).then((count) => {
      req.session.admin.cartCount = count
    })

    res.render('admin/admin-home', { admin:true ,admin: req.session.admin,})
  } else {
    res.render('admin/admin-login', { "loginErr": req.session.loginErr })
    req.session.loginErr=false
  }

})
router.post('/login', (req, res) => {
  console.log(req.body);
  adminHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.adminloggedIn = true
      req.session.admin = response.user
 
      res.redirect('/admin')
    } else {
      req.session.loginErr = "Invalid username or password"
      res.redirect('/admin')
    }
  })
})

router.get('/admin-logout', (req, res) => {
  console.log("hiiiiiiiii");
  req.session.destroy()
  res.redirect('/admin/')
})



router.get('/product', (req, res) => {
  adminHelpers.getAllProducts().then((products)=>{
  res.render('admin/products',{products, admin:true})
  })
})
router.get('/add-product', (req, res) => {
  res.render('admin/add-products',{admin: true})
})
router.post('/add-products', store.array('file'), (req, res) => {
  console.log(req.body);
   
 
    // let image = req.files.image1
    // image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
    //   if (!err) {
    //     res.redirect('/admin/add-product')
    //   } else {
    //     console.log(err)
    //   }
    // })
    const { files } = req;  

    if (!files){
      const error = new Error ('please select file')
      error.httpStatusCode = 400
      return next(error);
    
    }
    const imgArray = files.map((file)=>{
      const img = fs.readFileSync(file.path)
      return encode_image = img.toString('base64')
    })

    const finalImg = []
    imgArray.map((src,index)=>{
      const result = finalImg.push({
        filename: files[index].originalname,
        contentType: files[index].mimetype,
        imageBase64: src,
      })
      return result
    })

    adminHelpers.productUpload(req.body, finalImg).then((status)=>{
      req.session.added=true
      res.redirect('/admin/add-product')
    }).catch(((error)=>{
      
    }))
    
 
  
})
router.get('/users', (req, res) => {
  adminHelpers.getAllUsers(req.body).then((user)=>{
    res.render('admin/user',{user,layout:false})
  })
  
})
 
router.get('/orders', (req, res) => {
  adminHelpers.getAllorders().then((products)=>{
   
    products.forEach(element =>{
      element.date = moment(element.date).format("MM Do YY");
    })
  res.render('admin/order',{products,admin:true})
  })
})
router.get('/trans', (req, res) => {
  res.render('admin/transactions')
})
router.get('/stati',(req,res)=>{
  res.render('admin/statistics')
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  adminHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/product')
  })
})

router.get('/edit-product/:id',async (req,res)=>{
  let product=await adminHelpers.getProductDetails(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  adminHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/product')
  })
})



// Coupenn...................


router.get('/coupon-management', (req, res) => {
  adminHelpers.getAllCoupons(req.body).then((response) => {
    const AllCoupons = response;
    console.log("all coupons",AllCoupons);
    res.render('admin/coupon-management', { AllCoupons,admin: true });
  }); 
})

router.get("/deletecoupon/:id", (req, res) => {
  adminHelpers.deletecoupon(req.params.id).then((response) => {
    res.json({ coupondeleted: true });
  });
});

router.get("/addcoupon", (req, res) => {
  res.render("admin/addcoupon", { layout: false });
});

router.post("/AddCoupon", (req, res) => {
  adminHelpers.AddCoupon(req.body).then(() => {
    res.redirect("/admin/addcoupon");
  });
});






// dasbord........................

router.post('/getData', async (req, res) => {
  console.log(req.body, 'req.body');
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });
  adminHelpers.salesReport(req.body).then((data) => {

    let pendingAmount = data.pendingAmount
    let salesReport = data.salesReport
    let brandReport = data.brandReport
    let orderCount = data.orderCount
    let totalAmountPaid = data.totalAmountPaid
    // let totalAmountRefund = data.totalAmountRefund

    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    })
    // let brandArray = [];
    // let sumArray = [];
    // brandReport.forEach((s) => {
    //   brandArray.push(s._id);
    //   sumArray.push(s.totalAmount);
    // });
    // console.log("", brandArray);
    // console.log("", sumArray);
    // console.log("", dateArray);
    // console.log("", totalArray);
    // console.log(totalArray);
    res.json({ dateArray, totalArray, orderCount, totalAmountPaid })
  })
})



// order-management.......................

// router.get("/order-manegement", (req, res) => {
//   adminHelpers.allorders().then((response) => {
//     const allorders = response;
//     allorders.forEach((element) => {
//       element.ordered_on = moment(element.ordered_on).format("MMM Do YY");
//     });
//     // console.log("heyyehey",allorders );
//     res.render("admin/order-manegement", { allorders });
//   });
// });

router.get("/order-managee/:id", async(req, res) => {
  // adminHelpers.orderdetails(req.params.id).then((response) => {
    // const order = response;
    let order= await userHelpers.getorderdetailss(req.params.id)
    let products = await userHelpers.getOrderProducts(req.params.id)
    const ordered_on = moment(order.ordered_on).format("MMM Do YY");
    console.log("iiiiiiiiiii",order);
    console.log("kkkkkkkkkkk",products);
    res.render("admin/order-manage", { ordered_on, admin: true, order ,products});
  });
// });  

router.post("/changeOrderStatus", (req, res) => {
  console.log("admin.......")
  adminHelpers.changeOrderStatus(req.body).then((response) => {
    console.log(response);
    res.json({ modified: true });
  });
});



 

module.exports = router;

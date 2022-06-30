const express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
const router = express.Router();
const adminHelper = require('../helpers/admin-helpers')
const store = require ('../middlewear/multer')
const fs = require('fs');
const { status } = require('express/lib/response');
const moment = require('moment')
/* GET users listing. */


router.get('/', (req, res) => {
  
  if ( 
    req.session.adminloggedIn
  ) {

    res.render('admin/admin-home', { admin:true })
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
    res.render('admin/user',{user})
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
 

module.exports = router;

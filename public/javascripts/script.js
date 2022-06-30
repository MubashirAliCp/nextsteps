const { response } = require("../../app");

function addToCart(proId){
    $.ajax({
        url:'/addto-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count = parseInt(count)+1
                $("#cart-count").html(count)
            }
        }
    })
}

function addTowishlist(proId){
	
    $.ajax({
       
        url:'/whishlist/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
              
                count = parseInt(count)+1
                $("#cart-count").html(count)
            }
        }
    })
}


function addTowishlist1(proId){
	
    $.ajax({
       
        url:'/whishlist/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
              location.reload()
                count = parseInt(count)+1
                $("#cart-count").html(count)
            }
        }
    })
}






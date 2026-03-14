/* =========================
DATA PRODUK
========================= */

let categories={

minecraft:[

{name:"Minecraft Java & Bedrock | Rp230.000",stock:"120",logo:"https://img.sanishtech.com/u/e998549682c6a330c69459205bfcd42f.png"},
{name:"Minecraft Windows | Rp50.000",stock:"40",logo:"https://img.sanishtech.com/u/86384e9b272360752913be44a03992af.png"},
{name:"Minecraft Java Edition | Rp195.000",stock:"31",logo:"https://img.sanishtech.com/u/610fc506d0c00fc2a70ab06c850a5c01.png"},
{name:"Realms | Rp30.000 diskon 33%",stock:"387",logo:"https://img.sanishtech.com/u/9ac6af7f0823573ef13ddc3881a3a264.png"},
{name:"Minecoins (330) | Rp52.000",stock:"999+",logo:"https://img.sanishtech.com/u/96418f072262642d24bf88b01f5031a8.png"},
{name:"Minecoins (1720) | Rp115.000",stock:"999+",logo:"https://img.sanishtech.com/u/96418f072262642d24bf88b01f5031a8.png"},
{name:"Minecoins (3500) | Rp250.000",stock:"999+",logo:"https://img.sanishtech.com/u/96418f072262642d24bf88b01f5031a8.png"}

],

premium:[

{name:"Alight Motion Pro | No Garansi | Rp8.000",stock:"348",logo:"https://img.sanishtech.com/u/76950856d7ab69b70825ee04a67892ba.png"},
{name:"Alight Motion Pro | Garansi | Rp15.000",stock:"348",logo:"https://img.sanishtech.com/u/76950856d7ab69b70825ee04a67892ba.png"},
{name:"Capcut | No Garansi | Rp8.000",stock:"104",logo:"https://img.sanishtech.com/u/077a27ce7bcc04adb0295b48a0c958f6.png"},
{name:"Capcut | Garansi | Rp14.000",stock:"104",logo:"https://img.sanishtech.com/u/077a27ce7bcc04adb0295b48a0c958f6.png"},
{name:"Canva | No Garansi | Rp2.000",stock:"211",logo:"https://img.sanishtech.com/u/4c381d0bb566e7a036b4786faf17a345.png"},
{name:"Canva | Garansi | Rp3.000",stock:"211",logo:"https://img.sanishtech.com/u/4c381d0bb566e7a036b4786faf17a345.png"}

],

streaming:[

{name:"Netflix Sharing | Rp16.000",stock:"164",logo:"https://img.sanishtech.com/u/e64c539b0d97cb3940d4074a71c779c5.png"},
{name:"Netflix Private | Rp35.000",stock:"164",logo:"https://img.sanishtech.com/u/e64c539b0d97cb3940d4074a71c779c5.png"},

{name:"Viu 1 Bulan No garansi | Rp3.000",stock:"285",logo:"https://img.sanishtech.com/u/8086de51f0271c52a126b9f010a428e1.png"},
{name:"Viu 1 Bulan Garansi | Rp5.000",stock:"285",logo:"https://img.sanishtech.com/u/8086de51f0271c52a126b9f010a428e1.png"},
{name:"Viu 3 Bulan No garansi | Rp7.000",stock:"285",logo:"https://img.sanishtech.com/u/8086de51f0271c52a126b9f010a428e1.png"},
{name:"Viu 3 Bulan Garansi | Rp9.000",stock:"285",logo:"https://img.sanishtech.com/u/8086de51f0271c52a126b9f010a428e1.png"},
{name:"Viu 6 Bulan No garansi | Rp10.000",stock:"285",logo:"https://img.sanishtech.com/u/8086de51f0271c52a126b9f010a428e1.png"},
{name:"Viu 6 Bulan Garansi | Rp15.000",stock:"285",logo:"https://img.sanishtech.com/u/8086de51f0271c52a126b9f010a428e1.png"},

{name:"Youtube Premium 1 Bulan No garansi | Rp4.000",stock:"999+",logo:"https://img.sanishtech.com/u/8cf2ecfcfd5913de1753df62f492754d.png"},
{name:"Youtube Premium 1 Bulan Garansi | Rp7.000",stock:"999+",logo:"https://img.sanishtech.com/u/8cf2ecfcfd5913de1753df62f492754d.png"},

{name:"Disney+ | No Stock Available",stock:"0",logo:"https://img.sanishtech.com/u/13fa9c5547b0f59d3b06e3f5c0cb0160.png"}

]

}



/* =========================
OPEN CATEGORY
========================= */

function openCategory(name){

document.querySelector(".best").style.display="none"
document.querySelector(".category").style.display="none"

let list=document.getElementById("productList")

list.style.display="block"

document.getElementById("listTitle").innerText=name.toUpperCase()

let items=""

categories[name].forEach(p=>{

items+=`

<div class="option" onclick="openProduct('${p.name}','${p.stock}','${p.logo}')">

<img src="${p.logo}">

<div class="option-text">

<div class="option-title">${p.name}</div>

<div class="option-stock">Stock: ${p.stock}</div>

</div>

</div>

`

})

document.getElementById("listItems").innerHTML=items

}



/* =========================
OPEN PRODUCT
========================= */

let selectedProduct=""
let selectedStock=""

function openProduct(name,stock,logo){

selectedProduct=name
selectedStock=stock

document.querySelector(".best").style.display="none"
document.querySelector(".category").style.display="none"
document.getElementById("productList").style.display="none"

document.getElementById("productPage").style.display="block"

document.getElementById("productName").innerText=name

document.getElementById("productLogo").src=logo

window.scrollTo(0,0)

}



/* =========================
BACK TO HOME
========================= */

function goHome(){

document.querySelector(".best").style.display="grid"

document.querySelector(".category").style.display="block"

document.getElementById("productList").style.display="none"

document.getElementById("productPage").style.display="none"

window.scrollTo(0,0)

}



/* =========================
CHECKOUT
========================= */

function checkout(){

let wa=document.getElementById("waInput").value

let pay=document.getElementById("payMethod").value

let text=`ORDER REVINE VAULT

Produk: ${selectedProduct}

No WA: ${wa}

Metode Pembayaran: ${pay}`

window.open(

"https://wa.me/6287870963655?text="+encodeURIComponent(text)

)

}



/* =========================
COUNTDOWN RAMADHAN
========================= */

let end=new Date("March 20, 2026 23:59:59").getTime()

setInterval(function(){

let now=new Date().getTime()

let dist=end-now

let d=Math.floor(dist/(1000*60*60*24))
let h=Math.floor((dist%(1000*60*60*24))/(1000*60*60))
let m=Math.floor((dist%(1000*60*60))/(1000*60))
let s=Math.floor((dist%(1000*60))/1000)

document.getElementById("countdown").innerHTML=

d+"d "+h+"h "+m+"m "+s+"s"

},1000)



/* =========================
POPUP ORDER
========================= */

let names=["Rizky","Andi","Fajar","Dika","Ilham","Fadlan","Ridho","Febi","Rian","Nita","Nia","Salwa","Dina","Rehan","Farhan","Vian","Vans","Sandi","Indra","Salsa","Ririn","Selvi","Opan","Vino","Dian","Linda","Akbar","Rohmi","Amor","Aziz","Adam","Zidan","Nopal","Nindi","Dewi"]

let items=["Discord Nitro","Realms Plus","Capcut Pro","Netflix","Minecraft Java&Bedrock","Minecraft Windows 10","Viu","Canva","YouTube Premium","Alight Motion","Minecraft Java Edition","Minecoins"]

setInterval(function(){

let name=names[Math.floor(Math.random()*names.length)]

let item=items[Math.floor(Math.random()*items.length)]

let popup=document.getElementById("popup")

popup.innerHTML=name+" baru saja membeli "+item

popup.style.display="block"

setTimeout(()=>popup.style.display="none",4000)

},8000)
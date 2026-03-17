/* =========================
DATA PRODUK
========================= */

let categories={

minecraft:[

{id:"minecraft_java_bedrock",name:"Minecraft Java & Bedrock | private",logo:"https://i.imgur.com/adDcx3h.jpeg"},
{id:"minecraft_windows",name:"Minecraft Windows | private",logo:"https://i.imgur.com/rdjh5mq.jpeg"},
{id:"minecraft_java",name:"Minecraft Java Edition | private",logo:"https://i.imgur.com/AyPF342.jpeg"},
{id:"realms",name:"Realms plus",logo:"https://i.imgur.com/6gEdNru.jpeg"},
{id:"minecoins_330",name:"Minecoins (330)",logo:"https://i.imgur.com/z8dO5XK.jpeg"},
{id:"minecoins_1720",name:"Minecoins (1720)",logo:"https://i.imgur.com/z8dO5XK.jpeg"},
{id:"minecoins_3500",name:"Minecoins (3500)",logo:"https://i.imgur.com/z8dO5XK.jpeg"}

],

premium:[

{id:"discord_nitro",name:"Discord Nitro 3b",logo:"https://i.imgur.com/5eplLHs.jpeg"},
{id:"alightmotion_nogaransi",name:"Alight Motion 1thn private | No Garansi",logo:"https://i.imgur.com/n8cEbzB.jpeg"},
{id:"alightmotion_garansi",name:"Alight Motion 1thn private | Garansi",logo:"https://i.imgur.com/n8cEbzB.jpeg"},
{id:"capcut_nogaransi",name:"Capcut 1b private | No Garansi",logo:"https://i.imgur.com/ecXPj4H.jpeg"},
{id:"capcut_garansi",name:"Capcut 1b private | Garansi",logo:"https://i.imgur.com/ecXPj4H.jpeg"},
{id:"canva_nogaransi",name:"Canva 1b private | No Garansi",logo:"https://i.imgur.com/SZXiiwR.jpeg"},
{id:"canva_garansi",name:"Canva 1b private | Garansi",logo:"https://i.imgur.com/SZXiiwR.jpeg"}
  
],

streaming:[

{id:"netflix_sharing",name:"Netflix 1b Sharing",logo:"https://i.imgur.com/ic0uqkN.jpeg"},
{id:"netflix_private",name:"Netflix 1b Private",logo:"https://i.imgur.com/ic0uqkN.jpeg"},

{id:"viu_1bulan_nogaransi",name:"Viu 1b private | No garansi",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_1bulan_garansi",name:"Viu 1b private | Garansi",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_3bulan_nogaransi",name:"Viu 3b private | No garansi",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_3bulan_garansi",name:"Viu 3b private | Garansi",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_6bulan_nogaransi",name:"Viu 6b | No garansi",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_6bulan_garansi",name:"Viu 6b | Garansi",logo:"https://i.imgur.com/HyWq0zX.jpeg"},

{id:"youtube_1bulan_nogaransi",name:"Youtube Premium 1b private | No garansi",logo:"https://i.imgur.com/IuRkpBV.jpeg"},
{id:"youtube_1bulan_garansi",name:"Youtube Premium 1n private | Garansi",logo:"https://i.imgur.com/IuRkpBV.jpeg"},

{id:"disney",name:"Disney+",logo:"https://i.imgur.com/0DoxDMR.jpeg"}

]

}

/* =========================
GLOBAL VARIABLE
========================= */

let selectedProduct = ""
let selectedProductID = ""

let discountPercent = 0
let currentDiscountCode = ""
let currentPrice = 0



/* =========================
OPEN CATEGORY
========================= */

function openCategory(name){

document.querySelector(".best").style.display="none"
document.querySelector(".category").style.display="none"

let list = document.getElementById("productList")
list.style.display="block"

document.getElementById("listTitle").innerText = name.toUpperCase()

let items=""

categories[name].forEach(p=>{

items += `
<div class="option" onclick="openProduct('${p.name}','${p.logo}','${p.id}')">
<img src="${p.logo}">
<div class="option-text">
<div class="option-title">${p.name}</div>
<div class="option-stock" id="stock-${p.id}">Stock: ...</div>
<div class="option-price" id="price-${p.id}">Rp...</div>
</div>
</div>
`

})

document.getElementById("listItems").innerHTML = items

loadProducts()

}


/* =========================
OPEN PRODUCT
========================= */

async function openProduct(name,logo,id){

selectedProduct = name
selectedProductID = id

document.querySelector(".best").style.display="none"
document.querySelector(".category").style.display="none"
document.getElementById("productList").style.display="none"

document.getElementById("productPage").style.display="block"

document.getElementById("productName").innerText = name
document.getElementById("productLogo").src = logo

// reset
discountPercent = 0
currentDiscountCode = ""
currentPrice = 0

document.getElementById("discountInfo").innerText = ""
document.getElementById("discountInput").value = ""
document.getElementById("priceDetail").innerHTML = ""

// ambil harga
const snapshot = await get(ref(db,"products/"+id))
if(snapshot.exists()){
let data = snapshot.val()
showPrice(data.price)
}

window.scrollTo(0,0)

}


/* =========================
BACK HOME
========================= */

function goHome(){
document.querySelector(".best").style.display="grid"
document.querySelector(".category").style.display="block"
document.getElementById("productList").style.display="none"
document.getElementById("productPage").style.display="none"
window.scrollTo(0,0)
}


/* =========================
DISCOUNT
========================= */

async function applyDiscount(){

let code = document.getElementById("discountInput").value.trim().toUpperCase()

if(!code){
alert("Masukkan kode diskon dulu")
return
}

const snapshot = await get(ref(db,"discountCodes/"+code))

if(!snapshot.exists()){
alert("Kode tidak valid")
return
}

const data = snapshot.val()

if(!data.percent){
alert("Error diskon")
return
}

if(data.used >= data.maxUse){
alert("Kode habis")
return
}

let now = new Date()
let exp = new Date(data.exp)

if(now > exp){
alert("Kode expired")
return
}

discountPercent = data.percent
currentDiscountCode = code

document.getElementById("discountInfo").innerText =
"Diskon "+data.percent+"% berhasil digunakan"

showPrice(currentPrice)

}


/* =========================
CHECKOUT
========================= */

async function checkout(){

let wa = document.getElementById("waInput").value
let pay = document.getElementById("payMethod").value

const snap = await get(ref(db,"products/"+selectedProductID))

if(!snap.exists()){
alert("Produk tidak ada")
return
}

let data = snap.val()
let price = data.price
let stock = data.stock

if(stock <= 0){
alert("Stock habis")
return
}

if(discountPercent > 0){
price = price - (price * discountPercent / 100)
}

await update(ref(db,"products/"+selectedProductID),{
stock: stock - 1
})

if(currentDiscountCode){

const d = await get(ref(db,"discountCodes/"+currentDiscountCode))

if(d.exists()){
let used = d.val().used
await update(ref(db,"discountCodes/"+currentDiscountCode),{
used: used + 1
})
}

}

let text = `ORDER REVINE VAULT

Produk: ${selectedProduct}
Harga: Rp${Math.floor(price).toLocaleString()}

No WA: ${wa}

Metode: ${pay}`

window.open("https://wa.me/6287870963655?text="+encodeURIComponent(text))

}


/* =========================
SHOW PRICE
========================= */

function showPrice(price){

if(!price || isNaN(price)) return

currentPrice = price

let el = document.getElementById("priceDetail")
if(!el) return

if(discountPercent === 0){
el.innerHTML = "Harga: Rp" + price.toLocaleString()
return
}

let final = price - (price * discountPercent / 100)

el.innerHTML =
"Rp" + price.toLocaleString() + "<br>" +
"HEMAT Rp" + Math.floor(price-final).toLocaleString() + "<br>" +
"<br><br>" +
"<span>Rp" + Math.floor(final).toLocaleString() + "</span>"

}


/* =========================
LOAD FIREBASE
========================= */

async function loadProducts(){

const snapshot = await get(ref(db,"products"))

if(snapshot.exists()){
const data = snapshot.val()

for(let id in data){

let p = document.getElementById("price-"+id)
let s = document.getElementById("stock-"+id)

if(p) p.innerText = "Rp"+data[id].price.toLocaleString()
if(s) s.innerText = "Stock: "+data[id].stock

}
}

}

window.addEventListener("load", loadProducts)


/* =========================
POPUP ORDER
========================= */

let names=["Rizky","Andi","Fajar","Dika"]
let items=["Realms Plus","Netflix","Nitro"]

setInterval(()=>{
let name = names[Math.floor(Math.random()*names.length)]
let item = items[Math.floor(Math.random()*items.length)]

let popup = document.getElementById("popup")
if(!popup) return

popup.innerHTML = name+" baru saja membeli "+item
popup.style.display="block"

setTimeout(()=>popup.style.display="none",4000)

},8000)


/* =========================
COUNTDOWN
========================= */

let end = new Date("March 20, 2026 23:59:59").getTime()

setInterval(()=>{

let now = new Date().getTime()
let d = Math.floor((end-now)/(1000*60*60*24))
let h = Math.floor((end-now)%(1000*60*60*24)/(1000*60*60))
let m = Math.floor((end-now)%(1000*60*60)/(1000*60))
let s = Math.floor((end-now)%(1000*60)/1000)

let el = document.getElementById("countdown")
if(el) el.innerHTML = d+"d "+h+"h "+m+"m "+s+"s"

},1000)

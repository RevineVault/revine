/* =========================
DATA PRODUK
========================= */

let categories={

minecraft:[

{id:"minecraft_java_bedrock",name:"Minecraft Java & Bedrock | private | Rp230.000",logo:"https://i.imgur.com/adDcx3h.jpeg"},
{id:"minecraft_windows",name:"Minecraft Windows | private | Rp50.000",logo:"https://i.imgur.com/rdjh5mq.jpeg"},
{id:"minecraft_java",name:"Minecraft Java Edition | private | Rp195.000",logo:"https://i.imgur.com/AyPF342.jpeg"},
{id:"realms",name:"Realms plus | Rp20.000",logo:"https://i.imgur.com/6gEdNru.jpeg"},
{id:"minecoins_330",name:"Minecoins (330) | Rp52.000",logo:"https://i.imgur.com/z8dO5XK.jpeg"},
{id:"minecoins_1720",name:"Minecoins (1720) | Rp115.000",logo:"https://i.imgur.com/z8dO5XK.jpeg"},
{id:"minecoins_3500",name:"Minecoins (3500) | Rp250.000",logo:"https://i.imgur.com/z8dO5XK.jpeg"}

],

premium:[

{id:"alightmotion_nogaransi",name:"Alight Motion 1thn private | No Garansi | Rp8.000",logo:"https://i.imgur.com/n8cEbzB.jpeg"},
{id:"alightmotion_garansi",name:"Alight Motion 1thn private | Garansi | Rp15.000",logo:"https://i.imgur.com/n8cEbzB.jpeg"},
{id:"capcut_nogaransi",name:"Capcut 1b private | No Garansi | Rp8.000",logo:"https://i.imgur.com/ecXPj4H.jpeg"},
{id:"capcut_garansi",name:"Capcut 1b private | Garansi | Rp14.000",logo:"https://i.imgur.com/ecXPj4H.jpeg"},
{id:"canva_nogaransi",name:"Canva 1b private | No Garansi | Rp2.000",logo:"https://i.imgur.com/SZXiiwR.jpeg"},
{id:"canva_garansi",name:"Canva 1b private | Garansi | Rp3.000",logo:"https://i.imgur.com/SZXiiwR.jpeg"}

],

streaming:[

{id:"netflix_sharing",name:"Netflix 1b Sharing | Rp16.000",logo:"https://i.imgur.com/ic0uqkN.jpeg"},
{id:"netflix_private",name:"Netflix Private | Rp35.000",logo:"https://i.imgur.com/ic0uqkN.jpeg"},

{id:"viu_1bulan_nogaransi",name:"Viu 1b private | No garansi | Rp3.000",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_1bulan_garansi",name:"Viu 1b private | Garansi | Rp5.000",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_3bulan_nogaransi",name:"Viu 3b private | No garansi | Rp7.000",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_3bulan_garansi",name:"Viu 3b private | Garansi | Rp9.000",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_6bulan_nogaransi",name:"Viu 6b | No garansi | Rp10.000",logo:"https://i.imgur.com/HyWq0zX.jpeg"},
{id:"viu_6bulan_garansi",name:"Viu 6b | Garansi | Rp15.000",logo:"https://i.imgur.com/HyWq0zX.jpeg"},

{id:"youtube_1bulan_nogaransi",name:"Youtube Premium 1b private | No garansi | Rp4.000",logo:"https://i.imgur.com/IuRkpBV.jpeg"},
{id:"youtube_1bulan_garansi",name:"Youtube Premium 1n private | Garansi | Rp7.000",logo:"https://i.imgur.com/IuRkpBV.jpeg"},

{id:"disney",name:"Disney+ | No Stock Available",logo:"https://i.imgur.com/0DoxDMR.jpeg"}

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

<div class="option" onclick="openProduct('${p.name}','${p.logo}','${p.id}')">

<img src="${p.logo}">

<div class="option-text">

<div class="option-title">${p.name}</div>

<div class="option-stock" id="stock-${p.id}">Stock: ...</div>

</div>

</div>
`
})

document.getElementById("listItems").innerHTML=items
loadStocks()

}



/* =========================
OPEN PRODUCT
========================= */

let selectedProduct=""
let selectedProductID=""

function openProduct(name,logo,id){

selectedProduct=name
selectedProductID=id

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

async function checkout(){

let wa=document.getElementById("waInput").value
let pay=document.getElementById("payMethod").value

const snapshot = await get(ref(db,"stock/"+selectedProductID))

if(snapshot.exists()){

let stock = snapshot.val()

if(stock > 0){

await update(ref(db,"stock"),{
[selectedProductID]: stock - 1
})

}else{

alert("Stock habis")
return

}

}

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



/* =========================
LOAD STOCK FIREBASE
========================= */

async function loadProducts(){

const snapshot = await get(ref(db,"products"))

if(snapshot.exists()){

const data = snapshot.val()

for(let id in data){

let priceEl = document.getElementById("price-"+id)
let stockEl = document.getElementById("stock-"+id)

if(priceEl){
priceEl.innerText = "Rp"+data[id].price.toLocaleString()
}

if(stockEl){
stockEl.innerText = "Stock: "+data[id].stock
}

}

}

}

window.addEventListener("load", loadProducts)

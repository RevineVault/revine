/* =========================
GLOBAL VARIABLE
========================= */

let selectedProduct = ""
let selectedProductID = ""

let discountPercent = 0
let currentDiscountCode = ""
let currentPrice = 0

/* =========================
HELPER UI
========================= */

function hide(el){
let e = document.querySelector(el)
if(e) e.style.display = "none"
}

function show(el, type="block"){
let e = document.querySelector(el)
if(e) e.style.display = type
}

/* =========================
OPEN CATEGORY
========================= */

async function openCategory(name){

showLoader()
resetAnim()

hide(".flashsale")
hide(".best")
hide(".category")
hide(".popular-section")

show("#productList")

document.getElementById("listTitle").innerText = name.toUpperCase()

const snapshot = await get(ref(db,"products"))
if(!snapshot.exists()) return

const data = snapshot.val()

let items = ""

for(let id in data){

let p = data[id]

// filter kategori
if(p.category !== name) continue

items += `

<div class="card click-effect" onclick="openProduct('${id}')">
<img src="${p.logo}">
<div class="option-text">
<div class="option-title">${p.name}</div>
<div class="option-stock" id="stock-${id}">Stock: ...</div>
<div class="option-price" id="price-${id}">Rp...</div>
</div>
</div>
`
}

document.getElementById("listItems").innerHTML = items

loadProducts()

//paling bawah
setTimeout(()=>{
let loader = document.getElementById("loader")
if(loader) loader.classList.add("hide")
},300)

}

/* =========================
OPEN PRODUCT
========================= */

async function openProduct(id){

showLoader()
resetAnim()

selectedProductID = id

hide(".flashsale")
hide(".best")
hide(".category")
hide(".popular-section")
hide("#productList")

show("#productPage")

const snapshot = await get(ref(db,"products/"+id))
if(!snapshot.exists()) return

let data = snapshot.val()

selectedProduct = data.name

document.getElementById("productName").innerText = data.name
document.getElementById("productLogo").src = data.logo

let desc = document.getElementById("productDesc")

if(desc){
let text = data.description || "Tidak ada deskripsi produk"

// handle dua kondisi:
// 1. newline asli
// 2. string "\n"
text = text.replace(/\\n/g, "\n")

desc.innerHTML = text.replace(/\n/g, "<br>")
}

// reset
discountPercent = 0
currentDiscountCode = ""
currentPrice = 0

document.getElementById("discountInfo").innerText = ""
document.getElementById("discountInput").value = ""
document.getElementById("priceDetail").innerHTML = ""

// tampilkan harga
showPrice(data)

window.scrollTo(0,0)

//paling bawah
setTimeout(()=>{
let loader = document.getElementById("loader")
if(loader) loader.classList.add("hide")
},300)

}

/* =========================
BACK HOME
========================= */

function goHome(){

resetAnim()

show(".flashsale")
show(".best","grid")
show(".category")
show(".popular-section")

hide("#productList")
hide("#productPage")

window.scrollTo(0,0)
}

/* =========================
SHOW PRICE (DISKON AUTO)
========================= */

function showPrice(data){

if(!data || !data.price) return

let price = data.price
let final = price
let html = "Rp" + price.toLocaleString()

// 🔥 diskon firebase
if(data.discount){

let now = new Date()
let end = new Date(data.discount.end)

if(now < end){

let percent = data.discount.percent || 0
final = price - (price * percent / 100)

html = `<s>Rp${price.toLocaleString()}</s><br>
${data.discount.label || "Diskon"} ${percent}%<br><br> <span>Rp${Math.floor(final).toLocaleString()}</span>`
}

}

// 🔥 diskon kode tambahan
if(discountPercent > 0){
final = final - (final * discountPercent / 100)

html += `<br><br>+ Diskon kode ${discountPercent}%<br> <span>Rp${Math.floor(final).toLocaleString()}</span>`
}

currentPrice = final

let el = document.getElementById("priceDetail")
if(el) el.innerHTML = html
}

/* =========================
LOAD PRODUCTS (LIST)
========================= */

async function loadProducts(){

const snapshot = await get(ref(db,"products"))
if(!snapshot.exists()) return

const data = snapshot.val()

for(let id in data){

let p = data[id]

let priceEl = document.getElementById("price-"+id)
let stockEl = document.getElementById("stock-"+id)

if(stockEl){
stockEl.innerText = "Stock: " + (p.stock ?? 0)
}

if(!priceEl) continue

let price = p.price || 0
let final = price
let html = "Rp" + price.toLocaleString()

if(p.discount){

let now = new Date()
let end = new Date(p.discount.end)

if(now < end){

let percent = p.discount.percent || 0
final = price - (price * percent / 100)

html = `<s>Rp${price.toLocaleString()}</s><br>
Rp${Math.floor(final).toLocaleString()}`
}

}

priceEl.innerHTML = html

}
}

/* =========================
FLASH SALE (AUTO)
========================= */

async function loadFlashSale(){

const snapshot = await get(ref(db,"products"))
if(!snapshot.exists()) return

const data = snapshot.val()

let container = document.querySelector(".best")
if(!container) return

let html = ""

for(let id in data){

let p = data[id]

if(!p.discount) continue

let now = new Date()
let end = new Date(p.discount.end)

if(now > end) continue

let percent = p.discount.percent || 0
let price = p.price || 0
let final = price - (price * percent / 100)

html += `

<div class="card" onclick="openProduct('${id}')">

<div class="badge">${p.discount.label || "DISKON"}</div>

<img src="${p.logo}">
<h3>${p.name}</h3>

<p class="price">
<s>Rp${price.toLocaleString()}</s>
Rp${Math.floor(final).toLocaleString()}
</p>

<div class="badge">-${percent}%</div>

</div>
`
}

// kalau kosong → hide
if(html === ""){
hide(".flashsale")
hide(".best")
return
}

container.innerHTML = html
}

/* =========================
POPULAR AUTO
========================= */

async function loadPopular(){

const snapshot = await get(ref(db,"products"))
if(!snapshot.exists()) return

const data = snapshot.val()

let container = document.querySelector(".popular")
if(!container) return

let html = ""

for(let id in data){

let p = data[id]

if(!p.popular) continue

html += `

<div class="popular-card" onclick="openProduct('${id}')">
<img src="${p.logo}">
<h3>${p.name}</h3>
</div>
`
}

if(html === ""){
hide(".popular-section")
return
}

container.innerHTML = html
}

/* =========================
DISCOUNT CODE
========================= */

async function applyDiscount(){

let code = document.getElementById("discountInput").value.trim().toUpperCase()

if(!code){
showToast("Masukkan kode diskon terlebih dahulu", "#ef4444")
return
}

const snapshot = await get(ref(db,"discountCodes/"+code))

if(!snapshot.exists()){
showToast("Kode tidak valid", "#ef4444")
return
}

const data = snapshot.val()

if(data.used >= data.maxUse){
showToast("Kode sudah habis", "#ef4444")
return
}

let now = new Date()
let exp = new Date(data.exp)

if(now > exp){
showToast("Kode sudah expired", "#ef4444")
return
}

discountPercent = data.percent
currentDiscountCode = code

showToast("Diskon "+data.percent+"% berhasil digunakan", "#22c55e")

const snap = await get(ref(db,"products/"+selectedProductID))
if(snap.exists()) showPrice(snap.val())

}

/* =========================
CHECKOUT
========================= */

async function checkout(){

let wa = document.getElementById("waInput").value
let pay = document.getElementById("payMethod").value

const snap = await get(ref(db,"products/"+selectedProductID))
if(!snap.exists()) return alert("Produk tidak ada")

let data = snap.val()
let price = currentPrice
let stock = data.stock

if(stock <= 0) return alert("Stock habis")

await update(ref(db,"products/"+selectedProductID),{
stock: stock - 1
})

// update penggunaan diskon
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

Produk: ${data.name}
Harga: Rp${Math.floor(price).toLocaleString()}

No WA: ${wa}
Metode: ${pay}`

window.open("https://wa.me/6287870963655?text="+encodeURIComponent(text))
}

/* =========================
INIT
========================= */

window.addEventListener("load", loadProducts)
window.addEventListener("load", loadFlashSale)
window.addEventListener("load", loadPopular)

/* =========================
POPUP RANDOM
========================= */

let names=["Rizky","Andi","Fajar","Dika"]
let items=["Realms","Netflix","Nitro"]

setInterval(()=>{
let name = names[Math.floor(Math.random()*names.length)]
let item = items[Math.floor(Math.random()*items.length)]

let popup = document.getElementById("popup")
if(!popup) return

popup.innerHTML = name+" membeli "+item
popup.style.display="block"

setTimeout(()=>popup.style.display="none",4000)

},8000)


/* =========================
TOAST
========================= */

function showToast(message, color="#22c55e"){

let toast = document.getElementById("toast")
if(!toast) return

toast.innerText = message
toast.style.background = color

toast.classList.add("show")

setTimeout(()=>{
toast.classList.remove("show")
},2500)

}


/* =========================
FLASH SALE COUNTDOWN
========================= */

async function loadFlashCountdown(){

const snapshot = await get(ref(db,"products"))
if(!snapshot.exists()) return

const data = snapshot.val()

let endTime = null

// ambil salah satu produk yang punya diskon
for(let id in data){

let p = data[id]

if(p.discount){
endTime = new Date(p.discount.end)
break
}

}

if(!endTime) return

function updateCountdown(){

let now = new Date()
let diff = endTime - now

let el = document.getElementById("countdown")
if(!el) return

// kalau habis
if(diff <= 0){
el.innerText = "Flash sale berakhir"
return
}

let d = Math.floor(diff / (1000*60*60*24))
let h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60))
let m = Math.floor((diff % (1000*60*60)) / (1000*60))
let s = Math.floor((diff % (1000*60)) / 1000)

el.innerText = `⏳ ${d}h ${h}j ${m}m ${s}d`
}

updateCountdown()
setInterval(updateCountdown, 1000)

}

window.addEventListener("load", loadFlashCountdown)

//loader
window.addEventListener("load", ()=>{
let loader = document.getElementById("loader")
if(loader){
setTimeout(()=> loader.classList.add("hide"),500)
}
})


//loader function
function showLoader(){
let loader = document.getElementById("loader")
if(loader){
loader.classList.remove("hide")
}
}


/*ANIMASI SCROLL*/
function initScrollAnim(){

function animate(){

let els = document.querySelectorAll(".scroll-anim")

els.forEach(el=>{
let rect = el.getBoundingClientRect()

if(rect.top < window.innerHeight - 50){
el.classList.add("show")
}else{
el.classList.remove("show") // 🔥 bikin bisa ulang
}

})

}

window.addEventListener("scroll", animate)
animate()
}

//RESET ANIMASI
function resetAnim(){
let els = document.querySelectorAll(".scroll-anim")
els.forEach(el=>{
el.classList.remove("show")
})
}

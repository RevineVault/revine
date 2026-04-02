/* ==========================================
   GLOBAL VARIABLES
========================================== */
let selectedProductID = "";
let discountPercent = 0;
let currentDiscountCode = "";
let currentPrice = 0;

let currentCategoryData = {}; 
let activeSubCategory = "ALL";


/* ==========================================
   HELPER FUNCTIONS (Alat Bantu)
========================================== */
function hide(el) {
    let e = document.querySelector(el);
    if(e) e.style.display = "none";
}

function show(el, type="block") {
    let e = document.querySelector(el);
    if(e) e.style.display = type;
}

function showLoader() {
    let l = document.getElementById("loader");
    if(l) l.classList.remove("hide");
}

function hideLoader() {
    let l = document.getElementById("loader");
    if(l) l.classList.add("hide");
}


/* ==========================================
   CARD GENERATOR (Desain Sultan Universal)
========================================== */
function createCardHTML(id, p) {
    let price = p.price || 0;
    let finalPrice = price;
    let discountHTML = "";
    let badgeHTML = "";

    if(p.discount) {
        let now = new Date();
        let end = new Date(p.discount.end);
        
        if(now < end) {
            let percent = p.discount.percent || 0;
            finalPrice = price - (price * percent / 100);
            
            discountHTML = `
                <div class="c-old-price">
                    <s>Rp${price.toLocaleString()}</s>
                    <span class="c-disc-badge">-${percent}%</span>
                </div>
            `;
            badgeHTML = `<div class="p-flash-badge">FLASH SALE</div>`;
        }
    }

    return `
    <div class="p-card" onclick="openProduct('${id}')">
        <div class="p-img-box">
            ${badgeHTML}
            <img src="${p.logo}" alt="produk">
        </div>
        <div class="p-body">
            <div class="p-tags">
                <span class="c-tag">${(p.category || 'PRODUK').toUpperCase()}</span>
            </div>
            <h3 class="p-title">${p.name}</h3>
            <div class="p-info">⚡ Proses Kilat</div>
            <div class="p-price-area">
                ${discountHTML}
                <div class="p-final-price">Rp${Math.floor(finalPrice).toLocaleString()}</div>
            </div>
            <div class="p-stock">Sisa stok: ${p.stock || 0}</div>
            <button class="p-btn">Beli Sekarang</button>
        </div>
    </div>
    `;
}


/* ==========================================
   KATEGORI & SUB-KATEGORI LOGIC
========================================== */
async function openCategory(name) {
    try {
        showLoader();
        hide(".flashsale");
        hide(".best");
        hide(".category");
        hide(".popular-section");
        show("#productList");

        document.getElementById("listTitle").innerText = name.toUpperCase();
        
        const snap = await get(ref(db, "products"));
        if(!snap.exists()) return;

        const data = snap.val();
        currentCategoryData = {}; 
        let subCategories = new Set(); 
        activeSubCategory = "ALL"; 

        for(let id in data) {
            let p = data[id];
            if(p.category !== name) continue;
            currentCategoryData[id] = p;
            if(p.subcategory) subCategories.add(p.subcategory);
        }

        let subBox = document.getElementById("subCategoryBox");
        if(subCategories.size > 0) {
            let subHtml = `<button class="sub-btn active" onclick="filterSub('ALL', this)">SEMUA</button>`;
            subCategories.forEach(sub => {
                subHtml += `<button class="sub-btn" onclick="filterSub('${sub}', this)">${sub.toUpperCase()}</button>`;
            });
            subBox.innerHTML = subHtml;
            subBox.style.display = "flex";
        } else {
            subBox.style.display = "none"; 
        }

        renderList(); 
    } catch(err) {
        console.error("openCategory error:", err);
    } finally {
        hideLoader();
    }
}

window.filterSub = function(subName, btnElement) {
    activeSubCategory = subName;
    let btns = document.querySelectorAll('.sub-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderList(); 
}

function renderList() {
    let html = "";
    for(let id in currentCategoryData) {
        let p = currentCategoryData[id];
        if(activeSubCategory === "ALL" || p.subcategory === activeSubCategory) {
            html += createCardHTML(id, p);
        }
    }
    document.getElementById("listItems").innerHTML = html;
}


/* ==========================================
   HALAMAN DETAIL PRODUK
========================================== */
async function openProduct(id) {
    try {
        showLoader();
        selectedProductID = id;

        hide(".flashsale");
        hide(".best");
        hide(".category");
        hide(".popular-section");
        hide("#productList");

        show("#productPage");

        const snap = await get(ref(db, "products/" + id));
        if(!snap.exists()) return;

        let data = snap.val();

        document.getElementById("productName").innerText = data.name;
        document.getElementById("productLogo").src = data.logo;

        let desc = (data.description || "Tidak ada deskripsi")
            .replace(/\\n/g, "\n")
            .replace(/\n/g, "<br>");

        document.getElementById("productDesc").innerHTML = desc;

        discountPercent = 0;
        currentDiscountCode = "";
        currentPrice = 0;
        document.getElementById("discountInput").value = "";
        
        showPrice(data);
        window.scrollTo(0,0);

    } catch(err) {
        console.error("openProduct error:", err);
    } finally {
        hideLoader();
    }
}


/* ==========================================
   TOMBOL KEMBALI KE BERANDA
========================================== */
function goHome() {
    show(".flashsale");
    show(".best", "grid");
    show(".category"); 
    show(".popular-section");

    hide("#productList");
    hide("#productPage");

    window.scrollTo(0,0);
}


/* ==========================================
   HITUNG & TAMPILKAN HARGA
========================================== */
function showPrice(data) {
    let price = data.price || 0;
    let final = price;
    let totalDiscount = 0;

    let sumProduct = document.getElementById("sumProduct");
    let sumSubtotal = document.getElementById("sumSubtotal");
    
    if(sumProduct) sumProduct.innerText = data.name || "Produk";
    if(sumSubtotal) sumSubtotal.innerText = "Rp" + price.toLocaleString();

    if(data.discount) {
        let now = new Date();
        let end = new Date(data.discount.end);
        if(now < end) {
            let percent = data.discount.percent || 0;
            final = price - (price * percent / 100);
        }
    }

    if(discountPercent > 0) {
        final = final - (final * discountPercent / 100);
    }

    totalDiscount = price - final;
    
    let discountRow = document.getElementById("sumDiscountRow");
    let discountEl = document.getElementById("sumDiscount");

    if(totalDiscount > 0) {
        if(discountEl) discountEl.innerText = "- Rp" + Math.floor(totalDiscount).toLocaleString();
        if(discountRow) discountRow.style.display = "flex";
    } else {
        if(discountRow) discountRow.style.display = "none";
    }

    currentPrice = final;
    let sumTotal = document.getElementById("sumTotal");
    if(sumTotal) sumTotal.innerText = "Rp" + Math.floor(final).toLocaleString();
}


/* ==========================================
   LOAD FLASH SALE & POPULAR
========================================== */
async function loadFlashSale() {
    try {
        const snap = await get(ref(db, "products"));
        if(!snap.exists()) return;

        const data = snap.val();
        let container = document.querySelector(".best");
        let html = "";

        for(let id in data) {
            let p = data[id];
            if(!p.discount) continue;

            let now = new Date();
            let end = new Date(p.discount.end);
            if(now > end) continue;

            html += createCardHTML(id, p);
        }

        if(html === "") {
            hide(".flashsale");
            hide(".best");
            return;
        }
        container.innerHTML = html;

    } catch(err) {
        console.error("flash error:", err);
    }
}

async function loadPopular() {
    try {
        const snap = await get(ref(db, "products"));
        if(!snap.exists()) return;

        const data = snap.val();
        let container = document.querySelector(".popular");
        let html = "";

        for(let id in data) {
            let p = data[id];
            if(!p.popular) continue;
            html += createCardHTML(id, p);
        }

        if(html === "") {
            hide(".popular-section");
            return;
        }
        container.innerHTML = html;

    } catch(err) {
        console.error("popular error:", err);
    }
}


/* ==========================================
   FITUR KODE DISKON
========================================== */
async function applyDiscount() {
    try {
        let code = document.getElementById("discountInput").value.trim().toUpperCase();
        if(!code) return showToast("Masukkan kode diskon dulu!", "rgb(255, 0, 0)");

        const snap = await get(ref(db, "discountCodes/" + code));
        if(!snap.exists()) return showToast("Kode diskon tidak valid!", "rgb(255, 0, 0)");

        const data = snap.val();
        if(data.used >= data.maxUse) return showToast("Batas pemakaian kode habis!", "rgb(255, 0, 0)");

        let now = new Date();
        if(now > new Date(data.exp)) return showToast("Kode diskon expired!", "rgb(255, 0, 0)");

        discountPercent = data.percent;
        currentDiscountCode = code;

        showToast("Diskon " + data.percent + "% berhasil diterapkan!", "rgb(0, 248, 12)");

        const p = await get(ref(db, "products/" + selectedProductID));
        if(p.exists()) showPrice(p.val());

    } catch(err) {
        console.error("discount error:", err);
    }
}


/* ==========================================
   CHECKOUT & MODAL CONFIRMATION (REVISI)
========================================== */
let pendingOrderData = null; // Penampung data sementara

async function checkout() {
    try {
        let wa = document.getElementById("waInput").value.trim();
        if(!wa) return showToast("Isi nomor WA terlebih dahulu!", "rgb(255, 0, 0)");

        const snap = await get(ref(db, "products/" + selectedProductID));
        if(!snap.exists()) return showToast("Produk tidak ditemukan!", "rgb(255, 0, 0)");

        let data = snap.val();
        if(data.stock <= 0) return showToast("Mohon maaf, stock produk habis!", "rgb(255, 0, 0)");

        let paymentMethod = document.getElementById("payMethod").value;

        // Simpan data orderan di memori sementara
        pendingOrderData = {
            wa: wa,
            data: data,
            payment: paymentMethod
        };

        // Isi data ke kotak Modal (Popup Konfirmasi)
        document.getElementById("mItem").innerText = data.name;
        document.getElementById("mProduct").innerText = (data.subcategory || data.category || "PRODUK").toUpperCase();
        document.getElementById("mPayment").innerText = paymentMethod;

        // Munculin Modal-nya!
        show("#confirmModal", "flex");

        // Tembak partikel Confetti! 🎉
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            zIndex: 10001,
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });

    } catch(err) {
        console.error("checkout error:", err);
    }
}

// Tutup Modal kalau batal
function closeConfirmModal() {
    hide("#confirmModal");
}

// Lanjut ke WA setelah klik "Pesan Sekarang"
async function proceedToWA() {
    try {
        if(!pendingOrderData) return;
        showLoader();

        let wa = pendingOrderData.wa;
        let data = pendingOrderData.data;

        // Kurangi stock di Firebase
        await update(ref(db, "products/" + selectedProductID), {
            stock: data.stock - 1
        });

        // Format pesan WA
        let text = `ORDER REVINE VAULT\n\nProduk: ${data.name}\nHarga: Rp${Math.floor(currentPrice).toLocaleString()}\nMetode Pembayaran: ${pendingOrderData.payment}\nNo WA: ${wa}`;
        
        // Buka Tab WhatsApp
        window.open("https://wa.me/6287870963655?text=" + encodeURIComponent(text));

        // Bersihkan layar
        hideLoader();
        closeConfirmModal();

        // Balik ke home
        setTimeout(() => {
            goHome();
        }, 1500);

    } catch(err) {
        console.error("proceedToWA error:", err);
        hideLoader();
    }
}


/* ==========================================
   COUNTDOWN WAKTU FLASH SALE
========================================== */
async function loadFlashCountdown() {
    try {
        const snap = await get(ref(db, "products"));
        if(!snap.exists()) return;

        const data = snap.val();
        let endTime = null;

        for(let id in data) {
            if(data[id].discount) {
                endTime = new Date(data[id].discount.end);
                break;
            }
        }

        if(!endTime) return;

        function updateCountdown() {
            let diff = endTime - new Date();
            let el = document.getElementById("countdown");
            if(!el) return;

            if(diff <= 0) {
                el.innerText = "Flash sale telah berakhir";
                return;
            }

            let d = Math.floor(diff / (1000 * 60 * 60 * 24));
            let h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            let s = Math.floor((diff % (1000 * 60)) / 1000);

            el.innerText = `⏳ ${d} hari ${h} jam ${m} menit ${s} detik`;
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);

    } catch(err) {
        console.error("countdown error:", err);
    }
}


/* ==========================================
   POPUP NOTIFIKASI TOAST
========================================== */
function showToast(msg, color="#22c55e") {
    let t = document.getElementById("toast");
    if(!t) return;
    
    t.innerText = msg;
    t.style.background = color;  
    t.classList.add("show");
    
    setTimeout(() => {
        t.classList.remove("show");
    }, 2500);
}


/* ==========================================
   INITIALIZATION
========================================== */
window.addEventListener("load", async () => {
    try {
        await loadFlashSale();
        await loadPopular();
        await loadFlashCountdown();
    } catch(err) {
        console.error("INIT error:", err);
    }
    setTimeout(() => hideLoader(), 800);
});

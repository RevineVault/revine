/* ==========================================
   GLOBAL VARIABLES
========================================== */
let selectedProductID = "";
let discountPercent = 0;
let currentDiscountCode = "";
let currentPrice = 0;

let currentCategoryData = {}; 
let activeSubCategory = "ALL";
let pendingOrderData = null; // Tambahan untuk modal konfirmasi

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

// Fungsi buat ngatur format "Terjual" (1234 jadi 1.2rb+)
function formatSold(num) {
    if(!num) return "0 terjual";
    if(num < 1000) return num + " terjual";
    
    let rb = Math.floor(num / 100) / 10; 
    return rb + "rb+ terjual";
}

/* ==========================================
   CARD GENERATOR (Desain Sultan Universal)
========================================== */
function createCardHTML(id, p) {
    let price = p.price || 0;
    let finalPrice = price;
    let discountHTML = "";
    let badgesHTML = "";
    let topOffset = 0;

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
            badgesHTML += `<div class="p-flash-badge" style="top: ${topOffset}px;">FLASH SALE</div>`;
            topOffset += 24;
        }
    }

    if(p.popular) {
        badgesHTML += `<div class="p-popular-badge" style="top: ${topOffset}px;">🔥 PALING LARIS</div>`;
    }

    let rating = p.rating || "5.0";
    let soldFormatted = formatSold(p.sold || 0);

    return `
    <div class="p-card" onclick="openProduct('${id}')">
        <div class="p-img-box">
            ${badgesHTML}
            <img src="${p.logo}" alt="produk">
        </div>
        <div class="p-body">
            <div class="p-tags">
                <span class="c-tag">${(p.category || 'PRODUK').toUpperCase()}</span>
            </div>
            <h3 class="p-title">${p.name}</h3>
            <div class="p-info">
                <span style="color: #10b981;">⚡ Proses Kilat</span>
                <span style="color: #fbbf24;">| ★ ${rating}</span>
                <span style="color: #9ca3af;">| ${soldFormatted}</span>
            </div>
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
window.openCategory = async function(name) {
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
window.openProduct = async function(id) {
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
   TOMBOL KEMBALI KE BERANDA (UPDATED)
========================================== */
window.goHome = function() {
    show(".flashsale");
    show(".best", "grid");
    show(".category"); 
    show(".popular-section");

    hide("#productList");
    hide("#productPage");
    
    // Tambahan buat nutup halaman Bantuan (FAQ dll)
    hide("#faqPage");
    hide("#privacyPage");
    hide("#termsPage");

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
window.loadFlashSale = async function() {
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

window.loadPopular = async function() {
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
window.applyDiscount = async function() {
    try {
        let code = document.getElementById("discountInput").value.trim().toUpperCase();
        if(!code) return showToast("Masukkan kode diskon dulu!", "rgb(255, 0, 0)");

        // Tambahin window. biar 100% ngebaca database Firebase lu
        const snap = await window.get(window.ref(window.db, "discountCodes/" + code));
        if(!snap.exists()) return showToast("Kode diskon tidak valid!", "rgb(255, 0, 0)");

        const data = snap.val();
        
        // Cek batas pemakaian (pakai || 0 biar ga error kalau datanya kosong)
        if((data.used || 0) >= (data.maxUse || 0)) return showToast("Batas pemakaian kode habis!", "rgb(255, 0, 0)");

        // Cek Expired
        let now = new Date();
        if(new Date(data.exp) < now) return showToast("Kode diskon expired!", "rgb(255, 0, 0)");

        discountPercent = data.percent || 0;
        currentDiscountCode = code;

        showToast("Diskon " + discountPercent + "% berhasil diterapkan!", "rgb(0, 248, 12)");

        // Hitung ulang harga di layar
        const p = await window.get(window.ref(window.db, "products/" + selectedProductID));
        if(p.exists()) showPrice(p.val());

    } catch(err) {
        console.error("discount error:", err);
        showToast("Terjadi kesalahan sistem!", "rgb(255, 0, 0)");
    }
}

/* ==========================================
   CHECKOUT & MODAL CONFIRMATION
========================================== */
window.checkout = async function() {
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

        // Isi data ke kotak Modal
        document.getElementById("mItem").innerText = data.name;
        document.getElementById("mProduct").innerText = (data.subcategory || data.category || "PRODUK").toUpperCase();
        document.getElementById("mPayment").innerText = paymentMethod;

        // Munculin Modal
        show("#confirmModal", "flex");

        // Tembak partikel Confetti! 🎉
        if(typeof confetti === "function") {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                zIndex: 10001,
                colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
        }

    } catch(err) {
        console.error("checkout error:", err);
    }
}

window.closeConfirmModal = function() {
    hide("#confirmModal");
}

window.proceedToWA = async function() {
    try {
        if(!pendingOrderData) return;
        showLoader();

        let wa = pendingOrderData.wa;
        let data = pendingOrderData.data;

        let currentStock = data.stock || 0;
        let currentSold = data.sold || 0;

        // Kurangi stock dan tambah sold di Firebase
        await update(ref(db, "products/" + selectedProductID), {
            stock: currentStock > 0 ? currentStock - 1 : 0,
            sold: currentSold + 1
        });

        // Format pesan WA
        let text = `ORDER REVINE VAULT\n\nProduk: ${data.name}\nHarga: Rp${Math.floor(currentPrice).toLocaleString()}\nMetode Pembayaran: ${pendingOrderData.payment}\nNo WA: ${wa}`;
        
        // Buka Tab WhatsApp
        window.open("https://wa.me/6287870963655?text=" + encodeURIComponent(text));

        hideLoader();
        closeConfirmModal();

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
window.loadFlashCountdown = async function() {
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
window.showToast = function(msg, color="#22c55e") {
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
   FUNGSI BUKA HALAMAN INFO (FAQ dll) BARU
========================================== */
window.openPage = function(pageId) {
    hide(".flashsale"); 
    hide(".best"); 
    hide(".category"); 
    hide(".popular-section");
    hide("#productList"); 
    hide("#productPage");
    
    hide("#faqPage");
    hide("#privacyPage");
    hide("#termsPage");

    show("#" + pageId);
    window.scrollTo(0,0);
}

window.toggleFAQ = function(element) {
    if (element.classList.contains("active")) {
        element.classList.remove("active");
    } else {
        let allFaq = document.querySelectorAll(".faq-item");
        allFaq.forEach(faq => faq.classList.remove("active"));
        element.classList.add("active");
    }
}

/* ==========================================
   INITIALIZATION 
========================================== */
window.addEventListener("load", async () => {
    try {
        await window.loadFlashSale();
        await window.loadPopular();
        await window.loadFlashCountdown();
    } catch(err) {
        console.error("INIT error:", err);
    }
    
    // Matikan loading saat data udah dimuat
    setTimeout(() => hideLoader(), 800);
});

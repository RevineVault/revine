/* ==========================================
   GLOBAL VARIABLES
========================================== */
let selectedProductID = "";
let discountPercent = 0;
let currentDiscountCode = "";
let currentPrice = 0;

let currentCategoryData = {}; 
let activeSubCategory = "ALL";
let pendingOrderData = null; 
let currentOrderId = ""; 

// ==========================================
// SISTEM CACHE (VERSI CEPAT & ANTI HANG)
// ==========================================
let globalProductsCache = null;
let globalFetchPromise = null;

window.getProductsData = async function() {
    if (globalProductsCache) return globalProductsCache;
    if (globalFetchPromise) return globalFetchPromise;

    globalFetchPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            globalFetchPromise = null; 
            reject(new Error("Koneksi ke server terlalu lama (Timeout)."));
        }, 8000);

        // Nembak ke API Cloudflare lu
        fetch("https://api.revine-network.workers.dev")
            .then(res => res.json()) 
            .then(data => {
                clearTimeout(timeoutId);
                if(data) {
                    globalProductsCache = data;
                }
                resolve(globalProductsCache);
            })
            .catch(err => {
                clearTimeout(timeoutId);
                console.error("Gagal narik data dari Cloudflare:", err);
                globalFetchPromise = null;
                reject(err);
            });
    });
    
    return globalFetchPromise;
}

// TOKEN DAN CHAT ID TELEGRAM
const TELEGRAM_BOT_TOKEN = "8680800810:AAEjdDN2zthAx-cR2CYk3XI7Su_0ifVR3bw"; 
const TELEGRAM_CHAT_ID = "5933988516";

/* ==========================================
   HELPER FUNCTIONS (Alat Bantu)
========================================== */
function hide(el) { let e = document.querySelector(el); if(e) e.style.display = "none"; }
function show(el, type="block") { let e = document.querySelector(el); if(e) e.style.display = type; }
function showLoader() { let l = document.getElementById("loader"); if(l) l.classList.remove("hide"); }
function hideLoader() { let l = document.getElementById("loader"); if(l) l.classList.add("hide"); }

function formatSold(num) {
    if(!num) return "0 terjual";
    if(num < 1000) return num + " terjual";
    let rb = Math.floor(num / 100) / 10; 
    return rb + "rb+ terjual";
}

window.showToast = function(msg, color="#22c55e") {
    let t = document.getElementById("toast");
    if(!t) return;
    
    // Deteksi warna (Error merah vs Success hijau)
    let isError = color === "rgb(255, 0, 0)" || color === "red" || color.includes("255, 0, 0");
    
    // Ganti background biar lebih elegan (sedikit transparan + ada border garis)
    let bgColor = isError ? "rgba(220, 38, 38, 0.95)" : "rgba(22, 163, 74, 0.95)";
    let borderColor = isError ? "#f87171" : "#4ade80";

    // Langsung masukin pesannya aja, polosan tapi clean
    t.innerText = msg;
    t.style.background = bgColor;
    t.style.border = `1px solid ${borderColor}`;
    
    t.classList.add("show");
    
    // Clear timer sebelumnya biar kalau user spam klik tombol, animasinya ga ngaco
    clearTimeout(window.toastTimer);
    
    // Hilangkan popup setelah 3 detik
    window.toastTimer = setTimeout(() => { 
        t.classList.remove("show"); 
    }, 3000); 
}

/* ==========================================
   BROWSER BACK BUTTON LOGIC
========================================== */
window.addEventListener("popstate", (e) => {
    if(typeof closeConfirmModal === "function") closeConfirmModal();

    if (e.state) {
        let view = e.state.view;
        if (view === 'home') goHome(true);
        else if (view === 'category') openCategory(e.state.id, true);
        else if (view === 'product') openProduct(e.state.id, true);
        else if (view === 'page') openPage(e.state.id, true);
        else if (view === 'payment') restorePaymentPage(e.state.id);
    } else {
        goHome(true); 
    }
});

/* ==========================================
   CARD GENERATOR (REVISI FIX: INFO DI ATAS, STOK DI BAWAH HARGA)
========================================== */
function createCardHTML(id, p) {
    let price = p.price || 0;
    let finalPrice = price;
    let discountHTML = "";
    let badgesHTML = "";
    let countdownHTML = ""; 
    let topOffset = 0;

    if(p.discount) {
        let now = new Date(); let end = new Date(p.discount.end);
        if(now < end) {
            let percent = p.discount.percent || 0;
            finalPrice = price - (price * percent / 100);
            discountHTML = `<div class="c-old-price"><s>Rp${price.toLocaleString()}</s><span class="c-disc-badge">-${percent}%</span></div>`;
            badgesHTML += `<div class="p-flash-badge" style="top: ${topOffset}px;">FLASH SALE</div>`;
            topOffset += 24;
            countdownHTML = `<div class="p-card-countdown" data-end="${p.discount.end}">⏳ Menghitung...</div>`;
        }
    }

    if(p.popular) badgesHTML += `<div class="p-popular-badge" style="top: ${topOffset}px;">🔥 PALING LARIS</div>`;
    let rating = p.rating || "5.0";

    return `
    <div class="p-card" onclick="openProduct('${id}')">
        <div class="p-img-box">${badgesHTML}<img src="${p.logo}" alt="produk">${countdownHTML}</div>
        <div class="p-body">
            <div class="p-tags"><span class="c-tag">${(p.category || 'PRODUK').toUpperCase()}</span></div>
            <h3 class="p-title">${p.name}</h3>
            
            <div class="p-info">
                <span style="color: #10b981; display: inline-flex; align-items: center; gap: 4px; font-weight: 800;">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: skewX(-15deg);">
                        <line x1="1" y1="8" x2="5" y2="8"></line><line x1="3" y1="12" x2="7" y2="12"></line><line x1="2" y1="16" x2="5" y2="16"></line><circle cx="14" cy="12" r="7"></circle><polyline points="14 9 14 12 17 12"></polyline>
                    </svg> PROSES CEPAT
                </span>
                <span style="color: #64748b;">|</span> 
                <span style="color: #fbbf24; font-weight: 800; display: inline-flex; align-items: center; gap: 2px;">★ ${rating}</span>
            </div>
            
            <div class="p-price-area">
                ${discountHTML}
                <div class="p-final-price">Rp${Math.floor(finalPrice).toLocaleString()}</div>
                <div class="p-stock-pill" style="margin-top: 6px; display: inline-block;">Sisa stock ${p.stock || 0}</div>
            </div>
            
            <button class="p-btn">Beli Sekarang</button>
        </div>
    </div>`;
}

/* ==========================================
   NAVIGASI (HOME & INFO PAGES)
========================================== */
window.goHome = function() {
    window.location.href = "index.html";
}

window.openPage = function(pageId) {
    if (window.location.pathname.includes("checkout.html")) {
        window.location.href = "index.html#" + pageId;
        return;
    }
    
    hide(".banner"); hide(".popular-section"); hide(".category"); hide("#homeProductSection");
    hide("#faqPage"); hide("#privacyPage"); hide("#termsPage"); hide("#cekPesananPage");
    show("#" + pageId); 
    window.scrollTo(0,0);
}

/* ==========================================
   KATEGORI & PRODUK LOGIC (SEAMLESS HOMEPAGE)
========================================== */
window.openCategory = async function(name, fromPopState = false) {
    if(!fromPopState) history.pushState({ view: 'home' }, "", "#kategori-" + name.replace(/\s+/g, '-'));

    // Highlight kategori yang lagi dipencet (Kasih efek nyala)
    document.querySelectorAll(".category-card").forEach(el => {
        let onClickAttr = el.getAttribute("onclick");
        if(onClickAttr && onClickAttr.includes(`'${name}'`)) {
            el.classList.add("active-cat");
        } else {
            el.classList.remove("active-cat");
        }
    });

    // PENTING: Jangan sembunyikan banner & kategori! Tetap di beranda!
    hide("#productPage"); hide("#paymentStatusPage"); hide("#cekPesananPage"); hide("#faqPage"); hide("#privacyPage"); hide("#termsPage");
    show(".banner"); show(".popular-section"); show(".category"); show("#homeProductSection");

    let listItems = document.getElementById("listItems");
    document.getElementById("subCategoryBox").style.display = "none";
    listItems.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #0ea5e9; font-weight: bold; font-size: 15px;">Memuat produk...</div>';

    try {
        const data = await window.getProductsData();
        if(!data) {
            listItems.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #9ca3af;">Belum ada produk.</div>';
            return;
        }
        currentCategoryData = {}; let subCategories = new Set(); activeSubCategory = "ALL"; 

        for(let id in data) {
            let p = data[id];
            // LOGIKA FILTER: Jika 'semua', sikat semua. Jika bukan, sesuaikan namanya.
            if(name === "semua" || p.category === name) {
                currentCategoryData[id] = p;
                if(p.subcategory) subCategories.add(p.subcategory);
            }
        }

        let subBox = document.getElementById("subCategoryBox");
        // Munculkan tombol Sub-kategori HANYA jika bukan di tab "semua" (biar rapi)
        if(subCategories.size > 0 && name !== "semua") {
            let subHtml = `<button class="sub-btn active" onclick="filterSub('ALL', this)">SEMUA</button>`;
            subCategories.forEach(sub => { subHtml += `<button class="sub-btn" onclick="filterSub('${sub}', this)">${sub.toUpperCase()}</button>`; });
            subBox.innerHTML = subHtml;
            subBox.style.display = "flex";
        }
        
        renderList(); 
        
    } catch(err) { 
        console.error(err); 
        listItems.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #1e293b; border-radius: 12px; border: 1px solid #334155; margin-top: 10px;">
                <h2 style="color: #ef4444; font-size: 24px; font-weight: bold; margin-bottom: 10px;">Oops, something went wrong.</h2>
                <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 20px;">Gagal memuat data, silakan refresh.</p>
                <button onclick="location.reload()" style="background: #0ea5e9; color: white; border: none; padding: 10px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; transition: 0.2s; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);">
                    REFRESH
                </button>
            </div>
        `;
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
        if(activeSubCategory === "ALL" || p.subcategory === activeSubCategory) html += createCardHTML(id, p);
    }
    document.getElementById("listItems").innerHTML = html;
    window.initCardCountdowns(); // <--- TAMBAHKAN BARIS INI COY
}

window.openProduct = function(id) {
    window.location.href = "checkout.html?id=" + id;
}

/* ==========================================
   HARGA & DISKON
========================================== */
function showPrice(data) {
    let price = data.price || 0;
    let final = price;
    let totalDiscount = 0;
    let hasProductDiscount = false;

    if(document.getElementById("sumProduct")) document.getElementById("sumProduct").innerText = data.name || "Produk";
    if(document.getElementById("sumSubtotal")) document.getElementById("sumSubtotal").innerText = "Rp" + price.toLocaleString();

    if(data.discount) {
        let now = new Date(); let end = new Date(data.discount.end);
        if(now < end) { final = price - (price * (data.discount.percent || 0) / 100); hasProductDiscount = true; }
    }

    if(discountPercent > 0) final = final - (final * discountPercent / 100);
    totalDiscount = price - final;
    
    let discountRow = document.getElementById("sumDiscountRow");
    if(totalDiscount > 0) {
        document.getElementById("sumDiscount").innerText = "- Rp" + Math.floor(totalDiscount).toLocaleString();
        if(discountRow) discountRow.style.display = "flex";
    } else { if(discountRow) discountRow.style.display = "none"; }

    let roundedFinal = final;
    let serviceFeeRow = document.getElementById("sumServiceFeeRow");
    
    if (hasProductDiscount && final % 1000 !== 0) { 
        roundedFinal = Math.ceil(final / 1000) * 1000;
        let serviceFee = roundedFinal - final;
        if(serviceFeeRow) serviceFeeRow.style.display = "flex";
        document.getElementById("sumServiceFee").innerText = "+ Rp" + Math.floor(serviceFee).toLocaleString();
        document.getElementById("feePercent").innerText = `(${((serviceFee / final) * 100).toFixed(2)}%)`;
    } else {
        if(serviceFeeRow) serviceFeeRow.style.display = "none";
    }

    // --- TAMBAHAN LOGIKA BIAYA 0.5 ---
    // Dihitung dari harga setelah diskon & pembulatan (roundedFinal)
    let systemFee = Math.floor(roundedFinal * 0.005);
    
    let systemFeeRow = document.getElementById("sumSystemFeeRow");
    let systemFeeText = document.getElementById("sumSystemFee");
    
    if(systemFeeRow && systemFeeText) {
        systemFeeRow.style.display = "flex";
        systemFeeText.innerText = "+ Rp" + systemFee.toLocaleString();
    }

    // --- UPDATE TOTAL AKHIR ---
    currentPrice = roundedFinal + systemFee; 
    if(document.getElementById("sumTotal")) document.getElementById("sumTotal").innerText = "Rp" + currentPrice.toLocaleString();
}

window.applyDiscount = async function() {
    try {
        let code = document.getElementById("discountInput").value.trim().toUpperCase();
        if(!code) return showToast("Masukkan kode diskon dulu!", "red");
        
        // [REST API] Nembak sekali lalu putus (0 Koneksi)
        const res = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/discountCodes/${code}.json`);
        const data = await res.json();
        
        if(!data) return showToast("Kode diskon tidak valid!", "red");
        if((data.used || 0) >= (data.maxUse || 0)) return showToast("Batas pemakaian kode habis!", "red");
        if(new Date(data.exp) < new Date()) return showToast("Kode diskon expired!", "red");

        discountPercent = data.percent || 0;
        currentDiscountCode = code;
        showToast("Diskon " + discountPercent + "% berhasil diterapkan!", "rgb(0, 248, 12)");

        // [TWEAK] Kita ambil harga terbaru dari Cloudflare, bukan nembak Firebase lagi!
        const products = await window.getProductsData();
        if(products && products[selectedProductID]) showPrice(products[selectedProductID]);
    } catch(err) { console.error(err); showToast("Terjadi kesalahan sistem!", "red"); }
}

/* ==========================================
   CHECKOUT, INVOICE & TELEGRAM
========================================== */
window.checkout = async function() {
    try {
        let countryCode = document.getElementById("selectedCountryCode").innerText;
        let waRaw = document.getElementById("waInput").value.trim();
        if(waRaw.startsWith("0")) waRaw = waRaw.substring(1); 
        let wa = waRaw ? (countryCode + waRaw) : "";

        let catatan = document.getElementById("catatanInput").value.trim(); 
        let nama = document.getElementById("namaInput").value.trim();
        let email = document.getElementById("emailInput").value.trim();

        if(!wa) return showToast("Isi nomor WA terlebih dahulu!", "red");
        if(!email) return showToast("Isi Email terlebih dahulu!", "red");
        if(!nama) return showToast("Isi Nama Lengkap terlebih dahulu!", "red");

        // [SOLUSI INSTAN] Ngambil data langsung dari cache Cloudflare lu!
        const products = await window.getProductsData();
        const data = products ? products[selectedProductID] : null;
        
        if(!data) return alert("Error: Produk tidak ditemukan di sistem!");
        if(data.stock <= 0) return alert("Mohon maaf, stock produk habis!");

        let paymentMethod = document.getElementById("payMethod").value;
        
        pendingOrderData = { 
            wa: wa, nama: nama, email: email, data: data, payment: paymentMethod, catatan: catatan 
        };

        document.getElementById("mItem").innerText = data.name;
        document.getElementById("mProduct").innerText = (data.subcategory || data.category || "PRODUK").toUpperCase();
        document.getElementById("mPayment").innerText = paymentMethod;

        let cb = document.getElementById("agreeTerms");
        let btn = document.getElementById("btnPesanSekarang");
        if(cb && btn) {
            cb.checked = false;
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        }

        show("#confirmModal", "flex");
    } catch(err) { 
        console.error("ERROR CHECKOUT:", err);
        alert("Sistem Error Bang: " + err.message); 
    }
}

window.closeConfirmModal = function() { hide("#confirmModal"); }

window.proceedToWA = async function() {
    if(!pendingOrderData) return;
    showLoader();

    // 1. Bikin ID & Simpan ke Firebase
    currentOrderId = "RVN-" + Math.floor(10000 + Math.random() * 90000);
    
    // 2. SIMPAN ID PESANAN KE URL & MEMORI
    history.pushState({ view: 'payment', id: currentOrderId }, "", "#payment-" + currentOrderId);
    localStorage.setItem("lastView", JSON.stringify({ view: 'payment', id: currentOrderId }));

    // (Biarin kode bikin ID dan Date tetep ada, ubah bagian simpan datanya aja)
    let today = new Date().toLocaleDateString('id-ID');
    let orderPayload = {
        productId: selectedProductID, 
        productName: pendingOrderData.data.name,
        price: currentPrice, 
        payment: pendingOrderData.payment,
        waNumber: pendingOrderData.wa, 
        nama: pendingOrderData.nama,   
        email: pendingOrderData.email, 
        catatan: pendingOrderData.catatan || "-", 
        date: today, 
        status: "Menunggu Pembayaran",
        discountCode: currentDiscountCode
    };

    // [REST API] Kirim data pesanan pakai metode PATCH (0 Koneksi)
    await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${currentOrderId}.json`, {
        method: "PATCH",
        body: JSON.stringify(orderPayload)
    });

    // 3. ISI DATA KE HALAMAN PEMBAYARAN
    document.getElementById("payOrderId").innerText = currentOrderId;
    document.getElementById("payTotalDisplay").innerText = "Rp" + Math.floor(currentPrice).toLocaleString();
    document.getElementById("payProductName").innerText = pendingOrderData.data.name; 
    document.getElementById("payMethodDisplay").innerText = pendingOrderData.payment; 
    document.getElementById("payWANumber").innerText = pendingOrderData.wa;
    document.getElementById("payCatatan").innerText = pendingOrderData.catatan || "-";

    // 4. JALANKAN TIMER
    startPaymentTimer(3600); 

    // --- 4.5. KIRIM INVOICE OTOMATIS KE EMAIL PEMBELI ---
    // Siapin instruksi pembayaran sesuai pilihan user
    let instruksiBayar = "";
    if (pendingOrderData.payment === "QRIS") {
        instruksiBayar = `
            <p style="margin: 0 0 10px 0; color: #334155;">Silakan scan kode QRIS berikut:</p>
            <img src="https://i.imgur.com/eID6zIo.jpeg" alt="QRIS" style="width: 200px; border-radius: 8px; border: 2px solid #e2e8f0; display: block; margin: 0 auto;">
            <p style="font-size: 11px; color: #64748b; margin-top: 10px;">*Screenshot lalu scan di aplikasi M-Banking/E-Wallet</p>
        `;
    } else if (pendingOrderData.payment === "Dana" || pendingOrderData.payment === "Gopay" || pendingOrderData.payment === "ShopeePay") {
        instruksiBayar = `
            <p style="margin: 0 0 5px 0; color: #334155;">Transfer ke E-Wallet ${pendingOrderData.payment}:</p>
            <h2 style="margin: 0; color: #0ea5e9; font-size: 24px;">0896-3642-9860</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">A/N: ILYAS MAULANA YUSUF</p>
        `;
    } else {
        instruksiBayar = `
            <p style="margin: 0 0 5px 0; color: #334155;">Transfer ke Rekening ${pendingOrderData.payment}:</p>
            <h2 style="margin: 0; color: #0ea5e9; font-size: 24px;">901547937250</h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">A/N: ILYAS MAULANA YUSUF</p>
        `;
    }

    // Bikin link otomatis ke WA Admin bawa order ID-nya
    let teksWaUntukEmail = `Halo Admin, saya sudah membayar Order ID: ${currentOrderId}`;
    let linkWaUntukEmail = `https://wa.me/6283898777946?text=${encodeURIComponent(teksWaUntukEmail)}`;

    // Siapkan "Paket Data" yang bakal dikirim ke EmailJS
    let dataEmail = {
        email: pendingOrderData.email,
        nama_pembeli: pendingOrderData.nama,
        order_id: currentOrderId,
        product_name: pendingOrderData.data.name,
        payment_method: pendingOrderData.payment,
        price: Math.floor(currentPrice).toLocaleString('id-ID'),
        payment_instruction: instruksiBayar,
        wa_link: linkWaUntukEmail
    };

    // Tembak ke EmailJS (Mode Siluman tanpa Alert)
    emailjs.send('service_u3w7j5c', 'template_y0bk2ls', dataEmail)
        .then(function(response) {
            console.log('SUCCESS! Invoice terkirim ke email pembeli.', response.status, response.text);
        }, function(error) {
            console.log('FAILED... EmailJS error:', error);
        });

    // 5. NOTIFIKASI KE TELEGRAM ADMIN (SISTEM URL LINK)
    let webUrl = window.location.origin + window.location.pathname; 
    
    // FORMAT PESAN TELEGRAM DIPERBARUI
    let teleText = `🚨 *ORDER BARU MASUK!* 🚨\n\nOrder ID: *${currentOrderId}*\nProduk: ${pendingOrderData.data.name}\nTotal: Rp${Math.floor(currentPrice).toLocaleString()}\nMetode: ${pendingOrderData.payment}\nNama: ${pendingOrderData.nama}\nEmail: ${pendingOrderData.email}\nWA Pembeli: [${pendingOrderData.wa}](https://wa.me/${pendingOrderData.wa})\nCatatan: *${pendingOrderData.catatan || "-"}*\n\n_Cek mutasi ya bos. Kalau udah masuk, klik tombol di bawah:_`;
    let inlineKeyboard = {
        inline_keyboard: [
            [{ text: "✅ Duit Masuk (Ubah ke Selesai)", url: `${webUrl}?adminUpdate=${currentOrderId}&status=Selesai` }],
            [{ text: "❌ Bodong (Batalkan)", url: `${webUrl}?adminUpdate=${currentOrderId}&status=Dibatalkan` }]
        ]
    };

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            chat_id: TELEGRAM_CHAT_ID, 
            text: teleText, 
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            reply_markup: inlineKeyboard 
        })
    }).catch(e => console.log("Gagal kirim tele:", e));

    // 6. TAMPILKAN INSTRUKSI & PINDAH HALAMAN
    setPaymentInstruction(pendingOrderData.payment);

    closeConfirmModal();
    hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section"); 
    hide("#productList"); hide("#productPage"); hide("#cekPesananPage");
    
    show("#paymentStatusPage"); 
    window.scrollTo(0,0); 
    hideLoader();
    listenToOrderStatus(currentOrderId);
}

window.setPaymentInstruction = function(method) {
    let qrisSec = document.getElementById("qrisSection");
    if(!qrisSec) return;
    if (method === "QRIS") {
        qrisSec.innerHTML = `<p style="color: white; margin-bottom: 10px;">Scan QRIS ini untuk membayar:</p><img src="https://i.imgur.com/eID6zIo.jpeg" style="width: 200px; border-radius: 10px; margin-bottom: 10px; background:white; padding:10px;"><br>refresh jika qris tidak muncul <p style="font-size: 12px; color: #cbd5e1;">Pastikan nominal sesuai dengan Total Bayar.</p>`;
    } else if (method === "Dana" || method === "Gopay" || method === "ShopeePay") {
        qrisSec.innerHTML = `<p style="color: white; margin-bottom: 10px;">Transfer ke nomor ${method}:</p><h2 style="color: #3b82f6;">0896-3642-9860</h2><p style="font-size: 12px; color: #cbd5e1; margin-top: 10px;">A/N: ILYAS MAULANA YUSUF</p>`;
    } else {
        qrisSec.innerHTML = `<p style="color: white; margin-bottom: 10px;">Transfer ke Rekening ${method}:</p><h2 style="color: #10b981;">901547937250</h2><p style="font-size: 12px; color: #cbd5e1; margin-top: 10px;">A/N: ILYAS MAULANA YUSUF</p>`;
    }
}

/* ==========================================
   REAL-TIME UPDATE & TOMBOL LANJUT WA
========================================== */
window.listenToOrderStatus = function(orderId) {
    const btnConfirm = document.getElementById("btnConfirmWA"); 
    
    // Hapus timer polling kalau sebelumnya udah jalan
    clearInterval(window.pollingInterval);

    // [SISTEM POLLING] Nanya ke Firebase setiap 3 detik
    window.pollingInterval = setInterval(async () => {
        try {
            const res = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${orderId}.json`);
            const data = await res.json();
            if (!data) return;

            let badge = document.getElementById("payStatusBadge");
            let qrisSec = document.getElementById("qrisSection");
            let countdownEl = document.getElementById("payCountdown");

            if(badge) badge.innerText = data.status;

            if (data.status === "Selesai") {
                clearInterval(paymentTimerInterval);
                clearInterval(window.pollingInterval); // Stop nanya ke DB kalau udah selesai
                
                if(countdownEl) { countdownEl.innerText = "Selesai"; countdownEl.style.color = "#10b981"; }
                if(btnConfirm) { btnConfirm.disabled = false; btnConfirm.innerText = "Ambil Data (Lanjut ke WA)"; btnConfirm.style.background = "#10b981"; btnConfirm.style.cursor = "pointer"; }
                if(badge) badge.style.color = "#10b981";
                if(qrisSec) qrisSec.innerHTML = `<h3 style="color: #10b981;">Pembayaran Berhasil! 🎉</h3><p style="color: #cbd5e1; margin-top: 10px; font-size: 14px;">Data pesanan sudah siap. Klik tombol di bawah untuk mengambil data lewat WA.</p>`;
                if(typeof confetti === "function") confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            } 
            else if (data.status === "Dibatalkan" || data.status.includes("Expired")) {
                clearInterval(paymentTimerInterval);
                clearInterval(window.pollingInterval); // Stop nanya ke DB kalau batal
                
                if(countdownEl) { countdownEl.innerText = "-"; countdownEl.style.color = "#ef4444"; }
                if(btnConfirm) { btnConfirm.disabled = true; btnConfirm.innerText = "Pesanan Dibatalkan"; btnConfirm.style.background = "#ef4444"; btnConfirm.style.cursor = "not-allowed"; }
                if(badge) badge.style.color = "#ef4444";
                if(qrisSec) qrisSec.innerHTML = `<h3 style="color: #ef4444;">Pembayaran Dibatalkan ❌</h3><p style="color: #cbd5e1; margin-top: 10px; font-size: 14px;">Pesanan ini telah dibatalkan atau kedaluwarsa.</p>`;
            }
            else {
                if(btnConfirm) { btnConfirm.disabled = true; btnConfirm.innerText = "Menunggu Pembayaran"; btnConfirm.style.background = "#64748b"; btnConfirm.style.cursor = "not-allowed"; }
                if(badge) badge.style.color = "#f59e0b";
            }
        } catch(err) { console.error("Error cek status:", err); }
    }, 3000); // 3000ms = Nanya tiap 3 detik
}

window.konfirmasiKeWA = function() {
    let textWA = `*ORDER REVINE VAULT*\n\nOrder ID: *${currentOrderId}*\nStatus di Web: Selesai\n\n_Halo admin, pembayaran pesanan saya sudah dikonfirmasi. Mohon data pesanannya ya!_`;
    window.open("https://wa.me/6283898777946?text=" + encodeURIComponent(textWA));
}

/* ==========================================
   TIMER & EXPIRED LOGIC
========================================== */
let paymentTimerInterval;

window.startPaymentTimer = function(duration) {
    clearInterval(paymentTimerInterval);
    let timer = duration, minutes, seconds;
    let display = document.getElementById('payCountdown');

    paymentTimerInterval = setInterval(function () {
        // Cuma hitung menit dan detik
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        // Tampilkan format MM:SS (tanpa jam)
        if (display) display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(paymentTimerInterval);
            handlePaymentExpired(); 
        }
    }, 1000);
}

window.handlePaymentExpired = async function() {
    let badge = document.getElementById("payStatusBadge");
    let contentArea = document.getElementById("paymentContentArea");
    
    if(badge) {
        badge.innerText = "Kedaluwarsa";
        badge.style.color = "#ef4444";
    }
    
    if(contentArea) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 30px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; border: 1px solid #ef4444;">
                <h3 style="color: #ef4444;">⚠️ Pembayaran Kedaluwarsa</h3>
                <p style="font-size: 13px; color: #cbd5e1; margin-top: 10px;">
                    Batas waktu pembayaran telah habis. Silakan buat pesanan baru.
                </p>
            </div>`;
    }

    if(currentOrderId) {
        // [REST API] Update status expired
        await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${currentOrderId}.json`, {
            method: "PATCH",
            body: JSON.stringify({ status: "Dibatalkan (Expired)" })
        });
    }

}

/* ==========================================
   BANNER SLIDER (INFINITE PEEK CAROUSEL)
========================================== */
let currentSlide = 1; // Mulai dari 1 karena kita nambahin clone di paling kiri
let slideInterval; 
let isTransitioning = false;

window.initSlider = function() {
    const sliderWrapper = document.getElementById("bannerSlider");
    if (!sliderWrapper) return;
    const slides = sliderWrapper.querySelectorAll("img");
    const dotsContainer = document.getElementById("bannerDots");
    const totalOriginalSlides = slides.length;

    if (totalOriginalSlides <= 1) return;

    if (!sliderWrapper.dataset.cloned) {
        // TRIK INFINITE: Copy gambar terakhir, taruh di paling depan (kiri)
        const lastClone = slides[totalOriginalSlides - 1].cloneNode(true);
        sliderWrapper.insertBefore(lastClone, slides[0]);

        // Copy sisa gambar, taruh di paling belakang (kanan)
        slides.forEach(slide => {
            sliderWrapper.appendChild(slide.cloneNode(true));
        });
        sliderWrapper.dataset.cloned = "true";

        // Pasang posisi awal ke index 1 diam-diam tanpa animasi
        setTimeout(() => updateSlider(false), 50);
    }

    if(dotsContainer) {
        dotsContainer.innerHTML = "";
        for (let i = 0; i < totalOriginalSlides; i++) {
            const dot = document.createElement("div"); dot.classList.add("dot");
            if (i === 0) dot.classList.add("active");
            dot.onclick = () => { if (isTransitioning) return; currentSlide = i + 1; updateSlider(); resetSlideInterval(); };
            dotsContainer.appendChild(dot);
        }
    }

    sliderWrapper.addEventListener('transitionend', () => {
        isTransitioning = false;
        // Kalau mentok ke kanan, teleport balik ke depan
        if (currentSlide > totalOriginalSlides) {
            currentSlide = 1; 
            updateSlider(false); 
        }
        // Kalau mentok ke kiri, teleport balik ke belakang
        if (currentSlide === 0) {
            currentSlide = totalOriginalSlides; 
            updateSlider(false); 
        }
    });
    startSlide();
}

window.updateSlider = function(withTransition = true) {
    const sliderWrapper = document.getElementById("bannerSlider"); 
    const dots = document.querySelectorAll(".slider-dots .dot");
    if (!sliderWrapper) return;

    const firstImg = sliderWrapper.querySelector("img");
    const style = window.getComputedStyle(firstImg);
    const slideWidth = firstImg.offsetWidth + parseFloat(style.marginRight);

    if (withTransition) {
        isTransitioning = true;
        sliderWrapper.style.transition = 'transform 0.5s ease-in-out';
    } else {
        sliderWrapper.style.transition = 'none';
    }
    
    // Geser container
    sliderWrapper.style.transform = `translateX(-${currentSlide * slideWidth}px)`;
    
    // Benerin indikator titik-titik di bawah
    let dotIndex = currentSlide - 1;
    if (dotIndex >= dots.length) dotIndex = 0;
    if (dotIndex < 0) dotIndex = dots.length - 1;

    dots.forEach((dot, index) => { 
        if (index === dotIndex) dot.classList.add("active"); 
        else dot.classList.remove("active"); 
    });

    if (withTransition) setTimeout(() => { isTransitioning = false; }, 600);
}

window.nextSlide = function() { 
    let bannerEl = document.querySelector(".banner");
    if (bannerEl && bannerEl.style.display === "none") return;
    if (isTransitioning) return; 
    currentSlide++; 
    updateSlider(); 
}

window.startSlide = function() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 3000); }
window.resetSlideInterval = function() { startSlide(); }

/* ==========================================
   LOAD DATA AWAL & RESTORE PAGE
========================================== */

window.loadPopular = async function() {
    let container = document.querySelector(".popular");
    if(!container) return;

    try {
        const data = await window.getProductsData();
        if(!data) return;
        let html = "";
        
        for(let id in data) { 
            let p = data[id]; 
            if(p.popular) {
                // Teks sub-kategori/developer di bawah nama produk
                let subText = p.subcategory || p.category || "Premium";
                
                // STRUKTUR HORIZONTAL CEPER: Gambar kiri, teks kanan
                html += `
                <div class="pop-row-card" onclick="openProduct('${id}')">
                    <img src="${p.logo}" alt="${p.name}" class="pop-row-img">
                    <div class="pop-row-text">
                        <h3 class="pop-row-title">${p.name}</h3>
                        <p class="pop-row-subtitle">${subText}</p>
                    </div>
                </div>`;
            }
        }
        
        if(html === "") { hide(".popular-section"); return; }
        container.innerHTML = html;
        
    } catch(err) { 
        console.error("Error Popular:", err); 
    }
}

window.loadFlashCountdown = async function() {
    try {
        // PERUBAHAN DI SINI: Kita narik data dari Cloudflare Cache, BUKAN dari Firebase
        const products = await window.getProductsData();
        if(!products) return;
        
        let endTime = null;
        for(let id in products) { 
            if(products[id].discount) { 
                endTime = new Date(products[id].discount.end); 
                break; 
            } 
        }
        if(!endTime) return;

        setInterval(() => {
            let diff = endTime - new Date();
            let el = document.getElementById("countdown");
            if(!el) return;
            if(diff <= 0) { el.innerText = "Flash sale telah berakhir"; return; }
            let d = Math.floor(diff / (1000 * 60 * 60 * 24)); let h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); let s = Math.floor((diff % (1000 * 60)) / 1000);
            el.innerText = `${d} hari ${h} jam ${m} menit ${s} detik`;
        }, 1000);
    } catch(err) { console.error(err); }
}

// Fungsi bantu buat manggil ulang data halaman payment pas di refresh
window.restorePaymentPage = async function(orderId) {
    showLoader();
    try {
        const res = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${orderId}.json`);
const orderData = await res.json();
if (orderData) {
            currentOrderId = orderId;
            
            document.getElementById("payOrderId").innerText = orderId;
            document.getElementById("payProductName").innerText = orderData.productName;
            document.getElementById("payMethodDisplay").innerText = orderData.payment;
            document.getElementById("payWANumber").innerText = orderData.waNumber;
            document.getElementById("payTotalDisplay").innerText = "Rp" + Math.floor(orderData.price).toLocaleString();
            
            setPaymentInstruction(orderData.payment);
            startPaymentTimer(600);
            
            hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section");
            hide("#productList"); hide("#productPage"); hide("#cekPesananPage");
            show("#paymentStatusPage");
            
            listenToOrderStatus(orderId);
        } else {
            localStorage.removeItem("lastView"); 
            goHome(true);
        }
    } catch(e) { console.error("Error restore:", e); goHome(true); }
    hideLoader();
}

document.addEventListener("DOMContentLoaded", async () => {
    const isCheckoutPage = window.location.pathname.includes("checkout.html");

    // === FITUR ADMIN TELEGRAM & UPDATE STOK (TETAP DIPERTAHANKAN) ===
    const urlParams = new URLSearchParams(window.location.search);
    const orderToUpdate = urlParams.get('adminUpdate');
    const newStatus = urlParams.get('status');
    
    if (orderToUpdate && newStatus) {
        try {
            // [REST API] 1. Ambil Data Order
            const orderRes = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${orderToUpdate}.json`);
            const orderData = await orderRes.json();
            
            if (orderData) {
                if (newStatus === 'Selesai' && orderData.status !== 'Selesai') {
                    
                    // [REST API] 2. Kurangi Stok & Tambah Terjual
                    const prodRes = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/products/${orderData.productId}.json`);
                    const prodData = await prodRes.json();
                    
                    if (prodData && prodData.stock > 0) {
                        await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/products/${orderData.productId}.json`, {
                            method: "PATCH",
                            body: JSON.stringify({
                                stock: prodData.stock - 1,
                                sold: (prodData.sold || 0) + 1
                            })
                        });
                    }

                    if (orderData.discountCode) {
                        const discRes = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/discountCodes/${orderData.discountCode}.json`);
                        const discData = await discRes.json();
                        if (discData) {
                            await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/discountCodes/${orderData.discountCode}.json`, {
                                method: "PATCH",
                                body: JSON.stringify({ used: (discData.used || 0) + 1 })
                            });
                        }
                    }
                    
                    // 3. --- KIRIM EMAIL BUKTI LUNAS ---
                    let teksWaLunas = `Halo Admin, saya mau ambil pesanan saya untuk Order ID: ${orderToUpdate} (Telah Lunas)`;
                    let linkWaLunas = `https://wa.me/6283898777946?text=${encodeURIComponent(teksWaLunas)}`;
                    
                    let dataEmailLunas = {
                        email: orderData.email, 
                        nama_pembeli: orderData.nama,
                        order_id: orderToUpdate,
                        product_name: orderData.productName,
                        price: Math.floor(orderData.price).toLocaleString('id-ID'),
                        wa_link: linkWaLunas
                    };
                    
                    // ⚠️ PASTE TEMPLATE ID EMAILJS LU YANG BARU DI SINI ⚠️
                    if (typeof emailjs !== 'undefined') {
                        emailjs.send('service_u3w7j5c', 'template_rj879ve', dataEmailLunas)
                            .then(function() { console.log('Email Bukti Lunas Terkirim!'); })
                            .catch(function(err) { console.log('Gagal kirim email lunas:', err); });
                    }
                }
                
                // [REST API] 4. Update Status Pesanan
                await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${orderToUpdate}.json`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: newStatus })
                });

                // Notif Pop-up buat Admin pas ngeklik tombol di Telegram
                alert(`Mantap Bos! Status Order ${orderToUpdate} berhasil diubah jadi: ${newStatus}`);
            }
        } catch(e) { 
            console.error("Admin update failed:", e); 
            alert("Gagal update status: " + e.message);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // === JIKA USER LAGI DI HALAMAN CHECKOUT ===
    if (isCheckoutPage) {
        if (window.location.hash.startsWith("#payment-")) {
            let orderId = window.location.hash.replace("#payment-", "");
            await window.restorePaymentPage(orderId);
        } else {
            const prodId = urlParams.get('id');
            if (prodId) {
                selectedProductID = prodId;
                showLoader();
                try {
                    const allProducts = await window.getProductsData();
                    let data = allProducts ? allProducts[prodId] : null;
                    if (data) {
                        document.getElementById("productName").innerText = data.name;
                        document.getElementById("productLogo").src = data.logo;
                        document.getElementById("productDesc").innerHTML = (data.description || "Tidak ada deskripsi").replace(/\\n/g, "\n").replace(/\n/g, "<br>");
                        discountPercent = 0; currentDiscountCode = "";
                        showPrice(data);
                    } else {
                        document.getElementById("productDesc").innerHTML = "Produk tidak ditemukan.";
                    }
                } catch(e) { console.error(e); }
                hideLoader();
            } else {
                window.location.href = "index.html"; 
            }
        }
    } 
    // === JIKA USER LAGI DI HALAMAN BERANDA (INDEX) ===
    else {
        if (window.location.hash.startsWith("#produk-")) {
            let id = window.location.hash.replace("#produk-", "");
            window.location.href = "checkout.html?id=" + id;
            return;
        }
        if (window.location.hash.startsWith("#payment-")) {
            window.location.href = "checkout.html" + window.location.hash;
            return;
        }

        window.initSlider();
        let loadPop = window.loadPopular();
        window.loadFlashCountdown();

        let hash = window.location.hash;
        if (hash === "#cekPesananPage" || hash === "#faqPage" || hash === "#privacyPage" || hash === "#termsPage") {
            openPage(hash.replace("#", ""));
        } else if (hash.startsWith("#kategori-")) {
            let catName = hash.replace("#kategori-", "").replace(/-/g, " ");
            await openCategory(catName);
        } else {
            await window.openCategory('semua');
        }
        await loadPop;
        hideLoader();
    }
});

/* ==========================================
   NAVBAR & BURGER MENU LOGIC
========================================== */
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobileMenu');
    const burger = document.querySelector('.burger');
    menu.classList.toggle('active');
    burger.classList.toggle('toggle');
}

/* ==========================================
   LOGIKA CEK STATUS PESANAN (MANUAL)
========================================== */
window.cariPesanan = async function() {
    let orderId = document.getElementById("searchOrderId").value.trim();
    if(!orderId) return showToast("Masukkan Order ID terlebih dahulu!", "rgb(255, 0, 0)");

    showLoader();
    try {
        const res = await fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${orderId}.json`);
const data = await res.json();
if (data) {
            
            document.getElementById("resOrderId").innerText = orderId;
            document.getElementById("resDate").innerText = data.date || "-";
            document.getElementById("resProduct").innerText = data.productName;
            document.getElementById("resMethod").innerText = data.payment;
            document.getElementById("resTotal").innerText = "Rp" + Math.floor(data.price).toLocaleString();
            
            let statusEl = document.getElementById("resStatus");
            statusEl.innerText = data.status;
            
            if(data.status.includes("Selesai")) {
                statusEl.style.background = "rgba(16, 185, 129, 0.2)";
                statusEl.style.color = "#10b981";
            } else if(data.status.includes("Batal") || data.status.includes("Expired")) {
                statusEl.style.background = "rgba(239, 68, 68, 0.2)";
                statusEl.style.color = "#ef4444";
            } else {
                statusEl.style.background = "rgba(245, 158, 11, 0.2)";
                statusEl.style.color = "#f59e0b";
            }

            show("#searchResultArea");
        } else {
            hide("#searchResultArea");
            showToast("Pesanan tidak ditemukan! Cek lagi ID-nya.", "rgb(255, 0, 0)");
        }
    } catch(e) {
        console.error(e);
        showToast("Terjadi kesalahan sistem!", "rgb(255, 0, 0)");
    } finally {
        hideLoader();
    }
}



/* ==========================================
   PELACAK PENGUNJUNG REAL-TIME & HARIAN
========================================== */
document.addEventListener("DOMContentLoaded", () => {
    let today = new Date();
    // Bikin format tanggal YYYY-MM-DD (Misal: 2026-04-13)
    let dateStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');

    // Bikin ID pengunjung (Tetep dibutuhin buat pengunjung harian)
    let visitorId = "visitor_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

    // --- 1. LIVE VISITOR (DIMATIKAN SEMENTARA BIAR GA LIMIT) ---
    // let visitorRef = window.ref(window.db, "visitors/" + visitorId);
    // window.set(visitorRef, { status: "online", masukJam: today.toLocaleTimeString() });
    // window.onDisconnect(visitorRef).remove(); 

    // --- 2. DATA PENGUNJUNG HARIAN (Riwayat per Hari) ---
    let lastVisit = localStorage.getItem("lastVisitDate");
    
    if (lastVisit !== dateStr) {
        // Kalau dia belum dihitung hari ini, masukin ke database harian
        let dailyRef = window.ref(window.db, "daily_visitors/" + dateStr + "/" + visitorId);
        window.set(dailyRef, { jamMasuk: today.toLocaleTimeString() });
        
        // Tandain di HP/Laptopnya kalau hari ini dia udah dicatat
        localStorage.setItem("lastVisitDate", dateStr);
    }
});



/* ==========================================
   INFINITE PARTICLES ENGINE
========================================== */
function initParticles() {
    const canvas = document.getElementById("particleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let particlesArray = [];
    const numberOfParticles = window.innerWidth < 768 ? 40 : 80;

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > width) this.speedX *= -1;
            if (this.y < 0 || this.y > height) this.speedY *= -1;
        }
        draw() {
            ctx.fillStyle = 'rgba(14, 165, 233, 0.7)'; // Warna biru neon
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
            
            // Bikin garis hubung antar partikel (Efek Rasi Bintang)
            for (let j = i; j < particlesArray.length; j++) {
                const dx = particlesArray[i].x - particlesArray[j].x;
                const dy = particlesArray[i].y - particlesArray[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(14, 165, 233, ${1 - distance/100})`;
                    ctx.lineWidth = 0.5;
                    ctx.moveTo(particlesArray[i].x, particlesArray[i].y);
                    ctx.lineTo(particlesArray[j].x, particlesArray[j].y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
}


/* ==========================================
   UI HANDLERS (Payment & Phone Dropdown)
========================================== */
window.toggleCountryDropdown = function() {
    document.getElementById("countryMenu").classList.toggle("show");
}

window.filterCountry = function() {
    let input = document.getElementById("searchCountry").value.toLowerCase();
    let items = document.querySelectorAll("#countryList li");
    items.forEach(item => {
        item.style.display = item.innerText.toLowerCase().includes(input) ? "block" : "none";
    });
}

window.selectCountry = function(code, element) {
    document.getElementById("selectedCountryCode").innerText = code;
    document.getElementById("countryMenu").classList.remove("show");
    document.getElementById("waInput").focus();
}

// Tutup dropdown kalau nge-klik di luar area
window.addEventListener('click', function(e) {
    if(!e.target.closest('.country-dropdown')) {
        let menu = document.getElementById("countryMenu");
        if(menu && menu.classList.contains("show")) menu.classList.remove("show");
    }
});

// Fungsi kalau klik logo payment
window.selectPayment = function(method, element) {
    document.getElementById("payMethod").value = method;
    document.querySelectorAll(".pay-card").forEach(card => card.classList.remove("active"));
    element.classList.add("active");
}



/* ==========================================
   SCROLL KATEGORI HORIZONTAL MENGALIR KE KIRI
========================================== */
window.scrollCategory = function(direction) {
    const container = document.getElementById('categoryContainer');
    // Jarak geser kartu sekali klik (sekitar 2 kartu)
    const scrollAmount = 320; 
    
    if (container) {
        container.scrollBy({
            left: direction * scrollAmount,
            behavior: 'smooth'
        });
    }
}



/* ==========================================
   ENGINE MULTI-COUNTDOWN CARD INDIVIDUAL (FIXED)
========================================== */
let cardCountdownInterval;
window.initCardCountdowns = function() {
    clearInterval(cardCountdownInterval); // Reset biar ga tabrakan bray
    
    cardCountdownInterval = setInterval(() => {
        let activeTimers = document.querySelectorAll(".p-card-countdown");
        if(activeTimers.length === 0) return;
        
        let skrg = new Date();
        activeTimers.forEach(el => {
            let targetWaktuStr = el.getAttribute("data-end");
            if(!targetWaktuStr) return;
            
            let targetWaktu = new Date(targetWaktuStr);
            let selisih = targetWaktu - skrg;
            
            if(selisih <= 0) {
                el.innerHTML = "Promo Berakhir";
                el.style.color = "#050505";
                el.style.background = "rgba(100, 116, 139, 0.1)";
                el.style.borderColor = "rgba(100, 116, 139, 0.2)";
                return;
            }
            
            let hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
            let jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let menit = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
            let detik = Math.floor((selisih % (1000 * 60)) / 1000);
            
            jam = jam < 10 ? "0" + jam : jam;
            menit = menit < 10 ? "0" + menit : menit;
            detik = detik < 10 ? "0" + detik : detik;
            
            if(hari > 0) {
                el.innerHTML = `${hari} hari ${jam}:${menit}:${detik}`;
            } else {
                el.innerHTML = `${jam}:${menit}:${detik}`;
            }
        });
    }, 1000);
}


/* ==========================================
   FAQ ACCORDION LOGIC
========================================== */
window.toggleFAQ = function(element) {
    // Fitur tambahan: Bikin accordion rapi (tutup yang lain pas satu dibuka)
    let allFaq = document.querySelectorAll('.faq-item');
    allFaq.forEach(item => {
        if (item !== element) {
            item.classList.remove('active'); // Tutup item lain
        }
    });

    // Buka/tutup item yang lagi diklik
    element.classList.toggle('active');
}


// ================= LOGIKA CHECKBOX SYARAT KETENTUAN =================
window.toggleOrderButton = function() {
    let cb = document.getElementById("agreeTerms");
    let btn = document.getElementById("btnPesanSekarang");
    if(cb.checked) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    } else {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    }
}

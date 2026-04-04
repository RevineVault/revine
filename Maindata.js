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

// TOKEN DAN CHAT ID TELEGRAM
const TELEGRAM_BOT_TOKEN = "8238778099:AAHP8FPOXM60o9L9_MRXgF7kvtNlfL4Zakw"; 
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
    t.innerText = msg;
    t.style.background = color;  
    t.classList.add("show");
    setTimeout(() => { t.classList.remove("show"); }, 2500);
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
   CARD GENERATOR
========================================== */
function createCardHTML(id, p) {
    let price = p.price || 0;
    let finalPrice = price;
    let discountHTML = "";
    let badgesHTML = "";
    let topOffset = 0;

    if(p.discount) {
        let now = new Date(); let end = new Date(p.discount.end);
        if(now < end) {
            let percent = p.discount.percent || 0;
            finalPrice = price - (price * percent / 100);
            discountHTML = `<div class="c-old-price"><s>Rp${price.toLocaleString()}</s><span class="c-disc-badge">-${percent}%</span></div>`;
            badgesHTML += `<div class="p-flash-badge" style="top: ${topOffset}px;">FLASH SALE</div>`;
            topOffset += 24;
        }
    }

    if(p.popular) badgesHTML += `<div class="p-popular-badge" style="top: ${topOffset}px;">🔥 PALING LARIS</div>`;

    let rating = p.rating || "5.0";
    let soldFormatted = formatSold(p.sold || 0);

    return `
    <div class="p-card" onclick="openProduct('${id}')">
        <div class="p-img-box">${badgesHTML}<img src="${p.logo}" alt="produk"></div>
        <div class="p-body">
            <div class="p-tags"><span class="c-tag">${(p.category || 'PRODUK').toUpperCase()}</span></div>
            <h3 class="p-title">${p.name}</h3>
            <div class="p-info">
                <span style="color: #10b981;">⚡ Proses Kilat</span><span style="color: #fbbf24;">| ★ ${rating}</span>
            </div>
            <div class="p-price-area">${discountHTML}<div class="p-final-price">Rp${Math.floor(finalPrice).toLocaleString()}</div></div>
            <div class="p-stock">Sisa stok: ${p.stock || 0}</div>
            <button class="p-btn">Beli Sekarang</button>
        </div>
    </div>`;
}

/* ==========================================
   NAVIGASI (HOME & INFO PAGES)
========================================== */
window.goHome = function(fromPopState = false) {
    if(!fromPopState) history.pushState({ view: 'home' }, "", window.location.pathname);
    localStorage.removeItem("lastView"); // Bersihin status refresh kalo lagi di beranda

    show(".banner"); show(".flashsale"); show(".best", "grid"); show(".category"); show(".popular-section");
    hide("#productList"); hide("#productPage"); hide("#faqPage"); 
    hide("#privacyPage"); hide("#termsPage"); hide("#paymentStatusPage"); hide("#cekPesananPage");
    
    window.scrollTo(0,0);
}

window.openPage = function(pageId, fromPopState = false) {
    if(!fromPopState) history.pushState({ view: 'page', id: pageId }, "", "#" + pageId);
    localStorage.setItem("lastView", JSON.stringify({ view: 'page', id: pageId })); // Simpan buat refresh

    hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section"); 
    hide("#productList"); hide("#productPage"); hide("#faqPage"); 
    hide("#privacyPage"); hide("#termsPage"); hide("#paymentStatusPage"); hide("#cekPesananPage");
    
    show("#" + pageId); 
    window.scrollTo(0,0);
}

window.toggleFAQ = function(element) {
    if (element.classList.contains("active")) element.classList.remove("active");
    else {
        document.querySelectorAll(".faq-item").forEach(faq => faq.classList.remove("active"));
        element.classList.add("active");
    }
}

/* ==========================================
   KATEGORI & PRODUK LOGIC
========================================== */
window.openCategory = async function(name, fromPopState = false) {
    if(!fromPopState) history.pushState({ view: 'category', id: name }, "", "#kategori-" + name);
    localStorage.setItem("lastView", JSON.stringify({ view: 'category', id: name })); // Simpan buat refresh

    try {
        showLoader();
        hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section"); 
        hide("#productPage"); hide("#paymentStatusPage"); hide("#cekPesananPage");
        show("#productList");

        document.getElementById("listTitle").innerText = name.toUpperCase();
        
        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) return;

        const data = snap.val();
        currentCategoryData = {}; let subCategories = new Set(); activeSubCategory = "ALL"; 

        for(let id in data) {
            let p = data[id];
            if(p.category !== name) continue;
            currentCategoryData[id] = p;
            if(p.subcategory) subCategories.add(p.subcategory);
        }

        let subBox = document.getElementById("subCategoryBox");
        if(subCategories.size > 0) {
            let subHtml = `<button class="sub-btn active" onclick="filterSub('ALL', this)">SEMUA</button>`;
            subCategories.forEach(sub => { subHtml += `<button class="sub-btn" onclick="filterSub('${sub}', this)">${sub.toUpperCase()}</button>`; });
            subBox.innerHTML = subHtml;
            subBox.style.display = "flex";
        } else { subBox.style.display = "none"; }
        renderList(); 
    } catch(err) { console.error(err); } finally { hideLoader(); }
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
}

window.openProduct = async function(id, fromPopState = false) {
    if(!fromPopState) history.pushState({ view: 'product', id: id }, "", "#produk-" + id);
    localStorage.setItem("lastView", JSON.stringify({ view: 'product', id: id })); // Simpan buat refresh

    try {
        showLoader();
        selectedProductID = id;
        
        hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section"); 
        hide("#productList"); hide("#paymentStatusPage"); hide("#cekPesananPage");
        show("#productPage");

        const snap = await window.get(window.ref(window.db, "products/" + id));
        if(!snap.exists()) return;

        let data = snap.val();
        document.getElementById("productName").innerText = data.name;
        document.getElementById("productLogo").src = data.logo;
        document.getElementById("productDesc").innerHTML = (data.description || "Tidak ada deskripsi").replace(/\\n/g, "\n").replace(/\n/g, "<br>");
        
        discountPercent = 0; currentDiscountCode = ""; document.getElementById("discountInput").value = "";
        showPrice(data); window.scrollTo(0,0);
    } catch(err) { console.error(err); } finally { hideLoader(); }
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

    currentPrice = roundedFinal; 
    if(document.getElementById("sumTotal")) document.getElementById("sumTotal").innerText = "Rp" + currentPrice.toLocaleString();
}

window.applyDiscount = async function() {
    try {
        let code = document.getElementById("discountInput").value.trim().toUpperCase();
        if(!code) return showToast("Masukkan kode diskon dulu!", "rgb(255, 0, 0)");
        const snap = await window.get(window.ref(window.db, "discountCodes/" + code));
        if(!snap.exists()) return showToast("Kode diskon tidak valid!", "rgb(255, 0, 0)");

        const data = snap.val();
        if((data.used || 0) >= (data.maxUse || 0)) return showToast("Batas pemakaian kode habis!", "rgb(255, 0, 0)");
        if(new Date(data.exp) < new Date()) return showToast("Kode diskon expired!", "rgb(255, 0, 0)");

        discountPercent = data.percent || 0;
        currentDiscountCode = code;
        showToast("Diskon " + discountPercent + "% berhasil diterapkan!", "rgb(0, 248, 12)");

        const p = await window.get(window.ref(window.db, "products/" + selectedProductID));
        if(p.exists()) showPrice(p.val());
    } catch(err) { console.error(err); showToast("Terjadi kesalahan sistem!", "rgb(255, 0, 0)"); }
}

/* ==========================================
   CHECKOUT, INVOICE & TELEGRAM
========================================== */
window.checkout = async function() {
    try {
        let wa = document.getElementById("waInput").value.trim();
        if(!wa) return showToast("Isi nomor WA terlebih dahulu!", "rgb(255, 0, 0)");

        const snap = await window.get(window.ref(window.db, "products/" + selectedProductID));
        if(!snap.exists()) return showToast("Produk tidak ditemukan!", "rgb(255, 0, 0)");

        let data = snap.val();
        if(data.stock <= 0) return showToast("Mohon maaf, stock produk habis!", "rgb(255, 0, 0)");

        let paymentMethod = document.getElementById("payMethod").value;
        pendingOrderData = { wa: wa, data: data, payment: paymentMethod };

        document.getElementById("mItem").innerText = data.name;
        document.getElementById("mProduct").innerText = (data.subcategory || data.category || "PRODUK").toUpperCase();
        document.getElementById("mPayment").innerText = paymentMethod;

        show("#confirmModal", "flex");
    } catch(err) { console.error(err); }
}

window.closeConfirmModal = function() { hide("#confirmModal"); }

window.proceedToWA = async function() {
    if(!pendingOrderData) return;
    showLoader();

    // 1. Bikin ID & Simpan ke Firebase
    currentOrderId = "RVN-" + Math.floor(10000 + Math.random() * 90000);
    
    // 2. SIMPAN ID PESANAN KE URL & MEMORI (Biar URLnya update & refresh ga hilang)
    history.pushState({ view: 'payment', id: currentOrderId }, "", "#payment-" + currentOrderId);
    localStorage.setItem("lastView", JSON.stringify({ view: 'payment', id: currentOrderId }));

    let today = new Date().toLocaleDateString('id-ID');
    await window.update(window.ref(window.db, "orders/" + currentOrderId), {
        productId: selectedProductID, 
        productName: pendingOrderData.data.name,
        price: currentPrice, 
        payment: pendingOrderData.payment,
        waNumber: pendingOrderData.wa, 
        date: today, 
        status: "Menunggu Pembayaran"
    });

    // 3. ISI DATA KE HALAMAN PEMBAYARAN
    document.getElementById("payOrderId").innerText = currentOrderId;
    document.getElementById("payTotalDisplay").innerText = "Rp" + Math.floor(currentPrice).toLocaleString();
    document.getElementById("payProductName").innerText = pendingOrderData.data.name; 
    document.getElementById("payMethodDisplay").innerText = pendingOrderData.payment; 
    document.getElementById("payWANumber").innerText = pendingOrderData.wa; 

    // 4. JALANKAN TIMER (1 Jam = 3600 detik)
    startPaymentTimer(3600); 

    // 5. NOTIFIKASI KE TELEGRAM ADMIN
    let teleText = `🚨 *ORDER BARU MASUK!* 🚨\n\nOrder ID: *${currentOrderId}*\nProduk: ${pendingOrderData.data.name}\nTotal: Rp${Math.floor(currentPrice).toLocaleString()}\nMetode: ${pendingOrderData.payment}\nWA Pembeli: [${pendingOrderData.wa}](https://wa.me/${pendingOrderData.wa})\n\n_Cek mutasi ya bos. Kalau udah masuk, klik tombol di bawah:_`;
    
    // UBAH BAGIAN INI: Pakai callback_data, bukan url!
    let inlineKeyboard = {
        inline_keyboard: [
            [{ text: "✅ Duit Masuk (Ubah ke Selesai)", callback_data: `ACC_${currentOrderId}` }],
            [{ text: "❌ Bodong (Batalkan)", callback_data: `DEC_${currentOrderId}` }]
        ]
    };

    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            chat_id: TELEGRAM_CHAT_ID, 
            text: teleText, 
            parse_mode: "Markdown",
            disable_web_page_preview: true, // <--- TAMBAHIN INI BIAR GAMBAR WA ILANG
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
        qrisSec.innerHTML = `<p style="color: white; margin-bottom: 10px;">Scan QRIS ini untuk membayar:</p><img src="https://i.imgur.com/eID6zIo.jpeg" style="width: 200px; border-radius: 10px; margin-bottom: 10px; background:white; padding:10px;"><p style="font-size: 12px; color: #cbd5e1;">Pastikan nominal sesuai dengan Total Bayar.</p>`;
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
    const orderRef = window.ref(window.db, "orders/" + orderId);
    const btnConfirm = document.getElementById("btnConfirmWA"); 

    window.onValue(orderRef, (snap) => {
        if (!snap.exists()) return;
        let data = snap.val();
        let badge = document.getElementById("payStatusBadge");
        let qrisSec = document.getElementById("qrisSection");
        let countdownEl = document.getElementById("payCountdown"); // Ambil elemen timer

        if(badge) badge.innerText = data.status;

        if (data.status === "Selesai") {
            // MATIIN TIMER PAS SUKSES
            clearInterval(paymentTimerInterval);
            if(countdownEl) { countdownEl.innerText = "Selesai"; countdownEl.style.color = "#10b981"; } // Ubah teks timer jadi Selesai & Hijau

            if(btnConfirm) { btnConfirm.disabled = false; btnConfirm.innerText = "Ambil Data (Lanjut ke WA)"; btnConfirm.style.background = "#10b981"; btnConfirm.style.cursor = "pointer"; }
            if(badge) badge.style.color = "#10b981";
            if(qrisSec) qrisSec.innerHTML = `<h3 style="color: #10b981;">Pembayaran Berhasil! 🎉</h3><p style="color: #cbd5e1; margin-top: 10px; font-size: 14px;">Data pesanan sudah siap. Klik tombol di bawah untuk mengambil data lewat WA.</p>`;
            if(typeof confetti === "function") confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } 
        else if (data.status === "Dibatalkan" || data.status.includes("Expired")) {
            // MATIIN TIMER PAS BATAL/EXPIRED
            clearInterval(paymentTimerInterval);
            if(countdownEl) { countdownEl.innerText = "-"; countdownEl.style.color = "#ef4444"; }

            if(btnConfirm) { btnConfirm.disabled = true; btnConfirm.innerText = "Pesanan Dibatalkan"; btnConfirm.style.background = "#ef4444"; btnConfirm.style.cursor = "not-allowed"; }
            if(badge) badge.style.color = "#ef4444";
            if(qrisSec) qrisSec.innerHTML = `<h3 style="color: #ef4444;">Pembayaran Dibatalkan ❌</h3><p style="color: #cbd5e1; margin-top: 10px; font-size: 14px;">Pesanan ini telah dibatalkan atau kedaluwarsa.</p>`;
        }
        else {
            if(btnConfirm) { btnConfirm.disabled = true; btnConfirm.innerText = "Menunggu Pembayaran"; btnConfirm.style.background = "#64748b"; btnConfirm.style.cursor = "not-allowed"; }
            if(badge) badge.style.color = "#f59e0b";
        }
    });
}

window.konfirmasiKeWA = function() {
    let textWA = `*ORDER REVINE VAULT*\n\nOrder ID: *${currentOrderId}*\nStatus di Web: Selesai\n\n_Halo admin, pembayaran pesanan saya sudah dikonfirmasi. Mohon data pesanannya ya!_`;
    window.open("https://wa.me/6287870963655?text=" + encodeURIComponent(textWA));
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
        await window.update(window.ref(window.db, "orders/" + currentOrderId), { status: "Dibatalkan (Expired)" });
    }
}

/* ==========================================
   BANNER SLIDER (INFINITE LOOP)
========================================== */
let currentSlide = 0; let slideInterval; let isTransitioning = false;

window.initSlider = function() {
    const sliderWrapper = document.getElementById("bannerSlider");
    if (!sliderWrapper) return;
    const slides = sliderWrapper.querySelectorAll("img");
    const dotsContainer = document.getElementById("bannerDots");
    const totalOriginalSlides = slides.length;

    if (totalOriginalSlides <= 1) return;

    // Cegah gambar ke-copy double pas refresh fungsi
    if (!sliderWrapper.dataset.cloned) {
        sliderWrapper.appendChild(slides[0].cloneNode(true));
        sliderWrapper.dataset.cloned = "true";
    }

    if(dotsContainer) {
        dotsContainer.innerHTML = "";
        for (let i = 0; i < totalOriginalSlides; i++) {
            const dot = document.createElement("div"); dot.classList.add("dot");
            if (i === 0) dot.classList.add("active");
            dot.onclick = () => { if (isTransitioning) return; currentSlide = i; updateSlider(); resetSlideInterval(); };
            dotsContainer.appendChild(dot);
        }
    }

    sliderWrapper.addEventListener('transitionend', () => {
        isTransitioning = false;
        if (currentSlide >= totalOriginalSlides) {
            sliderWrapper.style.transition = 'none'; currentSlide = 0; 
            sliderWrapper.style.transform = `translateX(0)`; void sliderWrapper.offsetWidth; 
        }
    });
    startSlide();
}

function updateSlider() {
    const sliderWrapper = document.getElementById("bannerSlider"); 
    const dots = document.querySelectorAll(".slider-dots .dot");
    if (!sliderWrapper) return;

    isTransitioning = true;
    sliderWrapper.style.transition = 'transform 0.5s ease-in-out';
    sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    let activeDotIndex = currentSlide >= dots.length ? 0 : currentSlide;
    dots.forEach((dot, index) => { 
        if (index === activeDotIndex) dot.classList.add("active"); 
        else dot.classList.remove("active"); 
    });

    // FIX UTAMA: Kalo web di-hide, buka kunci transisi paksa jaga-jaga browser nge-freeze!
    setTimeout(() => { isTransitioning = false; }, 600);
}

function nextSlide() { 
    // FIX KE-2: Kalau banner lagi sembunyi (di page lain), istirahatin dulu slidernya
    let bannerEl = document.querySelector(".banner");
    if (bannerEl && bannerEl.style.display === "none") return;

    if (isTransitioning) return; 
    currentSlide++; 
    updateSlider(); 
}

function startSlide() { clearInterval(slideInterval); slideInterval = setInterval(nextSlide, 3000); }
function resetSlideInterval() { startSlide(); }

/* ==========================================
   LOAD DATA AWAL & RESTORE PAGE
========================================== */
window.loadFlashSale = async function() {
    try {
        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) return;
        const data = snap.val(); let html = "";
        for(let id in data) {
            let p = data[id]; if(!p.discount) continue;
            if(new Date() > new Date(p.discount.end)) continue;
            html += createCardHTML(id, p);
        }
        if(html === "") { hide(".flashsale"); hide(".best"); return; }
        document.querySelector(".best").innerHTML = html;
    } catch(err) { console.error(err); }
}

window.loadPopular = async function() {
    try {
        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) return;
        const data = snap.val(); let html = "";
        for(let id in data) { let p = data[id]; if(p.popular) html += createCardHTML(id, p); }
        if(html === "") { hide(".popular-section"); return; }
        document.querySelector(".popular").innerHTML = html;
    } catch(err) { console.error(err); }
}

window.loadFlashCountdown = async function() {
    try {
        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) return;
        let endTime = null;
        for(let id in snap.val()) { if(snap.val()[id].discount) { endTime = new Date(snap.val()[id].discount.end); break; } }
        if(!endTime) return;

        setInterval(() => {
            let diff = endTime - new Date();
            let el = document.getElementById("countdown");
            if(!el) return;
            if(diff <= 0) { el.innerText = "Flash sale telah berakhir"; return; }
            let d = Math.floor(diff / (1000 * 60 * 60 * 24)); let h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)); let s = Math.floor((diff % (1000 * 60)) / 1000);
            el.innerText = `⏳ ${d} hari ${h} jam ${m} menit ${s} detik`;
        }, 1000);
    } catch(err) { console.error(err); }
}

// Fungsi bantu buat manggil ulang data halaman payment pas di refresh
window.restorePaymentPage = async function(orderId) {
    showLoader();
    try {
        const snap = await window.get(window.ref(window.db, "orders/" + orderId));
        if (snap.exists()) {
            let orderData = snap.val();
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

window.addEventListener("load", async () => {
    // 1. CEK JEJAK HALAMAN TERAKHIR BIAR GAK BALIK KE HOME KALO DI-REFRESH
    const lastViewData = localStorage.getItem("lastView");

    if (lastViewData) {
        const last = JSON.parse(lastViewData);
        if (last.view === 'category') await openCategory(last.id, true);
        else if (last.view === 'product') await openProduct(last.id, true);
        else if (last.view === 'page') openPage(last.id, true);
        else if (last.view === 'payment') await restorePaymentPage(last.id);
    }

    // 2. FITUR ADMIN TELEGRAM
    const urlParams = new URLSearchParams(window.location.search);
    const orderToUpdate = urlParams.get('adminUpdate');
    const newStatus = urlParams.get('status');

    if (orderToUpdate && newStatus) {
        try {
            await window.update(window.ref(window.db, "orders/" + orderToUpdate), { status: newStatus });
            alert(`SUKSES! Order ${orderToUpdate} berhasil diubah jadi: ${newStatus}`);
        } catch(e) { console.error("Admin update failed:", e); }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 3. LOAD DATA BERANDA BACKGROUND
    try {
        await window.loadFlashSale();
        await window.loadPopular();
        await window.loadFlashCountdown();
        window.initSlider();
    } catch(err) { console.error("Load Beranda error:", err); }
    
    setTimeout(() => hideLoader(), 800);
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
    if(!orderId) return showToast("Masukkan Order ID dulu cuy!", "rgb(255, 0, 0)");

    showLoader();
    try {
        const snap = await window.get(window.ref(window.db, "orders/" + orderId));
        if(snap.exists()) {
            let data = snap.val();
            
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

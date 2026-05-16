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
                <span style="color: #10b981;">⚡ Proses Kilat</span>| <span style="color: #fbbf24;"> ★ ${rating}</span>
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
    localStorage.setItem("lastView", JSON.stringify({ view: 'category', id: name }));

    try {
        // Tampilkan halaman list produk, sembunyikan yang lain
        hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section"); 
        hide("#productPage"); hide("#paymentStatusPage"); hide("#cekPesananPage");
        show("#productList");

        document.getElementById("listTitle").innerText = name.toUpperCase();
        
        // ---> TAMBAHAN: Munculin indikator loading di halaman kategori <---
        document.getElementById("subCategoryBox").style.display = "none"; // Sembunyiin tombol filter dulu
        document.getElementById("listItems").innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #0ea5e9; font-weight: bold; font-size: 15px;">⏳ Memuat daftar produk...</div>';

        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) {
            document.getElementById("listItems").innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #9ca3af;">Produk tidak ditemukan di kategori ini.</div>';
            return;
        }

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
        }
        
        // Panggil fungsi renderList() untuk menimpa loading dengan produk asli
        renderList(); 
        
    } catch(err) { 
        console.error(err); 
        document.getElementById("listItems").innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ef4444;">Gagal memuat produk. Silakan refresh.</div>';
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
}

window.openProduct = async function(id, fromPopState = false) {
    if(!fromPopState) history.pushState({ view: 'product', id: id }, "", "#produk-" + id);
    localStorage.setItem("lastView", JSON.stringify({ view: 'product', id: id }));

    try {
        selectedProductID = id;
        
        hide(".banner"); hide(".flashsale"); hide(".best"); hide(".category"); hide(".popular-section"); 
        hide("#productList"); hide("#paymentStatusPage"); hide("#cekPesananPage");
        show("#productPage");

        // ---> TAMBAHAN: Efek loading sementara pas buka detail produk <---
        document.getElementById("productName").innerText = "⏳ Memuat Detail...";
        document.getElementById("productName").style.display = "block";
        document.getElementById("productDesc").innerHTML = "Sedang mengambil data dari server...";
        document.getElementById("productLogo").src = "https://via.placeholder.com/110x110/1e293b/0ea5e9?text=Loading"; // Gambar placeholder sementara
        
        const snap = await window.get(window.ref(window.db, "products/" + id));
        if(!snap.exists()) {
            document.getElementById("productDesc").innerHTML = "Produk tidak ditemukan.";
            return;
        }

        let data = snap.val();
        
        // Begitu data sampai, timpa data sementara di atas
        document.getElementById("productName").innerText = data.name;
        document.getElementById("productLogo").src = data.logo;
        document.getElementById("productDesc").innerHTML = (data.description || "Tidak ada deskripsi").replace(/\\n/g, "\n").replace(/\n/g, "<br>");
        
        discountPercent = 0; currentDiscountCode = ""; document.getElementById("discountInput").value = "";
        showPrice(data); window.scrollTo(0,0);
        
    } catch(err) { 
        console.error(err); 
        document.getElementById("productDesc").innerHTML = "<span style='color:red;'>Gagal memuat detail produk. Coba lagi.</span>";
    }
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

    // --- TAMBAHAN LOGIKA BIAYA SISTEM 0.5% ---
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
        let countryCode = document.getElementById("selectedCountryCode").innerText;
        let waRaw = document.getElementById("waInput").value.trim();
        // Biar kalau user ngetik awalan "0", 0-nya otomatis dihapus (misal +62 0812 -> +62 812)

        if(waRaw.startsWith("0")) waRaw = waRaw.substring(1); 
        let wa = waRaw ? (countryCode + waRaw) : "";

        let catatan = document.getElementById("catatanInput").value.trim(); 
        if(!wa) return showToast("Isi nomor WA terlebih dahulu!", "rgb(255, 0, 0)");

        const snap = await window.get(window.ref(window.db, "products/" + selectedProductID));
        if(!snap.exists()) return showToast("Produk tidak ditemukan!", "rgb(255, 0, 0)");

        let data = snap.val();
        if(data.stock <= 0) return showToast("Mohon maaf, stock produk habis!", "rgb(255, 0, 0)");

        let paymentMethod = document.getElementById("payMethod").value;
        
        // Simpan catatan ke pending order
        pendingOrderData = { wa: wa, data: data, payment: paymentMethod, catatan: catatan };

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
    
    // 2. SIMPAN ID PESANAN KE URL & MEMORI
    history.pushState({ view: 'payment', id: currentOrderId }, "", "#payment-" + currentOrderId);
    localStorage.setItem("lastView", JSON.stringify({ view: 'payment', id: currentOrderId }));

    let today = new Date().toLocaleDateString('id-ID');
    await window.update(window.ref(window.db, "orders/" + currentOrderId), {
        productId: selectedProductID, 
        productName: pendingOrderData.data.name,
        price: currentPrice, 
        payment: pendingOrderData.payment,
        waNumber: pendingOrderData.wa, 
        catatan: pendingOrderData.catatan || "-", 
        date: today, 
        status: "Menunggu Pembayaran"
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

    // 5. NOTIFIKASI KE TELEGRAM ADMIN (SISTEM URL LINK)
    let webUrl = window.location.origin + window.location.pathname; // Otomatis nangkep domain lu (revinevault.my.id)
    
    let teleText = `🚨 *ORDER BARU MASUK!* 🚨\n\nOrder ID: *${currentOrderId}*\nProduk: ${pendingOrderData.data.name}\nTotal: Rp${Math.floor(currentPrice).toLocaleString()}\nMetode: ${pendingOrderData.payment}\nWA Pembeli: [${pendingOrderData.wa}](https://wa.me/${pendingOrderData.wa})\nCatatan: *${pendingOrderData.catatan || "-"}*\n\n_Cek mutasi ya bos. Kalau udah masuk, klik tombol di bawah:_`;
    
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
window.loadFlashSale = async function() {
    let container = document.querySelector(".best");
    
    // Pesan Error yang akan muncul kalau gagal
    const errorMsg = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
            <div style="color: #ef4444; font-weight: bold; font-size: 16px; margin-bottom: 8px;">Oops, something went wrong.</div>
            <div style="color: #cbd5e1; font-size: 13px; margin-bottom: 15px;">Gagal mengambil data Flash Sale. Please try again.</div>
            <button onclick="location.reload()" style="background: #0ea5e9; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;">Muat Ulang</button>
        </div>
    `;

    if(container) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #0ea5e9; font-weight: bold; font-size: 14px;">⏳ Loading Flash Sale...</div>';
    }

    try {
        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) { 
            if(container) container.innerHTML = errorMsg; 
            return; 
        }
        
        const data = snap.val(); let html = "";
        for(let id in data) {
            let p = data[id]; if(!p.discount) continue;
            if(new Date() > new Date(p.discount.end)) continue;
            html += createCardHTML(id, p);
        }
        
        if(html === "") { hide(".flashsale"); hide(".best"); return; }
        
        if(container) container.innerHTML = html;
        
    } catch(err) { 
        console.error("Error Flash Sale:", err); 
        if(container) container.innerHTML = errorMsg;
    }
}

window.loadPopular = async function() {
    let container = document.querySelector(".popular");
    
    // Pesan Error yang akan muncul kalau gagal
    const errorMsg = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 30px; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
            <div style="color: #ef4444; font-weight: bold; font-size: 16px; margin-bottom: 8px;">Oops, something went wrong.</div>
            <div style="color: #cbd5e1; font-size: 13px; margin-bottom: 15px;">Gagal mengambil data Produk Populer. Please try again.</div>
            <button onclick="location.reload()" style="background: #0ea5e9; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s;">Muat Ulang</button>
        </div>
    `;

    if(container) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: #0ea5e9; font-weight: bold; font-size: 14px;">⏳ Loading Produk Populer...</div>';
    }

    try {
        const snap = await window.get(window.ref(window.db, "products"));
        if(!snap.exists()) { 
            if(container) container.innerHTML = errorMsg;
            return; 
        }
        
        const data = snap.val(); let html = "";
        for(let id in data) { let p = data[id]; if(p.popular) html += createCardHTML(id, p); }
        
        if(html === "") { hide(".popular-section"); return; }
        
        if(container) container.innerHTML = html;
        
    } catch(err) { 
        console.error("Error Popular:", err); 
        if(container) container.innerHTML = errorMsg;
    }
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
            el.innerText = `${d} hari ${h} jam ${m} menit ${s} detik`;
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
    // 1. CEK JEJAK HALAMAN TERAKHIR
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
        } catch(e) { console.error("Admin update failed:", e); }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 3. LOAD DATA BERANDA
    try {
        await window.loadFlashSale();
        await window.loadPopular();
        await window.loadFlashCountdown();
        window.initSlider();
    } catch(err) { console.error("Load Beranda error:", err); }
    
    // --- TAMBAHAN BARU DI SINI ---
    
    // Jalankan Partikel Rasi Bintang
    if (typeof initParticles === "function") initParticles();

    // Matikan Loader bawaan
    hideLoader();
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



/* ==========================================
   PELACAK PENGUNJUNG REAL-TIME & HARIAN
========================================== */
window.addEventListener("load", () => {
    let today = new Date();
    // Bikin format tanggal YYYY-MM-DD (Misal: 2026-04-13)
    let dateStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + "-" + String(today.getDate()).padStart(2, '0');

    // --- 1. LIVE VISITOR (Yang Sedang Aktif di Web Sekarang) ---
    let visitorId = "visitor_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    let visitorRef = window.ref(window.db, "visitors/" + visitorId);

    window.set(visitorRef, { 
        status: "online", 
        masukJam: today.toLocaleTimeString() 
    });
    window.onDisconnect(visitorRef).remove(); // Otomatis hapus pas tab ditutup

    // --- 2. DATA PENGUNJUNG HARIAN (Riwayat per Hari) ---
    // Pakai localStorage biar kalau dia refresh web, gak dihitung dobel di hari yang sama
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

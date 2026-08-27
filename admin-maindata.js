/* ==========================================
   ADMIN PANEL - REVINE VAULT v3.5 (ULTIMATE)
   Core Logic: Firebase, Charts, CRM, Finance Sync
========================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, get, set, update, remove, onValue, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Konfigurasi Firebase Lu
const firebaseConfig = {
    apiKey: "AIzaSyDLtf1Eu4OAaSOkIHdwKcpHZXQHDLudNLc",
    authDomain: "stockrv-fce01.firebaseapp.com",
    databaseURL: "https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "stockrv-fce01",
    storageBucket: "stockrv-fce01.firebasestorage.app",
    messagingSenderId: "691857344063",
    appId: "1:691857344063:web:2849f7f74456b00634da8a",
    measurementId: "G-GN2L7EWHTZ"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

window.db = db; window.ref = ref; window.set = set; window.update = update; window.remove = remove;

// Global State
let allProducts = {};
let allOrders = {};
let allCashFlow = {};
let allVisitors = {};
let currentUserEmail = "";

// Chart Instances
let financeChartInstance = null;
let salesChartInstance = null;
let visitorChartInstance = null;

/* ==========================================
   1. AUTHENTICATION & SPY LOG
========================================== */
window.onload = function() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserEmail = user.email;
            document.getElementById("loginScreen").style.display = "none";
            document.getElementById("dashboard").style.display = "block";
            setDefaultDates(); 
            initAllData(); 
        } else {
            document.getElementById("loginScreen").style.display = "flex";
            document.getElementById("dashboard").style.display = "none";
        }
    });
};

window.loginAdmin = function() {
    let email = document.getElementById("adminEmail").value;
    let pass = document.getElementById("adminPassword").value;
    if(!email || !pass) return alert("Email & Password wajib diisi cuy!");
    
    signInWithEmailAndPassword(auth, email, pass)
        .then(() => console.log("Login Admin Sukses"))
        .catch((error) => alert("❌ Login Gagal: Cek lagi email/password lu."));
}

window.logoutAdmin = function() {
    if(confirm("Yakin mau keluar dari panel?")) signOut(auth).then(() => location.reload());
}

async function logAdminAction(actionText) {
    if(!currentUserEmail) return;
    await push(ref(db, "admin_logs"), { email: currentUserEmail, action: actionText, timestamp: Date.now() });
}

/* ==========================================
   2. INITIALIZE ALL DATA STREAM 
========================================== */
function initAllData() {
    onValue(ref(db, "products"), (snap) => { allProducts = snap.exists() ? snap.val() : {}; renderProdukTable(); });
    onValue(ref(db, "discountCodes"), (snap) => { let vouchers = snap.exists() ? snap.val() : {}; renderVoucherTable(vouchers); });
    
    // Tarik Pesanan (Triggers CRM & Finance)
    onValue(ref(db, "orders"), (snap) => { 
        allOrders = snap.exists() ? snap.val() : {}; 
        renderCustomerCRM(); 
        window.filterKeuangan(); 
    });
    
    onValue(ref(db, "cash_flow"), (snap) => { allCashFlow = snap.exists() ? snap.val() : {}; window.filterKeuangan(); });
    onValue(ref(db, "daily_visitors"), (snap) => { allVisitors = snap.exists() ? snap.val() : {}; window.filterStatistik(); });
    onValue(ref(db, "admin_logs"), (snap) => { let logs = snap.exists() ? snap.val() : {}; renderAdminLogs(logs); });
    
    onValue(ref(db, "settings/web"), (snap) => {
        if(snap.exists()) {
            let s = snap.val();
            if(document.getElementById("settingWebName")) document.getElementById("settingWebName").value = s.name || "";
            if(document.getElementById("settingWA")) document.getElementById("settingWA").value = s.wa || "";
            if(document.getElementById("settingEmail")) document.getElementById("settingEmail").value = s.email || "";
            if(document.getElementById("settingSeoTitle")) document.getElementById("settingSeoTitle").value = s.seoTitle || "";
            if(document.getElementById("settingSeoKeywords")) document.getElementById("settingSeoKeywords").value = s.seoKeywords || "";
            if(document.getElementById("settingSeoDesc")) document.getElementById("settingSeoDesc").value = s.seoDesc || "";
            if(document.getElementById("settingLogoUrl")) document.getElementById("settingLogoUrl").value = s.logoUrl || "";
            if(document.getElementById("settingFaviconUrl")) document.getElementById("settingFaviconUrl").value = s.faviconUrl || "";
            if(document.getElementById("settingBannerUrls")) document.getElementById("settingBannerUrls").value = s.bannerUrls || "";
            if(document.getElementById("settingMarquee")) document.getElementById("settingMarquee").value = s.marquee || "";
            if(document.getElementById("settingTerms")) document.getElementById("settingTerms").value = s.terms || "";
            if(document.getElementById("settingFAQ")) document.getElementById("settingFAQ").value = s.faq || "";
            if(document.getElementById("settingIg")) document.getElementById("settingIg").value = s.ig || "";
            if(document.getElementById("settingTiktok")) document.getElementById("settingTiktok").value = s.tiktok || "";
            if(document.getElementById("settingYt")) document.getElementById("settingYt").value = s.yt || "";
            if(document.getElementById("settingMaintenance")) document.getElementById("settingMaintenance").value = s.maintenance ? "true" : "false";
        }
    });
}

function setDefaultDates() {
    let now = new Date();
    let past = new Date(); past.setDate(now.getDate() - 30); 
    let fDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    document.getElementById("financeFilterStart").value = fDate(past);
    document.getElementById("financeFilterEnd").value = fDate(now);
    document.getElementById("statsFilterStart").value = fDate(past);
    document.getElementById("statsFilterEnd").value = fDate(now);
}

/* ==========================================
   3. PRODUK & VOUCHER CRUD
========================================== */
function renderProdukTable() {
    let html = "";
    for (let id in allProducts) {
        let p = allProducts[id];
        let pop = (p.popular === "true" || p.popular === true) ? '🔥' : '-';
        html += `<tr>
            <td><img src="${p.logo}" style="width:40px; border-radius:8px;"></td>
            <td><b>${p.name}</b><br><small style="color:#9ca3af">${p.category}</small></td>
            <td>Rp${Math.floor(p.price).toLocaleString('id-ID')}</td>
            <td>${p.stock}</td><td>${pop}</td>
            <td>
                <button class="action-btn edit-btn" onclick="window.editProduct('${id}')">Edit</button>
                <button class="action-btn delete-btn" onclick="window.deleteProduct('${id}', '${p.name.replace(/'/g, "\\'")}')">Hapus</button>
            </td>
        </tr>`;
    }
    document.getElementById("tableBodyProd").innerHTML = html || `<tr><td colspan="6" style="text-align:center;">Belum ada produk.</td></tr>`;
}

window.saveProduct = async function() {
    let id = document.getElementById("prodId").value;
    let name = document.getElementById("prodName").value;
    let discData = null;
    let dLabel = document.getElementById("prodDiscLabel").value;
    let dPercent = document.getElementById("prodDiscPercent").value;
    let dType = document.getElementById("prodDiscType").value;
    let dEnd = document.getElementById("prodDiscEnd").value;
    
    if(dLabel && dPercent) {
        if(dType === "permanent") discData = { label: dLabel, percent: parseFloat(dPercent), isPermanent: true };
        else if (dEnd) discData = { end: dEnd, label: dLabel, percent: parseFloat(dPercent), isPermanent: false };
    }

    let payload = {
        name: name, category: document.getElementById("prodCat").value, subcategory: document.getElementById("prodSubcat").value,
        price: parseInt(document.getElementById("prodPrice").value), stock: parseInt(document.getElementById("prodStock").value),
        logo: document.getElementById("prodLogo").value, description: document.getElementById("prodDesc").value,
        rating: document.getElementById("prodRating").value, sold: parseInt(document.getElementById("prodSold").value),
        popular: document.getElementById("prodPopular").value === "true", discount: discData,
        badgeText: document.getElementById("prodBadgeText").value || "PROSES CEPAT",
        badgeIcon: document.getElementById("prodBadgeIcon").value || "cepat"
    };

    try {
        if(id) { await update(ref(db, "products/" + id), payload); logAdminAction(`Edit Produk: ${name}`); alert("✅ Update Sukses!"); } 
        else { id = "prod_" + Date.now(); await set(ref(db, "products/" + id), payload); logAdminAction(`Tambah Produk: ${name}`); alert("✅ Produk Ditambah!"); }
        window.resetProdForm();
    } catch(e) { alert("Error: " + e.message); }
}

window.editProduct = function(id) {
    let p = allProducts[id]; if(!p) return;
    document.getElementById("prodId").value = id; document.getElementById("prodName").value = p.name;
    document.getElementById("prodCat").value = p.category; document.getElementById("prodSubcat").value = p.subcategory || "";
    document.getElementById("prodPrice").value = p.price; document.getElementById("prodStock").value = p.stock;
    document.getElementById("prodLogo").value = p.logo; document.getElementById("prodDesc").value = p.description || "";
    document.getElementById("prodRating").value = p.rating || "5.0"; document.getElementById("prodSold").value = p.sold || 0;
    document.getElementById("prodPopular").value = p.popular.toString();
    document.getElementById("prodBadgeText").value = p.badgeText || "PROSES CEPAT";
    document.getElementById("prodBadgeIcon").value = p.badgeIcon || "cepat";
    
    if(p.discount) {
        document.getElementById("prodDiscLabel").value = p.discount.label || ""; document.getElementById("prodDiscPercent").value = p.discount.percent || "";
        if(p.discount.isPermanent) { document.getElementById("prodDiscType").value = "permanent"; document.getElementById("prodDiscEnd").value = ""; } 
        else { document.getElementById("prodDiscType").value = "time"; document.getElementById("prodDiscEnd").value = p.discount.end || ""; }
    } else {
        document.getElementById("prodDiscLabel").value = ""; document.getElementById("prodDiscPercent").value = ""; document.getElementById("prodDiscEnd").value = "";
    }
    document.getElementById("formTitleProd").innerText = "📝 Mengedit: " + p.name; document.getElementById("cancelEditProd").style.display = "block"; window.scrollTo(0,0);
}

window.resetProdForm = function() {
    document.getElementById("prodId").value = ""; document.querySelectorAll("#tab-produk input, #tab-produk textarea").forEach(i => i.value = "");
    document.getElementById("prodBadgeIcon").value = "cepat";
    document.getElementById("formTitleProd").innerText = "Tambah / Edit Produk"; document.getElementById("cancelEditProd").style.display = "none";
}

window.deleteProduct = async function(id, name) {
    if(confirm(`Yakin hapus produk ${name}?`)) { await remove(ref(db, "products/" + id)); logAdminAction(`Hapus Produk: ${name}`); }
}

function renderVoucherTable(vouchers) {
    let html = "";
    for(let code in vouchers){
        let d = vouchers[code];
        html += `<tr><td><b>${code}</b></td><td>${d.percent}%</td><td>${d.used || 0} / ${d.maxUse}</td><td>${d.exp}</td>
        <td><button class="action-btn delete-btn" onclick="window.deleteDiscount('${code}')">Hapus</button></td></tr>`;
    }
    document.getElementById("tableBodyDisc").innerHTML = html || `<tr><td colspan="5" style="text-align:center;">Belum ada voucher.</td></tr>`;
}

window.saveDiscount = async function() {
    let code = document.getElementById("discCode").value.toUpperCase().trim();
    if(!code) return alert("Isi kode voucher!");
    let payload = { percent: parseFloat(document.getElementById("discPercent").value), maxUse: parseInt(document.getElementById("discMax").value), exp: document.getElementById("discExp").value, used: 0 };
    await set(ref(db, "discountCodes/" + code), payload);
    logAdminAction(`Buat Voucher: ${code}`); alert("✅ Voucher Disimpan!"); document.querySelectorAll("#tab-diskon input").forEach(i => i.value = "");
}

window.deleteDiscount = async function(code) {
    if(confirm("Hapus voucher?")) { await remove(ref(db, "discountCodes/" + code)); logAdminAction(`Hapus Voucher: ${code}`); }
}

/* ==========================================
   4. KEUANGAN & CASH FLOW SYNC (FIXED DATA LAMA)
========================================== */
window.filterKeuangan = function() {
    let start = new Date(document.getElementById("financeFilterStart").value); start.setHours(0,0,0,0);
    let end = new Date(document.getElementById("financeFilterEnd").value); end.setHours(23,59,59,999);
    
    let chartData = {}; 
    let salesData = {}; 
    let totalIn = 0, totalOut = 0;
    let listRiwayat = [];

    let fDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

    // A. BACA DATA PESANAN (SUPPORTS LAMA & BARU)
    for(let id in allOrders) {
        let order = allOrders[id];
        
        if(order.status === "Selesai") {
            let t = null;
            
            // LOGIKA PARSER: Tangkap data baru (timestamp) ATAU data lama (date: DD/MM/YYYY)
            if(order.timestamp) {
                t = new Date(order.timestamp);
            } else if(order.date) {
                let parts = order.date.split('/'); // Pecah DD/MM/YYYY
                if(parts.length === 3) {
                    t = new Date(parts[2], parts[1] - 1, parts[0]); // Tahun, Bulan (0-11), Tanggal
                }
            }

            // Kalau tanggal ketangkep dan masuk filter
            if(t && t >= start && t <= end) {
                let dKey = fDate(t);
                if(!chartData[dKey]) chartData[dKey] = { in: 0, out: 0 };
                
                let p = parseInt(order.price) || 0;
                chartData[dKey].in += p;
                totalIn += p;
                
                let prodName = order.productName || "Unknown Product";
                if(order.isCart && order.cartItems) {
                    order.cartItems.forEach(item => { salesData[item.name] = (salesData[item.name] || 0) + (item.qty || 1); });
                } else {
                    salesData[prodName] = (salesData[prodName] || 0) + 1;
                }
                
                listRiwayat.push({ time: t, type: "Penjualan (Selesai)", desc: `Order ID: ${id} (${prodName})`, amount: p, isOut: false, action: "-" });
            }
        }
    }

    // B. CASH FLOW MANUAL
    for(let id in allCashFlow) {
        let flow = allCashFlow[id];
        if(flow.timestamp) {
            let t = new Date(flow.timestamp);
            if(t >= start && t <= end) {
                let dKey = fDate(t);
                if(!chartData[dKey]) chartData[dKey] = { in: 0, out: 0 };
                
                let p = parseInt(flow.amount) || 0;
                if(flow.type === "income") {
                    chartData[dKey].in += p; totalIn += p;
                    listRiwayat.push({ time: t, id: id, type: "Kas Masuk (Manual)", desc: flow.desc, amount: p, isOut: false, action: `<button class="action-btn delete-btn" onclick="window.deleteCashFlow('${id}')">X</button>` });
                } else {
                    chartData[dKey].out += p; totalOut += p;
                    let tName = flow.type === "refund" ? "Refund (-)" : "Biaya (-)";
                    listRiwayat.push({ time: t, id: id, type: tName, desc: flow.desc, amount: p, isOut: true, action: `<button class="action-btn delete-btn" onclick="window.deleteCashFlow('${id}')">X</button>` });
                }
            }
        }
    }

    // C. UPDATE UI ANGKA
    document.getElementById("financeTotalIn").innerText = "Rp " + totalIn.toLocaleString('id-ID');
    document.getElementById("financeTotalOut").innerText = "Rp " + totalOut.toLocaleString('id-ID');
    document.getElementById("financeNet").innerText = "Rp " + (totalIn - totalOut).toLocaleString('id-ID');

    // D. UPDATE TABEL
    listRiwayat.sort((a,b) => b.time - a.time); 
    let htmlTable = "";
    listRiwayat.forEach(item => {
        let dateStr = `${String(item.time.getDate()).padStart(2,'0')}/${String(item.time.getMonth()+1).padStart(2,'0')}/${item.time.getFullYear()}`;
        let color = item.isOut ? "#ef4444" : "#10b981";
        htmlTable += `<tr><td>${dateStr}</td><td style="color:${color};">${item.type}</td><td>${item.desc.substring(0, 40)}</td><td style="color:${color}; font-weight:bold;">Rp${item.amount.toLocaleString('id-ID')}</td><td>${item.action}</td></tr>`;
    });
    document.getElementById("tableBodyKeuangan").innerHTML = htmlTable || `<tr><td colspan="5" style="text-align:center;">Tidak ada riwayat.</td></tr>`;

    // E. RENDER GRAFIK
    renderFinanceChart(chartData);
    renderSalesChart(salesData);
}

function renderFinanceChart(dataObj) {
    let ctx = document.getElementById('financeChart');
    if(!ctx) return;
    
    let labels = Object.keys(dataObj).sort();
    let dataIn = labels.map(l => dataObj[l].in);
    let dataOut = labels.map(l => dataObj[l].out);
    let displayLabels = labels.map(l => l.substring(5)); 

    if(financeChartInstance) financeChartInstance.destroy();
    financeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: displayLabels,
            datasets: [
                { label: 'Kas Masuk', data: dataIn, backgroundColor: '#10b981', borderRadius: 4 },
                { label: 'Kas Keluar', data: dataOut, backgroundColor: '#ef4444', borderRadius: 4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: 'white' } } } }
    });
}

function renderSalesChart(salesData) {
    let ctx = document.getElementById('salesChart');
    if(!ctx) return;

    let sortedProducts = Object.entries(salesData).sort((a,b) => b[1] - a[1]).slice(0, 5);
    let labels = sortedProducts.map(p => p[0].substring(0, 15) + '..');
    let dataQty = sortedProducts.map(p => p[1]);

    if(salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Item Terjual', data: dataQty, backgroundColor: '#0ea5e9', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: 'white' } } } }
    });
}

window.addManualCashFlow = async function() {
    let type = document.getElementById("cashType").value;
    let amount = parseInt(document.getElementById("cashAmount").value);
    let desc = document.getElementById("cashDesc").value;
    
    if(!amount || !desc) return alert("Nominal dan Keterangan wajib isi cuy!");
    await push(ref(db, "cash_flow"), { type: type, amount: amount, desc: desc, timestamp: Date.now() });
    logAdminAction(`Input Cash Flow: Rp${amount} (${desc})`);
    alert("✅ Catatan Keuangan Tersimpan!");
    document.getElementById("cashAmount").value = ""; document.getElementById("cashDesc").value = "";
}

window.deleteCashFlow = async function(id) {
    if(confirm("Hapus catatan manual ini?")) { await remove(ref(db, "cash_flow/" + id)); logAdminAction(`Hapus catatan keuangan manual`); }
}

window.exportFinanceToCSV = function() {
    let csv = "Waktu,Tipe,Keterangan,Nominal\n";
    let rows = document.querySelectorAll("#tableBodyKeuangan tr");
    rows.forEach(r => {
        let cols = r.querySelectorAll("td");
        if(cols.length >= 4) {
            let t = cols[0].innerText, tp = cols[1].innerText, d = cols[2].innerText, n = cols[3].innerText.replace(/[^0-9-]/g, "");
            csv += `"${t}","${tp}","${d}","${n}"\n`;
        }
    });
    let a = document.createElement("a"); a.href = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "Laporan_Keuangan_Revine.csv"; a.click();
}

/* ==========================================
   5. STATISTIK PENGUNJUNG WEB (CHART)
========================================== */
window.filterStatistik = function() {
    let startStr = document.getElementById("statsFilterStart").value;
    let endStr = document.getElementById("statsFilterEnd").value;
    
    let labels = []; let dataCount = [];
    let htmlTable = "";
    
    let sortedDates = Object.keys(allVisitors).sort();
    
    sortedDates.forEach(dateStr => {
        if(dateStr >= startStr && dateStr <= endStr) {
            let visitors = allVisitors[dateStr];
            let count = Object.keys(visitors).length;
            
            labels.push(dateStr.substring(5)); 
            dataCount.push(count);
            
            let hourMap = {};
            for(let vId in visitors) {
                let time = visitors[vId].jamMasuk || visitors[vId].masukJam; 
                if(time) { let hour = time.split(":")[0]; hourMap[hour] = (hourMap[hour] || 0) + 1; }
            }
            let peakHour = Object.keys(hourMap).length ? Object.keys(hourMap).reduce((a, b) => hourMap[a] > hourMap[b] ? a : b) + ":00" : "Tidak diketahui";
            
            htmlTable = `<tr><td><b>${dateStr}</b></td><td style="color:#10b981; font-weight:bold;">${count} User</td><td>${peakHour} WIB</td></tr>` + htmlTable; 
        }
    });

    document.getElementById("tableBodyStats").innerHTML = htmlTable || `<tr><td colspan="3" style="text-align:center;">Belum ada data direntang ini.</td></tr>`;

    let ctx = document.getElementById('visitorChart');
    if(!ctx) return;
    if(visitorChartInstance) visitorChartInstance.destroy();
    visitorChartInstance = new Chart(ctx, {
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Total Pengunjung', data: dataCount, borderColor: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderWidth: 2, fill: true, tension: 0.3, pointBackgroundColor: '#0ea5e9' }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' } }, x: { grid: { display: false } } }, plugins: { legend: { labels: { color: 'white' } } } }
    });
}

window.exportStatsToCSV = function() {
    let csv = "Tanggal,Total Pengunjung,Peak Hour\n";
    let rows = document.querySelectorAll("#tableBodyStats tr");
    rows.forEach(r => {
        let cols = r.querySelectorAll("td");
        if(cols.length >= 3) csv += `"${cols[0].innerText}","${cols[1].innerText.replace(' User', '')}","${cols[2].innerText}"\n`;
    });
    let a = document.createElement("a"); a.href = window.URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "Statistik_Pengunjung.csv"; a.click();
}

/* ==========================================
   6. CUSTOMER CRM SULTAN (FIXED TANGGAL LAMA)
========================================== */
window.customerListRaw = []; 

function renderCustomerCRM() {
    let custMap = {};
    for(let id in allOrders) {
        let o = allOrders[id];
        if(o.status === "Selesai") {
            let identifier = o.waNumber || o.email || "Pelanggan Offline";
            if(!custMap[identifier]) {
                custMap[identifier] = { name: o.nama || "Tanpa Nama", id: identifier, totalSpent: 0, lastOrder: o.date || "-" };
            }
            custMap[identifier].totalSpent += (parseInt(o.price) || 0);
            
            // Perbaikan update nama dari data terbaru (support format lama)
            let currentTs = o.timestamp ? o.timestamp : (o.date ? new Date(o.date.split('/').reverse().join('-')).getTime() : 0);
            if(!custMap[identifier].latestTs || currentTs > custMap[identifier].latestTs) {
                custMap[identifier].latestTs = currentTs;
                custMap[identifier].lastOrder = o.date || "-";
                custMap[identifier].name = o.nama || custMap[identifier].name; 
            }
        }
    }
    window.customerListRaw = Object.values(custMap).sort((a,b) => b.totalSpent - a.totalSpent);
    window.searchCustomerLogic();
}

window.searchCustomerLogic = function() {
    let input = (document.getElementById("searchCustomer")?.value || "").toLowerCase();
    let html = "";
    
    window.customerListRaw.forEach(c => {
        if(!input || c.name.toLowerCase().includes(input) || c.id.toLowerCase().includes(input)) {
            let sultanIcon = c.totalSpent >= 500000 ? '👑 Sultan' : ''; 
            html += `<tr>
                <td><b>${c.name}</b> <span style="font-size:12px; color:#f59e0b;">${sultanIcon}</span></td>
                <td><span style="color:#9ca3af; font-size: 13px;">${c.id}</span></td>
                <td style="color:#10b981; font-weight:bold;">Rp ${Math.floor(c.totalSpent).toLocaleString('id-ID')}</td>
                <td>${c.lastOrder}</td>
            </tr>`;
        }
    });
    document.getElementById("tableBodyCustomer").innerHTML = html || `<tr><td colspan="4" style="text-align:center;">Tidak ada pelanggan ditemukan.</td></tr>`;
}

/* ==========================================
   7. ADMIN LOG (AUDIT TRAIL)
========================================== */
function renderAdminLogs(logs) {
    let html = "";
    let logArr = Object.values(logs).sort((a,b) => b.timestamp - a.timestamp).slice(0, 100); 
    
    logArr.forEach(l => {
        let t = new Date(l.timestamp);
        let dateStr = `${t.getDate()}/${t.getMonth()+1}/${t.getFullYear()} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
        html += `<tr><td style="color:#9ca3af;">${dateStr}</td><td style="color:#3b82f6;">${l.email}</td><td>${l.action}</td></tr>`;
    });
    document.getElementById("tableBodyAdminLog").innerHTML = html || `<tr><td colspan="3" style="text-align:center;">Log bersih.</td></tr>`;
}

/* ==========================================
   8. PENGATURAN WEB (CMS FULL ACCESS)
========================================== */
window.saveWebSettingsFull = async function() {
    let payload = {
        name: document.getElementById("settingWebName").value,
        wa: document.getElementById("settingWA").value,
        email: document.getElementById("settingEmail").value,
        
        seoTitle: document.getElementById("settingSeoTitle").value,
        seoKeywords: document.getElementById("settingSeoKeywords").value,
        seoDesc: document.getElementById("settingSeoDesc").value,
        
        logoUrl: document.getElementById("settingLogoUrl").value,
        faviconUrl: document.getElementById("settingFaviconUrl").value,
        bannerUrls: document.getElementById("settingBannerUrls").value,
        marquee: document.getElementById("settingMarquee").value,
        
        terms: document.getElementById("settingTerms").value,
        faq: document.getElementById("settingFAQ").value,
        
        ig: document.getElementById("settingIg").value,
        tiktok: document.getElementById("settingTiktok").value,
        yt: document.getElementById("settingYt").value,
        
        maintenance: document.getElementById("settingMaintenance").value === "true"
    };
    
    try {
        await set(ref(db, "settings/web"), payload);
        logAdminAction("Update Semua Konfigurasi Web");
        alert("✅ Semua Pengaturan Web Berhasil Disimpan!");
    } catch(e) { alert("Gagal nyimpen pengaturan: " + e.message); }
}
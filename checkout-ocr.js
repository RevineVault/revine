/* ==========================================
   SMART VERIFICATION - REVINE VAULT
   Sistem Pembaca Struk Menggunakan Tesseract.js (AUTO-SELESAI)
========================================== */

document.addEventListener("DOMContentLoaded", () => {
    const btnPilihStruk = document.getElementById("btnPilihStruk");
    const strukInput = document.getElementById("strukInput");
    const ocrStatus = document.getElementById("ocrStatus");
    const btnConfirmWA = document.getElementById("btnConfirmWA");
    const payTotalDisplay = document.getElementById("payTotalDisplay");
    
    if(!btnPilihStruk || !strukInput) return; 

    btnPilihStruk.addEventListener("click", () => {
        strukInput.click();
    });

    strukInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;

        ocrStatus.style.display = "block";
        ocrStatus.style.color = "#f59e0b";
        ocrStatus.innerText = "[ PROCESSING ] Sedang memindai dan memverifikasi bukti transfer...";

        window.setTransactionProgress(3); // <--- TAMBAH BARIS INI BIAR ICON "SEDANG PROSES" NYALA
        
        btnPilihStruk.disabled = true;
        btnPilihStruk.style.opacity = "0.5";
        btnPilihStruk.innerHTML = "Memindai...";
        
        let rawTotal = payTotalDisplay.innerText.replace(/[^0-9]/g, ""); 
        let targetRegexStr = rawTotal.split('').join('[\\s.,]*');
        let targetRegex = new RegExp(targetRegexStr);

        Tesseract.recognize(
            file,
            'eng', 
            { logger: m => console.log(m) } 
        ).then(({ data: { text } }) => {
            console.log("=== HASIL SCAN STRUK ===");
            console.log(text);
            
            // Lapor ke Maindata.js kalau kita udah ngambil alih layarnya
            window.isOcrDone = true; 
            let activeOrderId = document.getElementById("payOrderId").innerText;

            if (targetRegex.test(text)) {
                // === JIKA MATCH (SUKSES) ===
                
                // 1. Dorong progress bar ke selesai
                if (typeof window.setTransactionProgress === "function") {
                    window.setTransactionProgress(4);
                }
                
                // 2. Ubah teks kuning jadi hijau
                let textStatus = document.getElementById("payStatusBadge"); 
                if (textStatus) {
                    textStatus.innerText = "Selesai";
                    textStatus.style.color = "#4ade80";
                }

                // 3. Tangkap UI (Ini nih biang keroknya kemaren kehapus!)
                let uiMenunggu = document.getElementById("uiMenungguPembayaran");
                let uiSukses = document.getElementById("uiPembayaranSukses");
                
                // 4. Sembunyiin UI lama, Munculin UI Sukses
                if(uiMenunggu) uiMenunggu.style.display = "none";
                if(uiSukses) uiSukses.style.display = "block";
                
                // 5. Jedag-jedug konfeti
                if(typeof confetti === "function") confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                
                // 6. Tembak jadi Selesai ke Cloudflare Worker (Lebih Aman 🛡️)
                if(activeOrderId && activeOrderId !== "-") {
                    fetch(`https://api.revine-network.workers.dev/verify-ocr`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ orderId: activeOrderId })
                    });
                }
                
            }
            
            
                else {
                // === JIKA GAGAL BACA ATAU BEDA ===
                ocrStatus.style.color = "#ef4444"; 
                ocrStatus.innerText = "[ WARNING ] Nominal tidak terdeteksi akurat.";
                
                let qrisSec = document.getElementById("qrisSection");
                if(qrisSec) {
                    qrisSec.innerHTML = `
                        <h3 style="color: #f59e0b; font-size: 20px;">Butuh Konfirmasi Manual</h3>
                        <p style="color: #cbd5e1; margin-top: 10px; font-size: 14px;">
                            Sistem gagal mencocokkan nominal secara otomatis. Silakan lanjut verifikasi secara manual via WhatsApp.
                        </p>
                    `;
                }
                
                if(btnConfirmWA) {
                    btnConfirmWA.disabled = false;
                    btnConfirmWA.style.background = "#f59e0b";
                    btnConfirmWA.style.cursor = "pointer";
                    btnConfirmWA.innerText = "Lanjut Konfirmasi Manual";
                    
                    // --- FIX: KASIH PERINTAH ONCLICK BIAR BISA KE WA ---
                    btnConfirmWA.onclick = function() {
                        let textWA = `*KONFIRMASI MANUAL - REVINE VAULT*\n\nOrder ID: *${activeOrderId}*\n\n_Halo admin, sistem otomatis gagal membaca struk saya. Saya lampirkan bukti transfernya di sini ya._`;
                        window.open("https://wa.me/6283898777946?text=" + encodeURIComponent(textWA), "_blank");
                    };
                }
                
                // Tembak status ke database jadi nunggu manual
                if(activeOrderId && activeOrderId !== "-") {
                    fetch(`https://stockrv-fce01-default-rtdb.asia-southeast1.firebasedatabase.app/orders/${activeOrderId}.json`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "Menunggu Acc Manual" })
                    });
                }
            }

            // Balikin tombol unggah
            btnPilihStruk.disabled = false;
            btnPilihStruk.style.opacity = "1";
            btnPilihStruk.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>
                </svg> Unggah Ulang Bukti
            `;
            
        }).catch(err => {
            console.error("Gagal Scan:", err);
            window.isOcrDone = true;
            let activeOrderId = document.getElementById("payOrderId") ? document.getElementById("payOrderId").innerText : "-";
            
            ocrStatus.style.color = "#ef4444";
            ocrStatus.innerText = "[ ERROR ] Gagal memproses gambar. Gunakan konfirmasi manual.";
            
            if(btnConfirmWA) {
                btnConfirmWA.disabled = false;
                btnConfirmWA.style.background = "#f59e0b";
                btnConfirmWA.style.cursor = "pointer";
                btnConfirmWA.innerText = "Lanjut Konfirmasi Manual";
                
                // --- FIX: KASIH PERINTAH ONCLICK JUGA PAS ERROR ---
                btnConfirmWA.onclick = function() {
                    let textWA = `*KONFIRMASI MANUAL - REVINE VAULT*\n\nOrder ID: *${activeOrderId}*\n\n_Halo admin, sistem error saat memindai struk. Saya kirimkan bukti transfernya manual ya._`;
                    window.open("https://wa.me/6283898777946?text=" + encodeURIComponent(textWA), "_blank");
                };
            }
            
            btnPilihStruk.disabled = false;
            btnPilihStruk.style.opacity = "1";
        });
    });
});
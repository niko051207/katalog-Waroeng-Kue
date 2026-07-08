const SUPABASE_URL = "https://xwkzswupohfuvtwjsepo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3a3pzd3Vwb2hmdXZ0d2pzZXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzIzNTUsImV4cCI6MjA5ODc0ODM1NX0.01PiRZHg0nxXzjkPd74BjLfhI-OYDlZAEVhYYg5TQ74";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentProducts = []; 
let cart = JSON.parse(localStorage.getItem('waroeng_kue_cart')) || [];
// 2. SELEKTOR DOM
const productGrid = document.getElementById('product-grid');
const categoryButtons = document.querySelectorAll('.category-filter');
const cartCountBadge = document.getElementById('cart-count');
const bottomBar = document.getElementById('bottom-bar');
const bottomTotalPrice = document.getElementById('bottom-total-price');
const bottomCartQty = document.getElementById('bottom-cart-qty');

// 3. FUNGSI AMBIL DATA DARI DATABASE (FETCH)
async function fetchProductsFromSupabase() {
    try {
        // Mengambil semua data dari tabel 'products' yang statusnya BUKAN archived
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .neq('status', 'archived'); // Menyembunyikan kue yang diarsip

        if (error) throw error;

        currentProducts = data;
        renderProducts(currentProducts);
    } catch (error) {
        console.error("Gagal mengambil data dari Supabase:", error.message);
        productGrid.innerHTML = `<p class="text-center text-red-500 text-sm col-span-2 md:col-span-4 py-8">Gagal memuat menu. Coba refresh halaman.</p>`;
    }
}

function saveCartToStorage() {
    localStorage.setItem('waroeng_kue_cart', JSON.stringify(cart));
}

// 4. FUNGSI UNTUK MENAMPILKAN KUE KE LAYAR (RENDER)
function renderProducts(products) {
    productGrid.innerHTML = ""; 

    products.forEach(product => {
        let statusBadge = '';
        let cardStyle = 'bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100 flex flex-col justify-between p-3';
        let buttonHTML = '';

        if (product.status === 'ready') {
             statusBadge = ``;
             buttonHTML = `<button id="btn-add-${product.id}" onclick="addToCart(${product.id})" class="w-full mt-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg> Keranjang
                           </button>`;
        } else if (product.status === 'po') {
            statusBadge = `<span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Khusus PO</span>`;
            buttonHTML = `<button id="btn-add-${product.id}" onclick="addToCart(${product.id})" class="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1">
                           Pesan PO
                        </button>`;
        } else if (product.status === 'habis') {
            statusBadge = `<span class="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Habis Hari Ini</span>`;
            cardStyle += ' opacity-60';
            buttonHTML = `<button disabled class="w-full mt-3 bg-gray-200 text-gray-400 text-xs font-semibold py-2 rounded-xl cursor-not-allowed">
                            Sold Out
                          </button>`;
        }

        productGrid.innerHTML += `
            <div class="${cardStyle}">
                <div>
                    <div class="aspect-square w-full rounded-xl bg-gray-100 overflow-hidden mb-2.5 relative">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover">
                    </div>
                    <div class="space-y-1">
                        ${statusBadge}
                        <h3 class="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">${product.name}</h3>
                    </div>
                </div>
                <div>
                    <p class="text-sm font-bold text-amber-900 mt-2">Rp ${product.price.toLocaleString('id-ID')}</p>
                    ${buttonHTML}
                </div>
            </div>
        `;
    });
}


// 5. LOGIKA FILTER KATEGORI 
categoryButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        categoryButtons.forEach(btn => {
            btn.classList.remove('bg-amber-700', 'text-white', 'shadow-xs');
            btn.classList.add('bg-gray-100', 'text-gray-600');
        });

        e.target.classList.remove('bg-gray-100', 'text-gray-600');
        e.target.classList.add('bg-amber-700', 'text-white', 'shadow-xs');

        const selectedCategory = e.target.textContent.trim();

        if (selectedCategory === 'Semua') {
            renderProducts(currentProducts);
        } else {
            const filtered = currentProducts.filter(p => p.category === selectedCategory);
            renderProducts(filtered);
        }
    });
});

// 6. LOGIKA KERANJANG 
function addToCart(productId, manualQty = null) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        if (manualQty !== null) {
            cartItem.quantity = manualQty;
        } else {
            cartItem.quantity += 1;
        }
    } else {
        const qtyToAdds = manualQty !== null ? manualQty : 1;
        cart.push({ ...product, quantity: qtyToAdds });
    }

    // Jika jumlah diinput manual menjadi 0 atau kosong, hapus dari keranjang
    if (cartItem && cartItem.quantity <= 0) {
        const index = cart.findIndex(item => item.id === productId);
        cart.splice(index, 1);
    }
// --- ANIMASI VISUAL FEEDBACK (Hanya jalan jika klik tombol biasa, bukan ketik manual) ---
    if (manualQty === null) {
        const targetBtn = document.getElementById(`btn-add-${productId}`);
        
        if (targetBtn) {
            const tksAwal = targetBtn.innerHTML; // Simpan teks/ikon asli
            
            // 1. Ubah tombol jadi hijau tanda sukses
            targetBtn.innerHTML = "✓ Berhasil";
            targetBtn.classList.remove('bg-amber-700', 'hover:bg-amber-800', 'bg-blue-600', 'hover:bg-blue-700');
            targetBtn.classList.add('bg-emerald-600');
            targetBtn.disabled = true; // Mencegah double click spam saat animasi berjalan
            
            // 2. Beri efek "Pop" membesar pada Badge Angka Keranjang di Header
            cartCountBadge.classList.add('scale-125', 'duration-200');

            // 3. Kembalikan ke semula setelah 1 detik (1000 ms)
            setTimeout(() => {
                targetBtn.innerHTML = tksAwal;
                targetBtn.classList.remove('bg-emerald-600');
                // Kembalikan warna asli sesuai status produk
                const prod = currentProducts.find(p => p.id === productId);
                if (prod && prod.status === 'po') {
                    targetBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                } else {
                    targetBtn.classList.add('bg-amber-700', 'hover:bg-amber-800');
                }
                targetBtn.disabled = false;
                cartCountBadge.classList.remove('scale-125');
            }, 1000);
        }
    }
    // -------------------------------------------------------------------------------------

    updateCartUI();
}

function removeFromCart(productId) {
    const cartItemIndex = cart.findIndex(item => item.id === productId);
    
    if (cartItemIndex > -1) {
        // Kurangi quantity-nya dulu
        cart[cartItemIndex].quantity -= 1;
        
        // Jika quantity-nya jadi 0, hapus produk dari array keranjang
        if (cart[cartItemIndex].quantity === 0) {
            cart.splice(cartItemIndex, 1);
        }
    }
    updateCartUI();

    if (cart.length > 0) {
        checkoutTrigger.click();
    } else {
        // Jika keranjang sudah kosong melompong, otomatis tutup modalnya
        checkoutModal.classList.add('hidden');
        checkoutModal.classList.remove('flex');
    }
}

function updateCartUI() {
    // Hitung total item dan total harga
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;
    });

    // Update Badge Angka di Header Atas
    if (totalItems > 0) {
        cartCountBadge.textContent = totalItems;
        cartCountBadge.classList.remove('hidden');
        
        // Munculkan Bottom Bar Melayang
        bottomBar.classList.remove('hidden');
        bottomBar.classList.add('flex');
    } else {
        cartCountBadge.classList.add('hidden');
        bottomBar.classList.add('hidden');
        bottomBar.classList.remove('flex');
    }

    // Update Angka di Bottom Bar
    bottomCartQty.textContent = totalItems;
    bottomTotalPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
    saveCartToStorage();
}

// 6. LOGIKA MODAL POP-UP & PENGIRIMAN WHATSAPP
const checkoutModal = document.getElementById('checkout-modal');
const checkoutTrigger = document.getElementById('checkout-trigger');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalCartItems = document.getElementById('modal-cart-items');
const modalTotalPrice = document.getElementById('modal-total-price');
const checkoutForm = document.getElementById('checkout-form');

// Fungsi Membuka Modal
checkoutTrigger.addEventListener('click', () => {
    // Render item belanjaan ke dalam modal
    modalCartItems.innerHTML = '';
    let totalPrice = 0;

    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        const itemHTML = `
            <div class="flex justify-between items-center py-3 border-b border-gray-50 text-sm">
                <div class="flex-1 min-w-0 pr-2">
                    <span class="font-semibold text-gray-800 block truncate">${item.name}</span>
                    <span class="text-[10px] text-gray-400 block">${item.status === 'po' ? 'Pre-Order' : 'Ready Stock'}</span>
                </div>
                
                <div class="flex items-center gap-1.5 mr-4">
                    <button onclick="changeQtyInModal(${item.id}, -1)" class="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-lg font-bold transition">-</button>
                    
                    <input type="number" min="1" value="${item.quantity}" 
                        oninput="handleManualQtyInput(${item.id}, this.value)"
                        class="w-14 h-7 text-center bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:outline-none focus:border-amber-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    
                    <button onclick="changeQtyInModal(${item.id}, 1)" class="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-lg font-bold transition">+</button>
                </div>

                <div class="text-right flex items-center gap-2">
                    <span class="font-medium text-gray-700 min-w-[80px] block">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    <button onclick="forceRemoveFromCart(${item.id})" class="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Hapus Semua">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
        modalCartItems.innerHTML += itemHTML;
    });

    modalTotalPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
    
    // Tampilkan Modal
    checkoutModal.classList.remove('hidden');
    checkoutModal.classList.add('flex');
});

// Fungsi Menutup Modal
closeModalBtn.addEventListener('click', () => {
    // Bersihkan item yang kuantitasnya 0 atau kosong saat modal ditinggalkan
    cart = cart.filter(item => item.quantity > 0);
    
    // Update ulang UI luar agar sinkron
    updateCartUI();
    checkoutModal.classList.add('hidden');
    checkoutModal.classList.remove('flex');
});

// Fungsi Mengirim Pesanan ke WhatsApp Toko
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Mencegah reload halaman formal form submit

    // Mengambil Data dari Input Form
    const name = document.getElementById('cust-name').value;
    const phone = document.getElementById('cust-phone').value;
    const method = document.querySelector('input[name="method"]:checked').value;
    const timeText = document.getElementById('cust-time').value;

    // 1. Susun baris teks pesanan kue
    let itemText = '';
    let totalPrice = 0;
    cart.forEach((item, index) => {
        totalPrice += item.price * item.quantity;
        const statusType = item.status === 'po' ? '[PO]' : '[Ready]';
        itemText += `${index + 1}. ${item.name} x${item.quantity}\n`;
    });

    // 2. Susun seluruh isi chat WhatsApp 
    const nomorToko = "6282143265465"; // GANTI DENGAN NOMOR WHATSAPP TOKO (Format wajib 62 di depan)
    
    const isiChat = `Saya mau pesan:` +
                   ` \n${itemText}\n` +
                   ` *Total:* Rp ${totalPrice.toLocaleString('id-ID')}\n` +
                //    ` *DATA PEMESAN:*\n` +
                   `- Nama: ${name}\n` +
                   `- No WA: ${phone}\n` + 
                   `- ${method}\n` +
                   `- ${timeText}`
                //    ` Mohon dihitung totalan akhir beserta ongkirnya (jika ada) dan nomor rekening toko untuk saya transfer ya min. Terima kasih!`
                   ;

    const whatsappURL = `https://api.whatsapp.com/send?phone=${nomorToko}&text=${encodeURIComponent(isiChat)}`;

    // Buka WhatsApp di tab baru
    window.open(whatsappURL, '_blank');
    cart = [];
    updateCartUI();
    checkoutModal.classList.add('hidden');
});
// Fungsi untuk tombol + dan - di dalam modal
function changeQtyInModal(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    if (!cartItem) return;

    const newQty = cartItem.quantity + change;
    
    if (newQty <= 0) {
        forceRemoveFromCart(productId);
    } else {
        addToCart(productId, newQty);
        // Refresh modal agar total harga per item & total keseluruhan langsung terupdate
        checkoutTrigger.click(); 
    }
}

// Fungsi ketika pelanggan mengetik langsung angka kuantitas di modal (VERSI ANTI-CLOSING)
function handleManualQtyInput(productId, value) {
    // 1. Jika input kosong (dihapus total oleh user), biarkan internal datanya 0 dulu, JANGAN dihapus dari array
    let intValue = parseInt(value);
    if (isNaN(intValue) || intValue < 0) intValue = 0; 

    // 2. Cari item di keranjang
    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity = intValue; // Set ke 0 atau angka baru, tapi tetap stay di keranjang
    }

    // 3. KALKULASI LANGSUNG SUBTOTAL PER ITEM
    const product = currentProducts.find(p => p.id === productId);
    if (product) {
        const newSubtotal = product.price * intValue;
        const activeInput = document.activeElement;
        if (activeInput && activeInput.tagName === 'INPUT') {
            const itemRow = activeInput.closest('.flex.justify-between.items-center');
            if (itemRow) {
                const subtotalSpan = itemRow.querySelector('.text-right span');
                if (subtotalSpan) {
                    subtotalSpan.textContent = `Rp ${newSubtotal.toLocaleString('id-ID')}`;
                }
            }
        }
    }
    
    // 4. Update total harga keseluruhan di bagian bawah modal
    let totalPrice = 0;
    let totalItems = 0;
    cart.forEach(item => {
        totalPrice += item.price * item.quantity;
        totalItems += item.quantity;
    });
    modalTotalPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;

    // 5. Update UI background (badge atas & bottom bar luar) tanpa mengganggu modal
    if (totalItems > 0) {
        cartCountBadge.textContent = totalItems;
        cartCountBadge.classList.remove('hidden');
        bottomBar.classList.remove('hidden');
        bottomBar.classList.add('flex');
    }
    bottomCartQty.textContent = totalItems;
    bottomTotalPrice.textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;

    // Simpan ke localStorage data sementaranya
    localStorage.setItem('waroeng_kue_cart', JSON.stringify(cart));
}

// Fungsi hapus total produk dari keranjang (ikon tempat sampah)
function forceRemoveFromCart(productId) {
    const cartItemIndex = cart.findIndex(item => item.id === productId);
    if (cartItemIndex > -1) {
        cart.splice(cartItemIndex, 1);
    }
    updateCartUI();

    if (cart.length > 0) {
        checkoutTrigger.click();
    } else {
        checkoutModal.classList.add('hidden');
        checkoutModal.classList.remove('flex');
    }
}

fetchProductsFromSupabase();
updateCartUI();

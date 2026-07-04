const SUPABASE_URL = "https://xwkzswupohfuvtwjsepo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3a3pzd3Vwb2hmdXZ0d2pzZXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzIzNTUsImV4cCI6MjA5ODc0ODM1NX0.01PiRZHg0nxXzjkPd74BjLfhI-OYDlZAEVhYYg5TQ74";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentProducts = []; 
let cart = [];

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

// 4. FUNGSI UNTUK MENAMPILKAN KUE KE LAYAR (RENDER)
function renderProducts(products) {
    productGrid.innerHTML = ""; 

    products.forEach(product => {
        let statusBadge = '';
        let cardStyle = 'bg-white rounded-2xl shadow-xs overflow-hidden border border-gray-100 flex flex-col justify-between p-3';
        let buttonHTML = '';

        if (product.status === 'ready') {
            statusBadge = ``;
            buttonHTML = `<button onclick="addToCart(${product.id})" class="w-full mt-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg> Keranjang
                          </button>`;
        } else if (product.status === 'po') {
            statusBadge = `<span class="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Khusus PO</span>`;
            buttonHTML = `<button onclick="addToCart(${product.id})" class="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1">
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
function addToCart(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

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
            <div class="flex justify-between items-center py-2 text-sm">
                <div>
                    <span class="font-semibold text-gray-800">${item.name}</span>
                    <span class="text-xs text-gray-400 ml-1">x${item.quantity}</span>
                    <span class="block text-[10px] text-gray-400">(${item.status === 'po' ? 'Pre-Order' : 'Ready Stock'})</span>
                </div>
                <span class="font-medium text-gray-700">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
                <button onclick="removeFromCart(${item.id})" class="p-1 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus 1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
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
        itemText += `${index + 1}. ${item.name} x${item.quantity} ${statusType}\n`;
    });

    // 2. Susun seluruh isi chat WhatsApp 
    const nomorToko = "62"; // GANTI DENGAN NOMOR WHATSAPP TOKO (Format wajib 62 di depan)
    
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
});

fetchProductsFromSupabase();
const SUPABASE_URL = "https://xwkzswupohfuvtwjsepo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3a3pzd3Vwb2hmdXZ0d2pzZXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzIzNTUsImV4cCI6MjA5ODc0ODM1NX0.01PiRZHg0nxXzjkPd74BjLfhI-OYDlZAEVhYYg5TQ74";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminForm = document.getElementById('admin-product-form');
const adminTable = document.getElementById('admin-product-table');
// A. Fungsi universal untuk update kolom teks/angka (Nama, Harga, Kategori, Status)
async function updateProductField(productId, fieldName, newValue) {
    // Validasi dasar jika harga atau nama kosong saat diketik
    if (fieldName === 'name' && !newValue.trim()) return alert("Nama kue tidak boleh kosong!");
    if (fieldName === 'price' && (isNaN(newValue) || newValue < 0)) return alert("Harga tidak valid!");

    try {
        const updateData = {};
        updateData[fieldName] = newValue; // Mengisi kolom dinamis sesuai parameter

        const { error } = await supabaseClient
            .from('products')
            .update(updateData)
            .eq('id', productId);

        if (error) throw error;
        console.log(`Berhasil update ${fieldName} untuk produk ID ${productId}`);
    } catch (error) {
        alert("Gagal memperbarui data: " + error.message);
    }
}

// B. Fungsi khusus untuk ganti foto langsung via tabel admin
async function updateProductImage(productId, file) {
    if (!file) return;

    try {
        // Ambil data produk lama untuk mengambil namanya sebagai pengenal file
        const { data: product } = await supabaseClient
            .from('products')
            .select('name')
            .eq('id', productId)
            .single();

        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}_update_${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;

        // 1. Upload foto baru ke Storage Bucket 'cake-images'
        const { error: storageError } = await supabaseClient
            .storage
            .from('cake-images')
            .upload(fileName, file);

        if (storageError) throw storageError;

        // 2. Dapatkan URL publik dari foto baru tersebut
        const { data: publicUrlData } = supabaseClient
            .storage
            .from('cake-images')
            .getPublicUrl(fileName);

        const newImageUrl = publicUrlData.publicUrl;

        // 3. Update kolom 'image' di tabel database
        await updateProductField(productId, 'image', newImageUrl);
        
        // 4. Refresh tabel admin agar foto terbaru langsung kelihatan ganti
        fetchAdminProducts();
        alert("Foto kue berhasil diperbarui!");
    } catch (error) {
        alert("Gagal memperbarui foto: " + error.message);
    }
}
// 1. FUNGSI AMBIL DATA UNTUK ADMIN
async function fetchAdminProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .neq('status', 'archived')
            .order('id', { ascending: false }); // Yang baru diinput di atas

        if (error) throw error;
        renderAdminTable(data);
    } catch (error) {
        console.error("Gagal mengambil data:", error.message);
    }
}

// FUNGSI TAMPILKAN KE TABEL ADMIN (VERSI FULLY EDITABLE)
// FUNGSI TAMPILKAN KE TABEL ADMIN (VERSI RAPI & SIMETRIS)
function renderAdminTable(products) {
    adminTable.innerHTML = "";
    products.forEach(product => {
        adminTable.innerHTML += `
            <tr class="hover:bg-gray-50/70 transition-colors border-b border-gray-100 align-middle">
                
                <td class="py-3.5 pl-2 pr-4 min-w-[280px] max-w-[350px]">
                    <div class="flex items-center gap-3.5">
                        <div class="relative group w-12 h-12 shrink-0 shadow-2xs rounded-xl overflow-hidden border border-gray-150">
                            <img src="${product.image}" class="w-full h-full object-cover">
                            <label class="absolute inset-0 bg-black/60 text-[10px] text-white font-bold opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center transition-opacity duration-200">
                                GANTI
                                <input type="file" accept="image/*" class="hidden" onchange="updateProductImage(${product.id}, this.files[0])">
                            </label>
                        </div>
                        
                        <div class="w-full">
                            <input type="text" value="${product.name}" 
                                onblur="updateProductField(${product.id}, 'name', this.value)"
                                class="w-full font-semibold text-gray-800 bg-transparent border border-transparent hover:border-gray-200 focus:border-amber-700 focus:bg-white px-2 py-1.5 rounded-xl text-sm transition focus:outline-none focus:shadow-xs">
                        </div>
                    </div>
                </td>

                <td class="py-3.5 px-4 w-36">
                    <div class="flex items-center gap-1 bg-gray-50 hover:bg-white border border-gray-200 focus-within:border-amber-700 focus-within:bg-white rounded-xl px-2.5 py-1.5 transition focus-within:shadow-xs">
                        <span class="text-xs text-gray-400 font-bold select-none">Rp</span>
                        <input type="number" value="${product.price}" 
                            onblur="updateProductField(${product.id}, 'price', parseInt(this.value))"
                            class="w-full font-bold text-gray-700 bg-transparent text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                    </div>
                </td>

                <td class="py-3.5 px-4 w-32">
                    <select onchange="updateProductField(${product.id}, 'category', this.value)" 
                        class="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-amber-700 transition cursor-pointer focus:shadow-xs">
                        <option value="Kering" ${product.category === 'Kering' ? 'selected' : ''}>Kering</option>
                        <option value="Basah" ${product.category === 'Basah' ? 'selected' : ''}>Basah</option>
                    </select>
                </td>

                <td class="py-3.5 px-4 w-32">
                    <select onchange="updateProductField(${product.id}, 'status', this.value)" 
                        class="w-full bg-gray-50 hover:bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-amber-700 transition cursor-pointer focus:shadow-xs">
                        <option value="ready" ${product.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="po" ${product.status === 'po' ? 'selected' : ''}>PO</option>
                        <option value="habis" ${product.status === 'habis' ? 'selected' : ''}>Habis</option>
                    </select>
                </td>

                <td class="py-3.5 pl-4 pr-2 w-24 text-center">
                    <button onclick="archiveProduct(${product.id})" class="text-xs font-bold text-red-500 hover:text-white border border-transparent hover:border-red-200 hover:bg-red-500 px-3 py-1.5 rounded-xl transition duration-200">
                        Arsip
                    </button>
                </td>

            </tr>
        `;
    });
}

// 3. FUNGSI INPUT DATA BARU (CREATE)
adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('prod-name').value;
    const price = parseInt(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const status = document.getElementById('prod-status').value;
    
    // Ambil file gambar mentah dari input
    const imageInput = document.getElementById('prod-image');
    const file = imageInput.files[0];

    if (!file) {
        alert("Silakan pilih foto kue terlebih dahulu!");
        return;
    }

    try {
        // Buat nama file unik agar tidak bentrok di storage (misal: 1712345678_kue-lumpur.jpg)
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${fileExtension}`;

        // 1. UPLOAD GAMBAR KE SUPABASE STORAGE
        // Catatan: Pastikan kamu sudah membuat Bucket bernama 'cake-images' di dashboard Supabase-mu dan set ke Public!
        const { data: storageData, error: storageError } = await supabaseClient
            .storage
            .from('cake-images')
            .upload(fileName, file);

        if (storageError) throw storageError;

        // 2. AMBIL URL PUBLIK DARI GAMBAR YANG SUDAH DI-UPLOAD
        const { data: publicUrlData } = supabaseClient
            .storage
            .from('cake-images')
            .getPublicUrl(fileName);

        const imageUrl = publicUrlData.publicUrl;

        // 3. SIMPAN SEMUA DATA (TERMASUK URL GAMBAR BARU) KE TABEL PRODUCTS
        const { error: insertError } = await supabaseClient
            .from('products')
            .insert([{ name, price, category, status, image: imageUrl }]);

        if (insertError) throw insertError;

        alert("Kue dan Foto berhasil ditambahkan!");
        adminForm.reset(); 
        fetchAdminProducts(); 
    } catch (error) {
        alert("Gagal menambah kue: " + error.message);
    }
});

// 4. FUNGSI UPDATE STATUS KUE (UPDATE VIA DROPDOWN)
async function updateStatus(productId, newStatus) {
    try {
        const { error } = await supabaseClient
            .from('products')
            .update({ status: newStatus })
            .eq('id', productId);

        if (error) throw error;
    } catch (error) {
        alert("Gagal mengubah status: " + error.message);
    }
}

// 5. FUNGSI ARSIPKAN KUE (Biar hilang dari katalog pelanggan)
async function archiveProduct(productId) {
    if (!confirm("Apakah Anda yakin ingin mengarsipkan kue ini?")) return;

    try {
        const { error } = await supabaseClient
            .from('products')
            .update({ status: 'archived' })
            .eq('id', productId);

        if (error) throw error;
        fetchAdminProducts();
    } catch (error) {
        alert("Gagal mengarsipkan kue: " + error.message);
    }
}

fetchAdminProducts();

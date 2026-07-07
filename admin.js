const SUPABASE_URL = "https://xwkzswupohfuvtwjsepo.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3a3pzd3Vwb2hmdXZ0d2pzZXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzIzNTUsImV4cCI6MjA5ODc0ODM1NX0.01PiRZHg0nxXzjkPd74BjLfhI-OYDlZAEVhYYg5TQ74";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const adminForm = document.getElementById('admin-product-form');
const adminTable = document.getElementById('admin-product-table');

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

// 2. FUNGSI TAMPILKAN KE TABEL ADMIN
function renderAdminTable(products) {
    adminTable.innerHTML = "";
    products.forEach(product => {
        adminTable.innerHTML += `
            <tr class="align-middle">
                <td class="py-4 flex items-center gap-3">
                    <img src="${product.image}" class="w-10 h-10 object-cover rounded-lg bg-gray-100">
                    <div>
                        <p class="font-semibold text-gray-850">${product.name}</p>
                        <p class="text-xs text-gray-400">${product.category}</p>
                    </div>
                </td>
                <td class="py-4 font-medium text-gray-700">Rp ${product.price.toLocaleString('id-ID')}</td>
                <td class="py-4">
                    <select onchange="updateStatus(${product.id}, this.value)" class="bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs font-medium focus:outline-none focus:border-amber-700">
                        <option value="ready" ${product.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="po" ${product.status === 'po' ? 'selected' : ''}>PO</option>
                        <option value="habis" ${product.status === 'habis' ? 'selected' : ''}>Habis</option>
                    </select>
                </td>
                <td class="py-4 text-right">
                    <button onclick="archiveProduct(${product.id})" class="text-xs font-semibold text-red-500 hover:text-red-700 transition">
                        Arsipkan
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

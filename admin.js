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
    const image = document.getElementById('prod-image').value;

    try {
        const { error } = await supabaseClient
            .from('products')
            .insert([{ name, price, category, status, image }]);

        if (error) throw error;

        alert("Kue berhasil ditambahkan!");
        adminForm.reset(); // Kosongkan form kembali
        fetchAdminProducts(); // Refresh tabel biar menu baru langsung muncul
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
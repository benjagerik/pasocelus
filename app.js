// Configuración general del negocio
const CONFIG = {
    whatsappNumber: "5493416000000", // Reemplazar con el número real del negocio (código de país + número, sin + ni espacios)
    adminPassword: "3232"      // Contraseña del panel de administración
};

// ==========================================================================
// FIREBASE CONFIGURATION
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA-_0CnAxZ_XabVgHgiHKcbStVmLSDgsKA",
  authDomain: "pasocelus.firebaseapp.com",
  projectId: "pasocelus",
  storageBucket: "pasocelus.firebasestorage.app",
  messagingSenderId: "660446001158",
  appId: "1:660446001158:web:51f93fa0c869151e5f2b87",
  measurementId: "G-SBW1SDNMHY",
  databaseURL: "https://pasocelus-default-rtdb.firebaseio.com"
};

let db = null;
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
}


// Datos predeterminados de respaldo (Fallback si no funciona el fetch por políticas CORS al abrir localmente sin servidor)
const FALLBACK_PRODUCTS = [
  {
    "id": 1,
    "nombre": "Auriculares Inalámbricos Only Sways TWS",
    "marca": "Only",
    "precio": 12000,
    "descripcion": "Excelente sonido, conexión inalámbrica estable y estuche de carga portátil.",
    "imagen": "fotos_productos/BFHV7837.PNG",
    "destacado": true,
    "categoria": "Audio"
  },
  {
    "id": 2,
    "nombre": "Repetidor Wi-Fi Dinax Link",
    "marca": "Dinax",
    "precio": 8500,
    "descripcion": "Amplía la señal de tu hogar de forma fácil y rápida con doble antena.",
    "imagen": "fotos_productos/IMG_7600.PNG",
    "destacado": true,
    "categoria": "Hogar y Gadgets"
  },
  {
    "id": 3,
    "nombre": "Smartwatch Dinax Fit",
    "marca": "Dinax",
    "precio": 24000,
    "descripcion": "Control de notificaciones, ritmo cardíaco y múltiples modos deportivos.",
    "imagen": "fotos_productos/IMG_7602.WEBP",
    "destacado": false,
    "categoria": "Smartwatches"
  }
];

// Estado global de la aplicación
let state = {
    products: [],
    isAdmin: false,
    activeSubcategory: "",
    visibleLimit: 24
};

// Estado del Carrito de Compras
let cart = [];

// ==========================================================================
// LÓGICA DEL CARRITO DE COMPRAS
// ==========================================================================
function addToCart(productId) {
    const product = state.products.find(p => String(p.id) === String(productId));
    if (!product) return;
    
    // Verificar si ya existe en el carrito
    const existingItem = cart.find(item => String(item.product.id) === String(productId));
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ product: product, quantity: 1 });
    }
    
    updateCartUI();
    
    // Si se añadió desde el modal de detalles, cerrarlo
    const productModal = document.getElementById("product-modal");
    if (productModal && productModal.style.display !== "none") {
        closeModal();
    }
    
    // Abrir modal de carrito
    openCartModal();
}

function removeFromCart(productId) {
    cart = cart.filter(item => String(item.product.id) !== String(productId));
    updateCartUI();
}

function updateCartQuantity(productId, delta) {
    const item = cart.find(item => String(item.product.id) === String(productId));
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    // Actualizar contador del header
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? "flex" : "none";
    }
    
    // Actualizar interior del modal
    const cartContainer = document.getElementById("cart-items-container");
    const cartTotalPrice = document.getElementById("cart-total-price");
    
    if (cartContainer && cartTotalPrice) {
        if (cart.length === 0) {
            cartContainer.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #666;"><i data-lucide="shopping-cart" style="width: 48px; height: 48px; opacity: 0.2; margin-bottom: 10px;"></i><p>Tu carrito está vacío</p></div>';
            cartTotalPrice.textContent = "$ 0";
            if (window.lucide) lucide.createIcons();
            return;
        }
        
        let html = '';
        let total = 0;
        
        cart.forEach(item => {
            const price = parseFloat(item.product.precio) || 0;
            const subtotal = price * item.quantity;
            total += subtotal;
            
            const imageSrc = item.product.imagen && item.product.imagen.trim() !== "" ? item.product.imagen : "logo.png";
            
            html += `
                <div style="display: flex; align-items: center; gap: 15px; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 1px solid var(--border-light);">
                    <img src="${imageSrc}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-light);" onerror="this.src='logo.png'">
                    <div style="flex-grow: 1;">
                        <h4 style="font-size: 14px; margin-bottom: 5px; color: #000;">${item.product.nombre}</h4>
                        <div style="color: #666; font-weight: 600; font-size: 14px;">$ ${formatPrice(price)}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; background: #f5f5f5; border-radius: 20px; padding: 5px 10px;">
                        <button onclick="updateCartQuantity('${item.product.id}', -1)" style="border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;"><i data-lucide="minus" style="width: 14px; height: 14px;"></i></button>
                        <span style="font-size: 14px; font-weight: 600; width: 20px; text-align: center;">${item.quantity}</span>
                        <button onclick="updateCartQuantity('${item.product.id}', 1)" style="border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;"><i data-lucide="plus" style="width: 14px; height: 14px;"></i></button>
                    </div>
                </div>
            `;
        });
        
        cartContainer.innerHTML = html;
        cartTotalPrice.textContent = `$ ${formatPrice(total)}`;
        const totalPoints = Math.floor(total / 1000);
        const pointsEl = document.getElementById("cart-total-points");
        if (pointsEl) pointsEl.textContent = `+${totalPoints} pts`;
        const pointsContainer = document.getElementById("cart-points-container");
        if (pointsContainer) pointsContainer.style.display = total > 0 ? "flex" : "none";
        if (window.lucide) lucide.createIcons();
    }
}

function openCartModal() {
    updateCartUI();
    const modal = document.getElementById("cart-modal");
    if (modal) {
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function closeCartModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
}

function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }
    
    let text = "¡Hola Paso Celulares! Quiero realizar el siguiente pedido:\n\n";
    let total = 0;
    
    cart.forEach(item => {
        const price = parseFloat(item.product.precio) || 0;
        const subtotal = price * item.quantity;
        total += subtotal;
        
        text += `- ${item.quantity}x ${item.product.nombre} ($ ${formatPrice(subtotal)})\n`;
    });
    
    text += `\n*Total a pagar: $ ${formatPrice(total)}*`;
    
    const totalPoints = Math.floor(total / 1000);
    if (totalPoints > 0) {
        text += `\n🎁 *Sumo: ${totalPoints} Puntos Paso*`;
    }
    
    text += `\n\nPor favor confírmame disponibilidad. ¡Muchas gracias!`;
    
    const encodedText = encodeURIComponent(text);
    const link = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedText}`;
    
    window.open(link, "_blank");
}

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
    setupEventListeners();
});

// Cargar productos desde Firebase o fallback
async function initApp() {
    if (db) {
        const productsRef = db.ref('products');
        productsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Si la data viene como objeto o array, la normalizamos a array filtrando nulos
                if (Array.isArray(data)) {
                    state.products = data.filter(p => p !== null);
                } else {
                    state.products = Object.values(data).filter(p => p !== null);
                }
                console.log("Cargados productos desde Firebase");
                
                // Actualizar UI
                renderBrandOptions();
                renderCategoryOptions();
                renderCatalog();
                updateResultsCount();
                
                if (state.isAdmin) {
                    renderAdminTable();
                }
            } else {
                // La base de datos está vacía, migrar desde local/productos.js
                console.log("Firebase está vacío. Migrando datos iniciales...");
                let dataToMigrate = typeof PRODUCTOS_DATA !== "undefined" ? PRODUCTOS_DATA : FALLBACK_PRODUCTS;
                
                // Si hay datos locales editados, priorizarlos
                if (localStorage.getItem("paso_celulares_has_local_edits") === "true") {
                    try {
                        const localData = JSON.parse(localStorage.getItem("paso_celulares_products"));
                        if (localData && localData.length > 0) {
                            dataToMigrate = localData;
                        }
                    } catch (e) {}
                }
                
                // Subir a Firebase (disparará el evento 'value' de nuevo)
                productsRef.set(dataToMigrate);
            }
        }, (error) => {
            console.error("Error al leer desde Firebase", error);
            fallbackLocalLoad();
        });
    } else {
        fallbackLocalLoad();
    }
    
    // Si ya estaba logueado anteriormente en esta sesión
    if (sessionStorage.getItem("paso_celulares_logged") === "true") {
        loginAdmin();
    }
}

function fallbackLocalLoad() {
    if (typeof PRODUCTOS_DATA !== "undefined" && Array.isArray(PRODUCTOS_DATA)) {
        state.products = PRODUCTOS_DATA;
    } else {
        state.products = [...FALLBACK_PRODUCTS];
    }
    console.log("Usando fallback de productos locales");
    renderBrandOptions();
    renderCategoryOptions();
    renderCatalog();
    updateResultsCount();
}

// ==========================================================================
// RENDERIZADO DEL CATÁLOGO (VISTA PÚBLICA)
// ==========================================================================

// Llenar el selector de marcas dinámicamente
function renderBrandOptions() {
    const brandFilter = document.getElementById("brand-filter");
    if (!brandFilter) return;

    // Obtener marcas únicas ordenadas alfabéticamente
    const brands = [...new Set(state.products.map(p => p.marca.trim()))].sort();
    
    // Guardar opción seleccionada actual
    const currentValue = brandFilter.value;
    
    // Resetear HTML conservando la opción inicial
    brandFilter.innerHTML = '<option value="all">Todas las marcas</option>';
    
    brands.forEach(brand => {
        const option = document.createElement("option");
        option.value = brand.toLowerCase();
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
    
    // Restaurar selección anterior si existía
    if (currentValue) brandFilter.value = currentValue;
}

// Llenar el selector de categorías dinámicamente
function renderCategoryOptions() {
    const categoryFilter = document.getElementById("category-filter");
    if (!categoryFilter) return;

    // Obtener categorías únicas
    const categories = [...new Set(state.products.map(p => p.categoria || "Otros"))].filter(c => c.trim() !== "").sort();
    
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="all">Todas las categorías</option>';
    
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.toLowerCase();
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
    
    if (currentValue) categoryFilter.value = currentValue;
}

// Renderizar los productos con filtros aplicados y sincronizar el carrusel de categorías
function renderCatalog() {
    const productsGrid = document.getElementById("products-grid");
    if (!productsGrid) return;
    
    const categoryFilter = document.getElementById("category-filter").value.toLowerCase();
    const subcatPillsContainer = document.getElementById("subcategory-pills-container");
    
    // Sincronizar el estado del carrusel de categorías (active/focused)
    const carousel = document.getElementById("category-carousel");
    document.querySelectorAll(".category-card-slide").forEach(card => {
        const cat = card.getAttribute("data-category").toLowerCase();
        if (cat === categoryFilter) {
            card.classList.add("active");
            // Centrar scroll horizontal en el elemento activo sin alterar scroll vertical de la página
            if (carousel && carousel.scrollWidth > carousel.clientWidth) {
                const cardLeft = card.offsetLeft;
                const cardWidth = card.offsetWidth;
                const carouselWidth = carousel.offsetWidth;
                carousel.scrollTo({
                    left: cardLeft - (carouselWidth / 2) + (cardWidth / 2),
                    behavior: 'smooth'
                });
            }
        } else {
            card.classList.remove("active");
        }
    });
    
    // Renderizar píldoras de subcategorías si hay una categoría específica activa
    if (categoryFilter !== "all" && subcatPillsContainer) {
        renderSubcategoryPills();
        subcatPillsContainer.style.display = "flex";
    } else if (subcatPillsContainer) {
        subcatPillsContainer.style.display = "none";
    }
    
    const filteredProducts = getFilteredAndSortedProducts();
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <i data-lucide="smartphone-off"></i>
                <h3>No encontramos dispositivos</h3>
                <p>Prueba ajustando los filtros de búsqueda o categoría.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    productsGrid.innerHTML = "";
    
    const totalFiltered = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(0, state.visibleLimit);
    
    paginatedProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute("data-id", product.id);
        
        // Imagen con fallback elegante y lazy loading
        const imageSrc = product.imagen && product.imagen.trim() !== "" ? product.imagen : "";
        const imageHtml = imageSrc 
            ? `<img src="${imageSrc}" alt="${product.nombre}" class="card-image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
               <div class="no-image-placeholder" style="display: none;"><i data-lucide="smartphone"></i><span>Sin Imagen</span></div>`
            : `<div class="no-image-placeholder"><i data-lucide="smartphone"></i><span>Sin Imagen</span></div>`;
            
        // Badge Destacado
        const featuredBadgeHtml = product.destacado ? `<span class="badge badge-featured"><i data-lucide="zap"></i> Destacado</span>` : '';
        // Badge Oferta
        const saleBadgeHtml = product.oferta ? `<span class="badge badge-sale"><i data-lucide="percent"></i> Oferta</span>` : '';

        const isCelular = product.categoria && product.categoria.toLowerCase() === "celulares";
        const detailsButtonHtml = isCelular 
            ? `<button class="btn btn-secondary btn-view-details-secondary" data-id="${product.id}">
                   Ver detalles
               </button>`
            : '';

        const isVape = product.categoria && product.categoria.toLowerCase() === "vapes";
        const vapeBadgeHtml = isVape 
            ? `<div class="vape-flavors-badge">
                   <i data-lucide="tag"></i> Consultar sabores
               </div>`
            : '';

        card.innerHTML = `
            <div class="card-image-area">
                ${imageHtml}
                <div class="card-badges">
                    ${featuredBadgeHtml}
                    ${saleBadgeHtml}
                </div>
            </div>
            <div class="card-content">
                <span class="product-brand">${product.marca}</span>
                <h3 class="product-title" title="${product.nombre}">${product.nombre}</h3>
                
                <div class="price-row">
                    ${isCelular 
                        ? `<div class="price-container">
                               <span class="price-currency">$</span>
                               <span class="price-value">${formatPrice(product.precio)}</span>
                           </div>`
                        : `<div class="price-container" style="color: var(--apple-blue); font-size: 1.1rem;">
                               Consultar precio
                           </div>`
                    }
                    <div class="availability-badge">
                        <span class="dot-green"></span>
                        <span>Stock</span>
                    </div>
                </div>
                
                ${vapeBadgeHtml}
                
                <div class="card-actions">
                    <a href="${getWhatsAppLink(product)}" target="_blank" class="btn btn-primary btn-whatsapp-primary">
                        <i data-lucide="message-square"></i> Consultar WhatsApp
                    </a>
                    ${detailsButtonHtml}
                </div>
            </div>
        `;
        
        productsGrid.appendChild(card);
    });
    
    // Si hay más productos de los que se están mostrando, agregar botón Cargar Más
    if (state.visibleLimit < totalFiltered) {
        const loadMoreContainer = document.createElement("div");
        loadMoreContainer.style.width = "100%";
        loadMoreContainer.style.display = "flex";
        loadMoreContainer.style.justifyContent = "center";
        loadMoreContainer.style.padding = "20px 0 40px 0";
        loadMoreContainer.innerHTML = `
            <button onclick="window.loadMoreProducts()" class="btn btn-secondary" style="border-radius: 20px; padding: 12px 30px; font-weight: 600;">
                <i data-lucide="chevron-down"></i> Cargar más productos
            </button>
        `;
        productsGrid.appendChild(loadMoreContainer);
    }
    
    // Instanciar iconos de lucide agregados dinámicamente
    lucide.createIcons();
    
    // Agregar event listeners a botones recién creados
    document.querySelectorAll(".btn-view-details-secondary").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.getAttribute("data-id"));
            openDetailModal(id);
        });
    });
}

// Seleccionar categoría al hacer clic en una tarjeta del inicio
function selectCategoryFromCard(categoryName) {
    const filter = document.getElementById("category-filter");
    if (filter) {
        const currentVal = filter.value.toLowerCase();
        if (categoryName === "all" || currentVal === categoryName.toLowerCase()) {
            filter.value = "all";
        } else {
            // Encontrar opción coincidente en el select
            for (let i = 0; i < filter.options.length; i++) {
                if (filter.options[i].text.toLowerCase() === categoryName.toLowerCase() ||
                    filter.options[i].value.toLowerCase() === categoryName.toLowerCase()) {
                    filter.selectedIndex = i;
                    break;
                }
            }
        }
        state.activeSubcategory = ""; // Limpiar subcategoría activa al cambiar de categoría
        filter.dispatchEvent(new Event('change'));
        document.getElementById("catalogo").scrollIntoView({ behavior: 'smooth' });
    }
}

// Renderizar carrusel de píldoras de subcategoría
function renderSubcategoryPills() {
    const container = document.getElementById("subcategory-pills-container");
    if (!container) return;
    
    const activeCategory = document.getElementById("category-filter").value;
    
    // Obtener subcategorías únicas correspondientes a la categoría seleccionada
    const subcatList = [...new Set(state.products
        .filter(p => p.categoria && p.categoria.toLowerCase() === activeCategory.toLowerCase())
        .map(p => p.subcategoria || "Otros")
    )].filter(s => s.trim() !== "").sort();
    
    container.innerHTML = "";
    
    // Agregar píldora "Todos"
    const allPill = document.createElement("div");
    allPill.className = `subcat-pill ${state.activeSubcategory === "" ? "active" : ""}`;
    allPill.textContent = "Todos";
    allPill.addEventListener("click", () => {
        state.activeSubcategory = "";
        applyFiltersAndRender();
    });
    container.appendChild(allPill);
    
    // Agregar píldoras de subcategorías
    subcatList.forEach(sub => {
        const pill = document.createElement("div");
        pill.className = `subcat-pill ${state.activeSubcategory.toLowerCase() === sub.toLowerCase() ? "active" : ""}`;
        pill.textContent = sub;
        pill.addEventListener("click", () => {
            state.activeSubcategory = sub;
            applyFiltersAndRender();
        });
        container.appendChild(pill);
    });
}

// Obtener lista de productos filtrada y ordenada
function getFilteredAndSortedProducts() {
    const searchInputEl = document.getElementById("header-search-input") || document.getElementById("search-input");
    const searchInput = searchInputEl ? searchInputEl.value.toLowerCase().trim() : "";
    const brandFilter = document.getElementById("brand-filter").value.toLowerCase();
    const categoryFilter = document.getElementById("category-filter").value.toLowerCase();
    const priceSort = document.getElementById("price-sort").value;
    
    // Mostrar/ocultar resumen de filtros activos
    const hasActiveFilters = searchInput !== "" || brandFilter !== "all" || categoryFilter !== "all" || state.activeSubcategory !== "";
    document.getElementById("active-filters-summary").style.display = hasActiveFilters ? "flex" : "none";
    
    let result = [...state.products];
    
    // 1. Filtrar por buscador (Nombre, Marca o Descripción)
    if (searchInput !== "") {
        result = result.filter(product => {
            const matchesName = product.nombre.toLowerCase().includes(searchInput);
            const matchesBrand = product.marca.toLowerCase().includes(searchInput);
            const matchesDesc = product.descripcion && product.descripcion.toLowerCase().includes(searchInput);
            
            return matchesName || matchesBrand || matchesDesc;
        });
    }
    
    // 2. Filtrar por marca
    if (brandFilter !== "all") {
        result = result.filter(product => product.marca.toLowerCase() === brandFilter);
    }
    
    // 3. Filtrar por categoría y subcategoría
    if (categoryFilter !== "all") {
        result = result.filter(product => (product.categoria || "Otros").toLowerCase() === categoryFilter);
        
        // Filtrar por subcategoría activa
        if (state.activeSubcategory && state.activeSubcategory !== "") {
            result = result.filter(product => (product.subcategoria || "Otros").toLowerCase() === state.activeSubcategory.toLowerCase());
        }
    }
    
    // 4. Ordenamiento
    if (priceSort === "price-asc") {
        result.sort((a, b) => a.precio - b.precio);
    } else if (priceSort === "price-desc") {
        result.sort((a, b) => b.precio - a.precio);
    } else {
        // Ordenar destacados primero, luego mantener orden original o por ID
        result.sort((a, b) => {
            if (a.destacado && !b.destacado) return -1;
            if (!a.destacado && b.destacado) return 1;
            return b.id - a.id; // Más nuevos de ID primero
        });
    }
    
    return result;
}

// Actualizar texto informativo de cantidad de resultados
function updateResultsCount() {
    const countText = document.getElementById("results-count-text");
    if (!countText) return;
    
    const count = getFilteredAndSortedProducts().length;
    
    if (state.products.length === 0) {
        countText.textContent = "El catálogo está vacío actualmente.";
    } else if (count === state.products.length) {
        countText.textContent = `Mostrando todos los dispositivos (${count} disponibles)`;
    } else {
        let label = `Encontrados ${count} dispositivos`;
        if (state.activeSubcategory) {
            label += ` en la sección ${state.activeSubcategory}`;
        }
        countText.textContent = label;
    }
}

// ==========================================================================
// MODAL DE DETALLE DE PRODUCTO
// ==========================================================================
function openDetailModal(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const modal = document.getElementById("product-modal");
    const contentArea = document.getElementById("modal-content-area");
    
    const featuredBadgeHtml = product.destacado ? `<span class="badge badge-featured"><i data-lucide="zap"></i> Destacado</span>` : '';
    const saleBadgeHtml = product.oferta ? `<span class="badge badge-sale"><i data-lucide="percent"></i> Oferta</span>` : '';
    const isCelular = product.categoria && product.categoria.toLowerCase() === "celulares";
    
    // Imagen con fallback
    const imageSrc = product.imagen && product.imagen.trim() !== "" ? product.imagen : "";
    const imageHtml = imageSrc 
        ? `<img src="${imageSrc}" alt="${product.nombre}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="no-image-placeholder" style="display: none; height: 300px;"><i data-lucide="smartphone" style="width: 48px; height: 48px;"></i><span>Sin Imagen</span></div>`
        : `<div class="no-image-placeholder" style="height: 300px;"><i data-lucide="smartphone" style="width: 48px; height: 48px;"></i><span>Sin Imagen</span></div>`;

    contentArea.innerHTML = `
        <div class="detail-layout">
            <div class="detail-image-wrapper">
                ${imageHtml}
            </div>
            
            <div class="detail-info">
                <div class="detail-header">
                    <span class="detail-brand">${product.marca}</span>
                    <h2 class="detail-title">${product.nombre}</h2>
                    <div class="detail-tags">
                        ${featuredBadgeHtml}
                        ${saleBadgeHtml}
                    </div>
                </div>
                
                <div class="detail-price-box">
                    <span class="price-label">${isCelular ? 'Precio Contado/Efectivo' : 'Valor del equipo'}</span>
                    <span class="detail-price">${isCelular ? `$ ${formatPrice(product.precio)}` : '<span style="color: var(--apple-blue); font-size: 1.4rem;">Consultar precio</span>'}</span>
                </div>
                
                ${product.descripcion ? `
                    <h4 class="detail-desc-title">Descripción</h4>
                    <p class="detail-description">${product.descripcion}</p>
                ` : ''}
                
                <button onclick="addToCart('${product.id}')" class="btn btn-whatsapp btn-full btn-lg" style="margin-top: auto; padding: 14px 20px; background-color: #000; color: #fff; border: none;">
                    <i data-lucide="shopping-cart"></i> Añadir al Carrito
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Desactivar scroll detrás del modal
    lucide.createIcons();
}

function closeModal() {
    document.getElementById("product-modal").style.display = "none";
    document.body.style.overflow = ""; // Reactivar scroll
}

// ==========================================================================
// VISTA DE ADMINISTRADOR - LOGIC & ACCIONES
// ==========================================================================

function openAdminAuthModal() {
    document.getElementById("admin-auth-modal").style.display = "flex";
    document.getElementById("admin-password").focus();
}

function closeAdminAuthModal() {
    document.getElementById("admin-auth-modal").style.display = "none";
    document.getElementById("admin-password").value = "";
    document.getElementById("auth-error-msg").style.display = "none";
}

function submitAdminAuth() {
    const passwordInput = document.getElementById("admin-password").value;
    const errorMsg = document.getElementById("auth-error-msg");
    
    if (passwordInput === CONFIG.adminPassword) {
        sessionStorage.setItem("paso_celulares_logged", "true");
        closeAdminAuthModal();
        loginAdmin();
    } else {
        errorMsg.style.display = "block";
    }
}

function loginAdmin() {
    state.isAdmin = true;
    
    // Ocultar sección de usuario común
    if (document.querySelector(".apple-hero")) document.querySelector(".apple-hero").style.display = "none";
    if (document.querySelector(".bento-section")) document.querySelector(".bento-section").style.display = "none";
    if (document.querySelector(".store-section")) document.querySelector(".store-section").style.display = "none";
    if (document.querySelector(".apple-footer")) document.querySelector(".apple-footer").style.display = "none";
    
    // Cambiar link activo
    const adminBtn = document.getElementById("nav-btn-admin");
    if (adminBtn) adminBtn.classList.add("active");
    
    // Ocultar menú móvil si estuviera abierto
    closeMobileNav();
    
    // Mostrar panel administrativo
    document.getElementById("admin-panel").style.display = "block";
    
    // Renderizar elementos del administrador
    renderAdminTable();
    updateAdminStats();
}

function logoutAdmin() {
    state.isAdmin = false;
    sessionStorage.removeItem("paso_celulares_logged");
    
    // Ocultar panel administrativo y formulario
    document.getElementById("admin-panel").style.display = "none";
    document.getElementById("admin-product-form-container").style.display = "none";
    
    // Restaurar vista de catálogo de clientes
    if (document.querySelector(".apple-hero")) document.querySelector(".apple-hero").style.display = "flex";
    if (document.querySelector(".bento-section")) document.querySelector(".bento-section").style.display = "block";
    if (document.querySelector(".store-section")) document.querySelector(".store-section").style.display = "block";
    if (document.querySelector(".apple-footer")) document.querySelector(".apple-footer").style.display = "block";
    
    // Cambiar link activo
    const adminBtn2 = document.getElementById("nav-btn-admin");
    if (adminBtn2) adminBtn2.classList.remove("active");
    
    // Actualizar catálogo y combos por si hubo cambios en la sesión de admin
    renderBrandOptions();
    renderCatalog();
    updateResultsCount();
}

function updateAdminStats() {
    document.getElementById("stat-total-products").textContent = state.products.length;
    
    const categoriesCount = [...new Set(state.products.map(p => p.categoria || "Otros"))].filter(c => c.trim() !== "").length;
    document.getElementById("stat-total-categories").textContent = categoriesCount;
}

function renderAdminTable() {
    const tableBody = document.getElementById("admin-table-body");
    const searchFilter = document.getElementById("admin-table-search").value.toLowerCase().trim();
    
    if (!tableBody) return;
    
    tableBody.innerHTML = "";
    
    let filtered = [...state.products];
    if (searchFilter !== "") {
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchFilter) || 
            p.marca.toLowerCase().includes(searchFilter)
        );
    }
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">
                    No se encontraron productos cargados.
                </td>
            </tr>
        `;
        return;
    }
    
    filtered.forEach(product => {
        const tr = document.createElement("tr");
        
        const imageSrc = product.imagen && product.imagen.trim() !== "" ? product.imagen : "";
        const imageHtml = imageSrc 
            ? `<img src="${imageSrc}" class="admin-tbl-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\' stroke-width=\'2\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M10.5 1.5H13.5M10.5 22.5H13.5M6 4.5H18C18.8284 4.5 19.5 5.17157 19.5 6V18C19.5 18.8284 18.8284 19.5 18 19.5H6C5.17157 19.5 4.5 18.8284 4.5 18V6C4.5 5.17157 5.17157 4.5 6 4.5Z\'/%3E%3C/svg%3E';">`
            : `<div class="admin-tbl-img" style="background: #111827; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--text-muted)"><i data-lucide="smartphone"></i></div>`;
            
        tr.innerHTML = `
            <td>${imageHtml}</td>
            <td><strong>${product.nombre}</strong></td>
            <td>${product.marca}</td>
            <td>${product.categoria || "Otros"}</td>
            <td>${product.subcategoria || "Otros"}</td>
            <td>
                <div class="admin-inline-price-wrapper">
                    <span class="admin-price-currency">$</span>
                    <input type="number" class="admin-inline-price-input" data-id="${product.id}" value="${product.precio}" step="any" min="0">
                </div>
            </td>
            <td>${product.destacado ? '<span class="text-accent" style="font-weight:700">Sí</span>' : 'No'}</td>
            <td>${product.oferta ? '<span class="text-accent" style="font-weight:700; color: #e33c3c;">Sí</span>' : 'No'}</td>
            <td>
                <div class="admin-tbl-actions">
                    <button class="btn-action-icon btn-edit" title="Editar" onclick="openEditProductForm(${product.id})">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-action-icon btn-delete" title="Eliminar" onclick="deleteProduct(${product.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    
    lucide.createIcons();

    // Event listeners para actualizar el precio directamente desde la tabla sin abrir el modal de edición
    document.querySelectorAll(".admin-inline-price-input").forEach(input => {
        // Guardar cambios al salir o cambiar
        input.addEventListener("change", (e) => {
            const id = parseInt(e.target.getAttribute("data-id"));
            const newPrice = parseFloat(e.target.value);
            if (!isNaN(newPrice) && newPrice >= 0) {
                const product = state.products.find(p => p.id === id);
                if (product) {
                    product.precio = newPrice;
                    saveDataToLocalStorage();
                    
                    // Efecto visual rápido en el borde del input para indicar guardado exitoso
                    const wrapper = e.target.closest(".admin-inline-price-wrapper");
                    if (wrapper) {
                        wrapper.classList.add("saved");
                        setTimeout(() => {
                            wrapper.classList.remove("saved");
                        }, 1000);
                    }
                }
            }
        });

        // Al presionar Enter, quitar foco (lo que dispara el guardado) y enfocar el siguiente input
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.target.blur();
                
                // Buscar el siguiente input de precio en la tabla
                const inputs = Array.from(document.querySelectorAll(".admin-inline-price-input"));
                const currentIndex = inputs.indexOf(e.target);
                if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                    inputs[currentIndex + 1].select();
                }
            }
        });
    });
}

// Abrir formulario para agregar nuevo producto
function openAddProductForm() {
    const formContainer = document.getElementById("admin-product-form-container");
    document.getElementById("form-title").textContent = "Agregar Producto";
    document.getElementById("product-form").reset();
    document.getElementById("form-product-id").value = "";
    
    // Resetear checkboxes del formulario
    document.getElementById("form-featured").checked = false;
    document.getElementById("form-on-sale").checked = false;
    
    // Resetear campos de imagen cargados
    document.getElementById("form-image-file").value = "";
    document.getElementById("form-image").value = "";
    document.getElementById("image-preview-container").style.display = "none";
    document.getElementById("image-processing-loader").style.display = "none";
    
    // Llenar categorías y subcategorías vacías
    populateFormCategoryOptions("", "");
    
    formContainer.style.display = "block";
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

// Abrir formulario cargado con los datos de un producto a editar
function openEditProductForm(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const formContainer = document.getElementById("admin-product-form-container");
    document.getElementById("form-title").textContent = "Editar Producto";
    
    // Resetear input de archivo y loader
    document.getElementById("form-image-file").value = "";
    document.getElementById("image-processing-loader").style.display = "none";
    
    // Cargar datos básicos
    document.getElementById("form-product-id").value = product.id;
    document.getElementById("form-name").value = product.nombre;
    document.getElementById("form-brand").value = product.marca;
    document.getElementById("form-price").value = product.precio;
    
    // Llenar categorías y subcategorías
    populateFormCategoryOptions(product.categoria || "", product.subcategoria || "");
    
    document.getElementById("form-description").value = product.descripcion || "";
    document.getElementById("form-image").value = product.imagen || "";
    document.getElementById("form-featured").checked = !!product.destacado;
    document.getElementById("form-on-sale").checked = !!product.oferta;
    
    // Mostrar vista previa si ya tiene imagen
    const previewContainer = document.getElementById("image-preview-container");
    const previewImage = document.getElementById("form-image-preview");
    if (product.imagen && product.imagen.trim() !== "") {
        previewImage.src = product.imagen;
        previewContainer.style.display = "block";
    } else {
        previewContainer.style.display = "none";
    }
    
    formContainer.style.display = "block";
    formContainer.scrollIntoView({ behavior: 'smooth' });
}

function closeProductForm() {
    document.getElementById("admin-product-form-container").style.display = "none";
}

// Guardar producto (Nuevo o Edición)
function saveProduct(event) {
    event.preventDefault();
    
    const idInput = document.getElementById("form-product-id").value;
    const name = document.getElementById("form-name").value.trim();
    const brand = document.getElementById("form-brand").value.trim();
    const price = parseFloat(document.getElementById("form-price").value);
    
    // Leer categoría desde el select o nueva
    const categorySelect = document.getElementById("form-category-select").value;
    const category = categorySelect === "new_category" 
        ? document.getElementById("form-new-category").value.trim() 
        : categorySelect;
        
    // Leer subcategoría desde el select o nueva
    const subcategorySelect = document.getElementById("form-subcategory-select").value;
    const subcategory = subcategorySelect === "new_subcategory"
        ? document.getElementById("form-new-subcategory").value.trim()
        : subcategorySelect;
        
    const description = document.getElementById("form-description").value.trim();
    const image = document.getElementById("form-image").value.trim();
    const featured = document.getElementById("form-featured").checked;
    const onSale = document.getElementById("form-on-sale").checked;
    
    if (idInput === "") {
        // CREAR NUEVO
        const nextId = state.products.length > 0 ? Math.max(...state.products.map(p => p.id)) + 1 : 1;
        const newProduct = {
            id: nextId,
            nombre: name,
            marca: brand,
            precio: price,
            categoria: category,
            subcategoria: subcategory,
            descripcion: description,
            imagen: image !== "" ? image : `fotos_productos/${name.toLowerCase().replace(/[^a-z0-9]/g, "_")}.jpg`,
            destacado: featured,
            oferta: onSale
        };
        state.products.push(newProduct);
    } else {
        // EDITAR EXISTENTE
        const targetId = parseInt(idInput);
        const index = state.products.findIndex(p => p.id === targetId);
        if (index !== -1) {
            state.products[index] = {
                id: targetId,
                nombre: name,
                marca: brand,
                precio: price,
                categoria: category,
                subcategoria: subcategory,
                descripcion: description,
                imagen: image,
                destacado: featured,
                oferta: onSale
            };
        }
    }
    
    // Guardar cambios en Firebase (o storage local) y resetear
    saveDataToLocalStorage();
    closeProductForm();
    renderBrandOptions();
    renderCategoryOptions();
    renderCatalog();
    updateResultsCount();
    renderAdminTable();
    updateAdminStats();
    
    alert("Producto guardado correctamente en la nube.");
}

// Eliminar producto
function deleteProduct(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar "${product.nombre}" de la lista?`);
    
    if (confirmDelete) {
        state.products = state.products.filter(p => p.id !== id);
        saveDataToLocalStorage();
        renderAdminTable();
        updateAdminStats();
    }
}

// Guardar datos actuales en Firebase y fallback local
function saveDataToLocalStorage() {
    if (typeof db !== 'undefined' && db) {
        db.ref('products').set(state.products);
    }
    
    // Backup local por seguridad
    localStorage.setItem("paso_celulares_products", JSON.stringify(state.products));
    localStorage.setItem("paso_celulares_has_local_edits", "true");
}

// Exportar base de datos JSON y JS a archivos descargables
function exportJsonData() {
    const productsData = state.products;
    
    // 1. Generar y descargar productos.js
    const jsContent = "const PRODUCTOS_DATA = " + JSON.stringify(productsData, null, 2) + ";";
    const jsUri = 'data:text/javascript;charset=utf-8,' + encodeURIComponent(jsContent);
    
    const linkJs = document.createElement('a');
    linkJs.setAttribute('href', jsUri);
    linkJs.setAttribute('download', 'productos.js');
    document.body.appendChild(linkJs);
    linkJs.click();
    document.body.removeChild(linkJs);
    
    // 2. Generar y descargar productos.json por compatibilidad
    const jsonContent = JSON.stringify(productsData, null, 2);
    const jsonUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonContent);
    
    setTimeout(() => {
        const linkJson = document.createElement('a');
        linkJson.setAttribute('href', jsonUri);
        linkJson.setAttribute('download', 'productos.json');
        document.body.appendChild(linkJson);
        linkJson.click();
        document.body.removeChild(linkJson);
    }, 300);
    
    // Mantenemos el flag de cambios locales activo para evitar que un reinicio de página
    // accidental antes de copiar los archivos descargados borre el trabajo del usuario.
    // Solo se desactivará si el usuario restablece la base de datos de forma manual.
    // localStorage.removeItem("paso_celulares_has_local_edits");
    
    alert("Se descargaron los archivos 'productos.js' y 'productos.json' actualizados.\n\n1. Copia y reemplaza estos archivos descargados en la carpeta de tu proyecto en tu computadora.\n2. Sube/actualiza tu sitio en tu hosting (como GitHub Pages, Netlify, Vercel, etc.) para que todos los dispositivos de tus clientes vean los nuevos precios.");
}

// ==========================================================================
// EVENT LISTENERS & AYUDANTES (HELPERS)
// ==========================================================================

window.loadMoreProducts = function() {
    state.visibleLimit += 24;
    renderCatalog();
};

function applyFiltersAndRender() {
    state.visibleLimit = 24;
    renderCatalog();
    updateResultsCount();
}

function setupEventListeners() {
    // Buscador
    const headerSearchInput = document.getElementById("header-search-input");
    const headerSearchBtn = document.getElementById("header-search-btn");
    
    if (headerSearchInput) {
        headerSearchInput.addEventListener("input", applyFiltersAndRender);
        
        if (headerSearchBtn) {
            headerSearchBtn.addEventListener("click", () => {
                applyFiltersAndRender();
                // Scroll al catálogo
                document.getElementById("catalogo").scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        headerSearchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                document.getElementById("catalogo").scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    
    // Selectores de Filtro
    document.getElementById("brand-filter").addEventListener("change", applyFiltersAndRender);
    document.getElementById("category-filter").addEventListener("change", () => {
        state.activeSubcategory = ""; // Limpiar subcategoría activa al cambiar de categoría
        applyFiltersAndRender();
    });
    document.getElementById("price-sort").addEventListener("change", applyFiltersAndRender);
    
    // Resetear Filtros
    document.getElementById("reset-all-filters").addEventListener("click", () => {
        const headerSearchInput = document.getElementById("header-search-input");
        if (headerSearchInput) headerSearchInput.value = "";
        document.getElementById("brand-filter").value = "all";
        document.getElementById("category-filter").value = "all";
        state.activeSubcategory = "";
        document.getElementById("price-sort").value = "default";
        applyFiltersAndRender();
        updateResultsCount();
    });
    
    // Modales
    document.getElementById("close-modal-btn").addEventListener("click", closeModal);
    document.getElementById("product-modal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("product-modal")) {
            closeModal();
        }
    });
    
    // Carrito
    const cartBtn = document.getElementById("cart-btn");
    if (cartBtn) {
        cartBtn.addEventListener("click", (e) => { 
            e.preventDefault(); 
            openCartModal(); 
        });
    }
    
    const closeCartBtn = document.getElementById("close-cart-btn");
    if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartModal);
    
    const cartModal = document.getElementById("cart-modal");
    if (cartModal) {
        cartModal.addEventListener("click", (e) => {
            if (e.target === cartModal) closeCartModal();
        });
    }
    
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutWhatsApp);
    
    // Menú móvil toggle
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    const mobileNav = document.getElementById("mobile-nav");
    
    if (mobileMenuToggle && mobileNav) {
        mobileMenuToggle.addEventListener("click", () => {
            const isClosed = mobileNav.style.display === "none";
            mobileNav.style.display = isClosed ? "flex" : "none";
            mobileMenuToggle.innerHTML = isClosed ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
            lucide.createIcons();
        });
    }
    
    // Cerrar menú móvil al hacer clic en los enlaces
    document.querySelectorAll(".mobile-nav-item").forEach(item => {
        if (!item.classList.contains("admin-trigger-btn")) {
            item.addEventListener("click", closeMobileNav);
        }
    });
    
    // Triggers de Admin (Múltiples botones que abren el panel)
    document.querySelectorAll(".admin-trigger-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            if (state.isAdmin) {
                logoutAdmin();
            } else {
                openAdminAuthModal();
            }
        });
    });
    
    // Login Admin Form (Auth)
    document.getElementById("close-admin-auth-btn").addEventListener("click", closeAdminAuthModal);
    document.getElementById("submit-auth-btn").addEventListener("click", submitAdminAuth);
    document.getElementById("admin-password").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            submitAdminAuth();
        }
    });
    
    // Admin Actions Buttons
    document.getElementById("admin-logout-btn").addEventListener("click", logoutAdmin);
    document.getElementById("admin-add-product-btn").addEventListener("click", openAddProductForm);
    document.getElementById("admin-export-btn").addEventListener("click", exportJsonData);
    document.getElementById("admin-reset-db-btn").addEventListener("click", () => {
        if (confirm("¿Estás seguro de que deseas limpiar la base de datos local y recargar desde los archivos del servidor? Perderás cualquier cambio que no hayas exportado.")) {
            localStorage.removeItem("paso_celulares_has_local_edits");
            localStorage.removeItem("paso_celulares_products");
            location.reload();
        }
    });
    document.getElementById("admin-table-search").addEventListener("input", renderAdminTable);
    
    // Formulario de Producto Actions
    document.getElementById("close-form-btn").addEventListener("click", closeProductForm);
    document.getElementById("cancel-form-btn").addEventListener("click", closeProductForm);
    document.getElementById("product-form").addEventListener("submit", saveProduct);
    
    // Carga de archivo de imagen y arrastre (Drag & Drop)
    const imageFileInput = document.getElementById("form-image-file");
    const uploadZone = document.getElementById("image-upload-zone");
    
    if (uploadZone && imageFileInput) {
        // Clic en la zona de carga
        uploadZone.addEventListener("click", () => imageFileInput.click());
        
        // Eventos de arrastre (drag)
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'dragend', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('drag-active');
            }, false);
        });

        // Soltar archivo (drop)
        uploadZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                processAndUploadImage(files[0]);
            }
        }, false);
    }
    
    if (imageFileInput) {
        imageFileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files.length > 0) {
                processAndUploadImage(e.target.files[0]);
            }
        });
    }

    // Evento de pegar en el formulario (Ctrl+V)
    const productForm = document.getElementById("product-form");
    if (productForm) {
        productForm.addEventListener("paste", (e) => {
            const items = (e.clipboardData || window.clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") === 0) {
                    const blob = items[i].getAsFile();
                    processAndUploadImage(blob);
                    break;
                }
            }
        });
    }
}

// Función auxiliar para cerrar la navegación móvil
function closeMobileNav() {
    const mobileNav = document.getElementById("mobile-nav");
    const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
    if (mobileNav && mobileMenuToggle) {
        mobileNav.style.display = "none";
        mobileMenuToggle.innerHTML = '<i data-lucide="menu"></i>';
        lucide.createIcons();
    }
}

// ==========================================================================
// PROCESAMIENTO DE IMÁGENES CON IA Y CANVAS (FRONTEND LOCAL)
// ==========================================================================

let removeBackgroundFn = null;

async function processAndUploadImage(file) {
    if (!file) return;

    const loader = document.getElementById("image-processing-loader");
    const loaderText = document.getElementById("image-loader-text");
    const previewContainer = document.getElementById("image-preview-container");
    const previewImage = document.getElementById("form-image-preview");
    const hiddenImageInput = document.getElementById("form-image");

    const removeBgChecked = document.getElementById("form-remove-bg").checked;
    const enhanceChecked = document.getElementById("form-enhance-quality").checked;

    // Mostrar loader
    loader.style.display = "flex";
    previewContainer.style.display = "none";
    loaderText.textContent = "Leyendo imagen...";

    try {
        let processedBlob = file;

        // 1. Remover fondo si está marcado
        if (removeBgChecked) {
            loaderText.textContent = "Iniciando IA (la primera vez puede tardar 10-15s)...";
            if (!removeBackgroundFn) {
                const module = await import("https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm");
                removeBackgroundFn = module.removeBackground;
            }
            
            loaderText.textContent = "Removiendo fondo de la foto con IA local...";
            processedBlob = await removeBackgroundFn(file);
        }

        // 2. Optimizar calidad con Canvas si está marcado
        if (enhanceChecked) {
            loaderText.textContent = "Optimizando nitidez y contraste de estudio...";
            processedBlob = await enhanceImageQuality(processedBlob);
        }

        // 3. Convertir a Base64
        loaderText.textContent = "Generando archivo digital...";
        const base64String = await blobToBase64(processedBlob);
        
        // 4. Guardar en input oculto y mostrar vista previa
        hiddenImageInput.value = base64String;
        previewImage.src = base64String;
        previewContainer.style.display = "block";
        loader.style.display = "none";
        
    } catch (error) {
        console.error("Error al procesar la imagen con IA:", error);
        alert("Ocurrió un error al procesar con IA: " + error.message + ". Cargando imagen original.");
        
        // Fallback: cargar imagen original sin procesar
        try {
            const base64String = await blobToBase64(file);
            hiddenImageInput.value = base64String;
            previewImage.src = base64String;
            previewContainer.style.display = "block";
        } catch (fallbackError) {
            console.error("Error en fallback:", fallbackError);
        }
        loader.style.display = "none";
    }
}

// Optimizar brillo/contraste de la foto mediante Canvas 2D
function enhanceImageQuality(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Filtro de estudio de alta fidelidad:
            // Sube el contraste 12% para separar el producto del fondo
            // Sube la saturación 5% y el brillo 2% para colores más vivos
            ctx.filter = "contrast(1.12) brightness(1.02) saturate(1.05)";
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Exportar a PNG para mantener canal Alpha transparente
            canvas.toBlob((resultBlob) => {
                URL.revokeObjectURL(img.src);
                if (resultBlob) {
                    resolve(resultBlob);
                } else {
                    reject(new Error("No se pudo renderizar la optimización en Canvas"));
                }
            }, "image/png");
        };
        img.onerror = (err) => {
            reject(err);
        };
    });
}

// Convertir Blob a Base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Formatear precios en decimal o entero legible
function formatPrice(price) {
    return price.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Crear enlace personalizado de WhatsApp
function getWhatsAppLink(product) {
    const text = `Hola! Vi en su catálogo web el producto *${product.nombre}* publicado a * $ ${formatPrice(product.precio)}* y me gustaría consultar disponibilidad. Muchas gracias!`;
    const encodedText = encodeURIComponent(text);
    return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedText}`;
}

function populateFormCategoryOptions(selectedCategory = "", selectedSubcategory = "") {
    const catSelect = document.getElementById("form-category-select");
    if (!catSelect) return;
    
    // Obtener todas las categorías únicas
    const categories = [...new Set(state.products.map(p => p.categoria || "Otros"))].filter(c => c.trim() !== "").sort();
    const defaultCategories = ["Audio", "Cargadores", "Celulares", "PC", "Cabello", "Smartwatches", "Soportes", "Vapes", "Hogar"];
    defaultCategories.forEach(cat => {
        if (!categories.includes(cat)) categories.push(cat);
    });
    categories.sort();
    
    catSelect.innerHTML = '<option value="" disabled selected>Seleccione una categoría</option>';
    categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        catSelect.appendChild(option);
    });
    
    // Opción para nueva categoría
    const newCatOpt = document.createElement("option");
    newCatOpt.value = "new_category";
    newCatOpt.textContent = "+ Crear Nueva Categoría...";
    catSelect.appendChild(newCatOpt);
    
    // Listener de cambio
    catSelect.onchange = (e) => {
        const val = e.target.value;
        const newCatGroup = document.getElementById("new-category-group");
        const newCatInput = document.getElementById("form-new-category");
        
        if (val === "new_category") {
            newCatGroup.style.display = "block";
            newCatInput.required = true;
            newCatInput.focus();
            populateFormSubcategoryOptions("new_category", "");
        } else {
            newCatGroup.style.display = "none";
            newCatInput.required = false;
            newCatInput.value = "";
            populateFormSubcategoryOptions(val, "");
        }
    };
    
    // Inicializar valor
    if (selectedCategory) {
        if (categories.includes(selectedCategory)) {
            catSelect.value = selectedCategory;
            document.getElementById("new-category-group").style.display = "none";
            document.getElementById("form-new-category").required = false;
            populateFormSubcategoryOptions(selectedCategory, selectedSubcategory);
        } else {
            catSelect.value = "new_category";
            document.getElementById("form-new-category").value = selectedCategory;
            document.getElementById("new-category-group").style.display = "block";
            document.getElementById("form-new-category").required = true;
            populateFormSubcategoryOptions("new_category", selectedSubcategory);
        }
    } else {
        catSelect.value = "";
        document.getElementById("new-category-group").style.display = "none";
        document.getElementById("form-new-category").required = false;
        populateFormSubcategoryOptions("", "");
    }
}

function populateFormSubcategoryOptions(category, selectedSubcategory = "") {
    const subSelect = document.getElementById("form-subcategory-select");
    if (!subSelect) return;
    
    subSelect.innerHTML = '<option value="" disabled selected>Seleccione subcategoría</option>';
    
    let subcategories = [];
    if (category && category !== "new_category") {
        subcategories = [...new Set(state.products
            .filter(p => p.categoria && p.categoria.toLowerCase() === category.toLowerCase())
            .map(p => p.subcategoria || "Otros")
        )].filter(s => s.trim() !== "").sort();
    }
    
    // Valores predeterminados si está vacía
    if (subcategories.length === 0) {
        if (category === "Audio") subcategories = ["Auriculares", "Parlantes", "Otros Accesorios"];
        else if (category === "Cargadores") subcategories = ["Cargadores", "Cables", "Adaptadores y Otros"];
        else if (category === "Celulares") subcategories = ["Samsung", "Motorola", "Xiaomi", "Nokia", "Otras Marcas", "Tablets"];
        else if (category === "PC") subcategories = ["Mouses", "Teclados", "Mouse Pads y Accesorios"];
        else if (category === "Cabello") subcategories = ["Cortadoras y Afeitadoras", "Planchas", "Secadores y Cepillos"];
        else if (category === "Hogar") subcategories = ["Cámaras y Seguridad", "Iluminación", "Gadgets Varios"];
        else if (category === "Smartwatches") subcategories = ["Relojes", "Correas y Accesorios"];
        else if (category === "Soportes") subcategories = ["Soportes", "Trípodes y Selfies", "Otros"];
        else if (category === "Vapes") subcategories = ["Equipos", "Esencias y Accesorios"];
    }
    
    subcategories.forEach(sub => {
        const option = document.createElement("option");
        option.value = sub;
        option.textContent = sub;
        subSelect.appendChild(option);
    });
    
    const newSubOpt = document.createElement("option");
    newSubOpt.value = "new_subcategory";
    newSubOpt.textContent = "+ Crear Nueva Subcategoría...";
    subSelect.appendChild(newSubOpt);
    
    subSelect.onchange = (e) => {
        const val = e.target.value;
        const newSubGroup = document.getElementById("new-subcategory-group");
        const newSubInput = document.getElementById("form-new-subcategory");
        if (val === "new_subcategory") {
            newSubGroup.style.display = "block";
            newSubInput.required = true;
            newSubInput.focus();
        } else {
            newSubGroup.style.display = "none";
            newSubInput.required = false;
            newSubInput.value = "";
        }
    };
    
    if (selectedSubcategory) {
        if (subcategories.includes(selectedSubcategory)) {
            subSelect.value = selectedSubcategory;
            document.getElementById("new-subcategory-group").style.display = "none";
            document.getElementById("form-new-subcategory").required = false;
        } else {
            subSelect.value = "new_subcategory";
            document.getElementById("form-new-subcategory").value = selectedSubcategory;
            document.getElementById("new-subcategory-group").style.display = "block";
            document.getElementById("form-new-subcategory").required = true;
        }
    } else {
        subSelect.value = "";
        document.getElementById("new-subcategory-group").style.display = "none";
        document.getElementById("form-new-subcategory").required = false;
        document.getElementById("form-new-subcategory").value = "";
    }
}

// Funciones globales para que el HTML y las filas de la tabla puedan invocarlas
window.openEditProductForm = openEditProductForm;
window.deleteProduct = deleteProduct;
window.selectCategoryFromCard = selectCategoryFromCard;

// GESTIÓN DE PUNTOS MANUAL (ADMIN)
window.adminAddPoints = function() {
    const phoneInput = document.getElementById("admin-points-phone").value.trim();
    const amountInput = document.getElementById("admin-points-amount").value.trim();
    const resultBox = document.getElementById("admin-points-result");
    
    if (!phoneInput) {
        alert("Por favor ingresa el número de celular del cliente.");
        return;
    }
    if (!amountInput) {
        alert("Por favor ingresa el monto gastado.");
        return;
    }
    
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
        alert("El monto debe ser un número mayor a 0.");
        return;
    }
    
    const pointsToAdd = Math.floor(amount / 1000);
    
    if (typeof db !== 'undefined' && db) {
        const pointRef = db.ref('points/' + phoneInput);
        pointRef.once('value').then(snapshot => {
            let currentPoints = snapshot.val() || 0;
            let newPoints = currentPoints + pointsToAdd;
            pointRef.set(newPoints);
            showPointsSuccess(resultBox, phoneInput, pointsToAdd, newPoints);
        }).catch(err => {
            console.error("Error al sumar puntos en Firebase", err);
            alert("Error al conectar con la base de datos.");
        });
    } else {
        // Fallback local simulado
        let pointsDB = JSON.parse(localStorage.getItem("paso_celulares_points") || "{}");
        if (!pointsDB[phoneInput]) pointsDB[phoneInput] = 0;
        pointsDB[phoneInput] += pointsToAdd;
        localStorage.setItem("paso_celulares_points", JSON.stringify(pointsDB));
        showPointsSuccess(resultBox, phoneInput, pointsToAdd, pointsDB[phoneInput]);
    }
    
    document.getElementById("admin-points-phone").value = "";
    document.getElementById("admin-points-amount").value = "";
};

function showPointsSuccess(resultBox, phoneInput, pointsToAdd, totalPoints) {
    resultBox.style.display = "block";
    resultBox.innerHTML = `
        <div style="display:flex; align-items:center;">
            <i data-lucide="check-circle" style="width:18px; height:18px; margin-right:8px;"></i> 
            <div>Se sumaron <strong>${pointsToAdd} puntos</strong> al número ${phoneInput}.<br>
            Total acumulado de este cliente: <strong>${totalPoints} pts</strong></div>
        </div>
    `;
        
    if (window.lucide) lucide.createIcons();
    
    // Update list if visible
    if (document.getElementById("admin-clients-list").style.display === "block") {
        renderAdminClients();
    }
    
    setTimeout(() => {
        resultBox.style.display = "none";
    }, 6000);
}

window.toggleAdminClients = function() {
    const listContainer = document.getElementById("admin-clients-list");
    if (listContainer.style.display === "none") {
        listContainer.style.display = "block";
        renderAdminClients();
    } else {
        listContainer.style.display = "none";
    }
};

window.renderAdminClients = function() {
    const tbody = document.getElementById("admin-clients-tbody");
    if (!tbody) return;
    
    tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #666; padding: 20px;">Cargando base de datos...</td></tr>`;
    
    if (typeof db !== 'undefined' && db) {
        db.ref('points').once('value').then(snapshot => {
            const data = snapshot.val() || {};
            renderPointsTableHTML(data, tbody);
        }).catch(err => {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: red; padding: 20px;">Error al leer la nube.</td></tr>`;
        });
    } else {
        let pointsDB = JSON.parse(localStorage.getItem("paso_celulares_points") || "{}");
        renderPointsTableHTML(pointsDB, tbody);
    }
};

function renderPointsTableHTML(pointsDB, tbody) {
    let html = "";
    const sortedClients = Object.keys(pointsDB).map(phone => {
        return { phone: phone, points: pointsDB[phone] };
    }).sort((a, b) => b.points - a.points);
    
    if (sortedClients.length === 0) {
        html = `<tr><td colspan="2" style="text-align: center; color: #666; padding: 20px;">Aún no hay clientes registrados con puntos.</td></tr>`;
    } else {
        sortedClients.forEach(client => {
            html += `
                <tr>
                    <td style="font-weight: 500;">${client.phone}</td>
                    <td><span style="background: #2e7d32; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${client.points} pts</span></td>
                </tr>
            `;
        });
    }
    
    tbody.innerHTML = html;
}

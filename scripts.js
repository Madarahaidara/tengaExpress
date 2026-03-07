// --- BASE DE DONNÉES ---
let DB = JSON.parse(localStorage.getItem('TENGA_DB'));

if (!DB) {
    DB = {
        users: [{ 
            id: "admin", 
            pwd: "admin123", 
            nom: "Admin Tenga", 
            whatsapp: "+226 70 00 00 00",
            history: [] 
        }],
        restaurants: [
            {id: "jaujau", nom: "Chez JAUJAU", img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400", menu: [{n:"Panini", p:600}, {n:"Chawarma", p:1200}]},
            {id: "haidi", nom: "Chez HAÏDI", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400", menu: [{n:"Garba", p:500}, {n:"Placali", p:1500}]},
            {id: "ravy", nom: "Chez Ravy", img: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400", menu: [{n:"Gapal", p:600}, {n:"Yaourt", p:300}]},
            {id: "soleil", nom: "Café SOLEIL", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400", menu: [{n:"Pizza", p:5000}, {n:"Pain", p:500}]}
        ],
        finance: { admin: 0, resto: 0, liv: 0 }
    };
    saveDB();
}

// Données pour stocker les inscriptions
let inscriptionsRestaurants = JSON.parse(localStorage.getItem('inscriptionsRestaurants')) || [];
let inscriptionsLivreurs = JSON.parse(localStorage.getItem('inscriptionsLivreurs')) || [];

let currentUser = null;
let localPanier = [];

function saveDB() { 
    localStorage.setItem('TENGA_DB', JSON.stringify(DB)); 
}

// --- UTILITAIRES ---
function showToast(message, duration = 3000, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    if(type === 'success') toast.style.background = 'var(--success)';
    else if(type === 'error') toast.style.background = 'var(--danger)';
    else toast.style.background = 'var(--dark)';
    
    toast.style.display = 'block';
    toast.style.animation = 'none';
    toast.offsetHeight;
    toast.style.animation = 'slideUpToast 0.3s ease';
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, duration);
}

function showButtonLoader(button, text = 'Chargement...') {
    const originalHTML = button.innerHTML;
    button.innerHTML = `<span class="loader"></span> ${text}`;
    button.disabled = true;
    return function restore() {
        button.innerHTML = originalHTML;
        button.disabled = false;
    };
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge-count');
    const totalItems = localPanier.length;
    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = 'flex';
        badge.classList.add('bounceIn');
        setTimeout(() => badge.classList.remove('bounceIn'), 300);
    } else {
        badge.style.display = 'none';
    }
}

// --- AUTH ---
function toggleAuth() {
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const toggleText = document.getElementById('auth-toggle-text');
    
    loginBox.style.animation = 'fadeOut 0.2s ease';
    registerBox.style.animation = 'fadeOut 0.2s ease';
    
    setTimeout(() => {
        if (loginBox.style.display !== 'none') {
            loginBox.style.display = 'none';
            registerBox.style.display = 'block';
            toggleText.innerHTML = 'Déjà inscrit ? <a href="javascript:toggleAuth()">Se connecter</a>';
        } else {
            loginBox.style.display = 'block';
            registerBox.style.display = 'none';
            toggleText.innerHTML = 'Pas de compte ? <a href="javascript:toggleAuth()">S\'inscrire</a>';
        }
        
        loginBox.style.animation = 'fadeIn 0.3s ease';
        registerBox.style.animation = 'fadeIn 0.3s ease';
    }, 200);
}

function actionRegister() {
    const nom = document.getElementById('reg-name').value.trim();
    const id = document.getElementById('reg-id').value.trim();
    const pwd = document.getElementById('reg-pwd').value;
    const whatsapp = document.getElementById('reg-whatsapp').value.trim();
    const btn = document.getElementById('register-btn');

    if(!nom || !id || !pwd || !whatsapp) {
        showToast("Veuillez remplir tous les champs !", 3000, 'error');
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 500);
        return;
    }

    if (id.length < 3) {
        showToast("L'identifiant doit contenir au moins 3 caractères", 3000, 'error');
        return;
    }

    if (pwd.length < 4) {
        showToast("Le mot de passe doit contenir au moins 4 caractères", 3000, 'error');
        return;
    }

    if(DB.users.find(u => u.id === id)) {
        showToast("Cet identifiant existe déjà.", 3000, 'error');
        return;
    }

    const restore = showButtonLoader(btn, 'Création...');

    setTimeout(() => {
        DB.users.push({ 
            id, 
            pwd, 
            nom, 
            whatsapp,
            history: [] 
        });
        
        saveDB();
        restore();
        
        showToast("Compte créé avec succès ! Connectez-vous maintenant.", 3000, 'success');
        
        document.getElementById('reg-name').value = '';
        document.getElementById('reg-id').value = '';
        document.getElementById('reg-whatsapp').value = '';
        document.getElementById('reg-pwd').value = '';
        
        toggleAuth();
    }, 1500);
}

function actionLogin() {
    const id = document.getElementById('login-id').value.trim();
    const pwd = document.getElementById('login-pwd').value;
    const user = DB.users.find(u => u.id === id && u.pwd === pwd);
    const btn = document.getElementById('login-btn');

    if(!id || !pwd) {
        showToast("Veuillez remplir tous les champs", 3000, 'error');
        return;
    }

    const restore = showButtonLoader(btn, 'Connexion...');

    setTimeout(() => {
        if(user) {
            currentUser = user;
            document.getElementById('auth-overlay').style.display = 'none';
            
            document.getElementById('profile-name-modern').innerText = user.nom;
            document.getElementById('profile-id-modern').innerText = "@" + user.id;
            document.getElementById('profile-avatar-text').innerText = user.nom.charAt(0).toUpperCase();
            document.getElementById('profile-whatsapp-modern').innerText = user.whatsapp;
            
            chargerMarket();
            majHistoriqueUI();
            chargerProfilModerne();
            
            restore();
            showToast("Bienvenue " + user.nom + " !", 3000, 'success');
        } else { 
            restore();
            showToast("Identifiants incorrects.", 3000, 'error');
            btn.classList.add('shake');
            setTimeout(() => btn.classList.remove('shake'), 500);
        }
    }, 1500);
}

function deconnexion() {
    if(confirm("❓ Êtes-vous sûr de vouloir vous déconnecter ?")) {
        currentUser = null;
        localPanier = [];
        document.getElementById('auth-overlay').style.display = 'flex';
        document.getElementById('login-id').value = '';
        document.getElementById('login-pwd').value = '';
        updateCartBadge();
        showToast("Déconnexion réussie", 2000, 'success');
        switchTab('home');
    }
}

// --- RESTAURANTS AVEC QUANTITÉS ---
function chargerMarket() {
    const container = document.getElementById('liste-restos');
    container.innerHTML = DB.restaurants.map((r, index) => `
        <div class="resto-card" style="animation-delay: ${index * 0.1}s">
            <div class="resto-img" style="background-image: url('${r.img}')"></div>
            <div class="resto-info">
                <h3 class="resto-name">${r.nom}</h3>
                <select class="menu-select" id="sel-${r.id}">
                    ${r.menu.map(m => `<option value="${m.p}" data-name="${m.n}">${m.n} - ${m.p} F CFA</option>`).join('')}
                </select>
                
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="changerQuantite('${r.id}', -1, event)">-</button>
                    <input type="number" id="qty-${r.id}" class="quantity-input" value="1" min="1" max="10" readonly>
                    <button class="quantity-btn" onclick="changerQuantite('${r.id}', 1, event)">+</button>
                </div>
                
                <button class="add-to-cart-btn" onclick="ajouterAvecQuantite('${r.id}')" id="btn-${r.id}">
                    <i class="fas fa-cart-plus"></i> AJOUTER AU PANIER
                </button>
            </div>
        </div>`).join('');
}

function changerQuantite(restoId, delta, event) {
    event.preventDefault();
    const input = document.getElementById(`qty-${restoId}`);
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    input.value = val;
    
    const btn = event.target;
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = 'scale(1)', 100);
}

function ajouterAvecQuantite(restoId) {
    const select = document.getElementById(`sel-${restoId}`);
    const quantite = parseInt(document.getElementById(`qty-${restoId}`).value);
    const selectedOption = select.options[select.selectedIndex];
    const plat = selectedOption.text.split(' - ')[0];
    const prix = parseInt(select.value);
    const resto = DB.restaurants.find(r => r.id === restoId).nom;
    const btn = document.getElementById(`btn-${restoId}`);

    btn.classList.add('success');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> AJOUTÉ ✓';
    
    for (let i = 0; i < quantite; i++) {
        localPanier.push({ 
            resto: resto, 
            plat: plat, 
            prix: prix
        });
    }

    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.remove('success');
    }, 1000);

    majPanierUI();
    updateCartBadge();
    showMiniCart();
    showToast(`✅ ${quantite} x ${plat} ajouté au panier`, 2000, 'success');
}

// --- MINI PANIER ---
function showMiniCart() {
    const miniCart = document.getElementById('mini-cart-popup');
    const itemsDiv = document.getElementById('mini-cart-items');
    const totalSpan = document.getElementById('mini-cart-total');
    
    if (localPanier.length === 0) {
        closeMiniCart();
        return;
    }

    const grouped = {};
    localPanier.forEach(item => {
        const key = `${item.resto}-${item.plat}`;
        if (!grouped[key]) {
            grouped[key] = { ...item, quantite: 1 };
        } else {
            grouped[key].quantite++;
        }
    });

    itemsDiv.innerHTML = Object.values(grouped).map(item => `
        <div class="mini-cart-item">
            <span class="mini-cart-item-name">${item.plat}</span>
            <span class="mini-cart-item-qty">x${item.quantite}</span>
            <span class="mini-cart-item-price">${item.prix * item.quantite} F</span>
        </div>
    `).join('');

    const total = localPanier.reduce((acc, item) => acc + item.prix, 0);
    totalSpan.textContent = total + ' F CFA';
    
    miniCart.style.display = 'block';
    
    clearTimeout(window.miniCartTimeout);
    window.miniCartTimeout = setTimeout(() => {
        if (miniCart.style.display === 'block') {
            miniCart.style.display = 'none';
        }
    }, 5000);
}

function closeMiniCart() {
    const miniCart = document.getElementById('mini-cart-popup');
    miniCart.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
        miniCart.style.display = 'none';
        miniCart.style.animation = 'slideInRight 0.3s ease';
    }, 300);
}

function goToCart() {
    closeMiniCart();
    switchTab('cart');
}

// --- PANIER PRINCIPAL ---
function majPanierUI() {
    const div = document.getElementById('cart-list');
    
    if(localPanier.length === 0) { 
        div.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-shopping-cart"></i></div>
                <h3>Votre panier est vide</h3>
                <p>Ajoutez des plats depuis l'accueil</p>
            </div>`;
        document.getElementById('cart-total-area').style.display = 'none'; 
        updateCartBadge();
        return; 
    }

    const grouped = {};
    localPanier.forEach((item, index) => {
        const key = `${item.resto}-${item.plat}`;
        if (!grouped[key]) {
            grouped[key] = { ...item, indices: [index], quantite: 1 };
        } else {
            grouped[key].indices.push(index);
            grouped[key].quantite++;
        }
    });

    div.innerHTML = Object.values(grouped).map((group, index) => `
        <div class="cart-item" style="animation-delay: ${index * 0.1}s">
            <div class="cart-item-info">
                <div class="cart-item-name">${group.plat}</div>
                <div class="cart-item-resto">${group.resto} (x${group.quantite})</div>
            </div>
            <div class="cart-item-price">${group.prix * group.quantite} F</div>
            <div class="cart-item-remove" onclick="supprimerGroupe('${group.plat}')">
                <i class="fas fa-trash-alt"></i>
            </div>
        </div>
    `).join('');
        
    const total = localPanier.reduce((a,b) => a + b.prix, 0);
    document.getElementById('cart-sum').innerText = total;
    document.getElementById('cart-total-area').style.display = 'block';
    updateCartBadge();
}

function supprimerGroupe(plat) {
    if(confirm(`❓ Êtes-vous sûr de vouloir retirer "${plat}" du panier ?`)) {
        localPanier = localPanier.filter(item => item.plat !== plat);
        majPanierUI();
        showToast("🗑️ " + plat + " retiré du panier", 2000);
    }
}

// --- PAIEMENT ---
function showPaymentModal() {
    if (localPanier.length === 0) {
        showToast("Votre panier est vide !", 3000, 'error');
        return;
    }

    const total = localPanier.reduce((a,b) => a + b.prix, 0);
    document.getElementById('payment-amount').innerHTML = total + ' F CFA';
    document.getElementById('payment-modal').style.display = 'flex';
    
    const modal = document.getElementById('payment-modal');
    modal.style.animation = 'none';
    modal.offsetHeight;
    modal.style.animation = 'fadeIn 0.3s ease';
}

function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.animation = 'fadeIn 0.3s ease';
    }, 300);
}

function processPayment(operator) {
    const total = localPanier.reduce((a,b) => a + b.prix, 0);
    const btn = document.getElementById(`payment-${operator}`);
    
    const restore = showButtonLoader(btn, 'Traitement...');
    
    setTimeout(() => {
        DB.finance.admin += total * 0.05;
        DB.finance.liv += total * 0.10;
        DB.finance.resto += total * 0.85;

        const dbUser = DB.users.find(u => u.id === currentUser.id);
        const date = new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        localPanier.forEach(item => {
            dbUser.history.unshift({ 
                ...item, 
                date: date,
                operator: operator
            });
        });

        saveDB();
        majHistoriqueUI();
        
        restore();
        showToast(`✅ Paiement ${getOperatorName(operator)} réussi ! Total: ${total} F`, 3000, 'success');
        
        localPanier = [];
        majPanierUI();
        closePaymentModal();
        switchTab('history');
    }, 2000);
}

function getOperatorName(op) {
    const operators = {
        'orange': 'Orange Money',
        'moov': 'Moov Money',
        'wave': 'Wave',
        'telecel': 'Telecel Money'
    };
    return operators[op] || op;
}

// --- HISTORIQUE ---
function majHistoriqueUI() {
    if (!currentUser) return;
    
    const dbUser = DB.users.find(u => u.id === currentUser.id);
    
    if (!dbUser.history || dbUser.history.length === 0) {
        document.getElementById('history-list').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-history"></i></div>
                <h3>Aucun historique</h3>
                <p>Vos commandes apparaîtront ici</p>
            </div>`;
        return;
    }
    
    document.getElementById('history-list').innerHTML = dbUser.history.map((h, index) => `
        <div class="history-item" style="animation-delay: ${index * 0.1}s">
            <div class="history-date">${h.date}</div>
            <div class="history-resto">${h.resto}</div>
            <div class="history-details">
                <span>${h.plat}</span>
                <span><b>${h.prix} F</b></span>
            </div>
            ${h.operator ? `<div style="font-size:11px; color:var(--bf-green); margin-top:5px;">💰 ${getOperatorName(h.operator)}</div>` : ''}
        </div>`).join('');
}

// --- RECHERCHE AVEC DEBOUNCE ---
let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        filtrerRestos();
    }, 300);
}

function filtrerRestos() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.resto-card');
    
    cards.forEach(card => {
        const name = card.querySelector('.resto-name').textContent.toLowerCase();
        const menu = card.querySelector('.menu-select').textContent.toLowerCase();
        if (name.includes(search) || menu.includes(search)) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.3s ease';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- NAVIGATION ---
function switchTab(tab) {
    const currentScreen = document.querySelector('.screen.active');
    if(currentScreen) {
        currentScreen.style.opacity = '0';
        currentScreen.style.transform = 'translateY(10px)';
    }
    
    setTimeout(() => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const newScreen = document.getElementById('screen-' + tab);
        newScreen.classList.add('active');
        newScreen.style.opacity = '0';
        newScreen.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            newScreen.style.opacity = '1';
            newScreen.style.transform = 'translateY(0)';
        }, 50);
        
        if (tab === 'home') document.getElementById('t-hom').classList.add('active');
        else if (tab === 'cart') document.getElementById('t-car').classList.add('active');
        else if (tab === 'history') document.getElementById('t-his').classList.add('active');
        else if (tab === 'profile') document.getElementById('t-pro').classList.add('active');
        else if (tab === 'inscriptions') {
            document.getElementById('t-pro').classList.add('active');
        }
        
        if (tab === 'cart') majPanierUI();
        if (tab === 'history' && currentUser) majHistoriqueUI();
        if (tab === 'profile') chargerProfilModerne();
        closeMiniCart();
    }, 200);
}

// --- PROFIL MODERNISÉ ---
function chargerProfilModerne() {
    if (!currentUser) return;
    
    const dbUser = DB.users.find(u => u.id === currentUser.id);
    
    document.getElementById('profile-name-modern').textContent = currentUser.nom;
    document.getElementById('profile-id-modern').textContent = '@' + currentUser.id;
    document.getElementById('profile-whatsapp-modern').textContent = currentUser.whatsapp;
    document.getElementById('profile-avatar-text').textContent = currentUser.nom.charAt(0).toUpperCase();
    
    const totalCommandes = dbUser.history?.length || 0;
    const totalDepense = dbUser.history?.reduce((acc, item) => acc + item.prix, 0) || 0;
    const moyennePanier = totalCommandes > 0 ? Math.round(totalDepense / totalCommandes) : 0;
    
    document.getElementById('stat-commandes').textContent = totalCommandes;
    document.getElementById('stat-depense').textContent = totalDepense.toLocaleString() + ' F';
    document.getElementById('stat-moyenne').textContent = moyennePanier.toLocaleString() + ' F';
    
    animerChiffres();
}

function animerChiffres() {
    const stats = document.querySelectorAll('.stat-value-modern');
    stats.forEach(stat => {
        stat.style.transform = 'scale(1.2)';
        setTimeout(() => stat.style.transform = 'scale(1)', 200);
    });
}

function editerProfil() {
    const nouveauNom = prompt("Modifier votre nom complet :", currentUser.nom);
    if (nouveauNom && nouveauNom.trim()) {
        currentUser.nom = nouveauNom.trim();
        const dbUser = DB.users.find(u => u.id === currentUser.id);
        dbUser.nom = currentUser.nom;
        saveDB();
        
        document.getElementById('profile-name-modern').innerText = currentUser.nom;
        document.getElementById('profile-avatar-text').innerText = currentUser.nom.charAt(0).toUpperCase();
        
        showToast("Profil mis à jour !", 2000, 'success');
    }
}

// --- GESTION DES INSCRIPTIONS ---
function showInscriptionRestaurant() {
    document.getElementById('inscription-screen-title').textContent = 'Inscription Restaurant';
    document.getElementById('restaurant-form-screen').style.display = 'block';
    document.getElementById('livreur-form-screen').style.display = 'none';
    switchTab('inscriptions');
    updateRestoProgressScreen();
}

function showInscriptionLivreur() {
    document.getElementById('inscription-screen-title').textContent = 'Inscription Livreur';
    document.getElementById('livreur-form-screen').style.display = 'block';
    document.getElementById('restaurant-form-screen').style.display = 'none';
    switchTab('inscriptions');
    updateLivreurProgressScreen();
}

function updateFileNameScreen(input, displayId, previewId, type) {
    const file = input.files[0];
    const display = document.getElementById(displayId);
    
    if (file) {
        display.textContent = file.name;
        display.classList.add('file-selected');
        display.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name}`;
        
        if (file.type.startsWith('image/') && previewId) {
            const preview = document.getElementById(previewId);
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                preview.classList.add('fadeIn');
            };
            reader.readAsDataURL(file);
        }
        
        const uploadDiv = input.closest('.file-upload-modern');
        uploadDiv.style.borderColor = 'var(--success)';
        uploadDiv.style.background = 'rgba(0, 158, 73, 0.05)';
        
        createConfettiEffect(uploadDiv);
    }
    
    if (type === 'resto') {
        updateRestoProgressScreen();
    } else {
        updateLivreurProgressScreen();
    }
}

function createConfettiEffect(element) {
    for (let i = 0; i < 5; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        element.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 1000);
    }
}

function updateRestoProgressScreen() {
    const fields = [
        document.getElementById('resto-nom-screen')?.value,
        document.getElementById('resto-whatsapp-screen')?.value,
        document.getElementById('resto-proprio-screen')?.value,
        document.getElementById('resto-adresse-screen')?.value,
        document.getElementById('resto-cnib-screen')?.files[0],
        document.getElementById('resto-photo-screen')?.files[0],
        document.getElementById('resto-accept-screen')?.checked
    ];
    
    if (!fields[0]) return;
    
    const filled = fields.filter(f => f && f.toString().trim() !== '').length;
    const progress = (filled / fields.length) * 100;
    const progressBar = document.getElementById('resto-progress-screen');
    const submitBtn = document.getElementById('resto-submit-screen');
    const percentDisplay = document.getElementById('resto-progress-percent-screen');
    
    progressBar.style.width = progress + '%';
    percentDisplay.textContent = Math.round(progress) + '%';
    
    if (progress === 100) {
        progressBar.style.background = 'linear-gradient(90deg, var(--success), var(--bf-green))';
        submitBtn.disabled = false;
        submitBtn.classList.add('pulse');
        showToast('🎉 Formulaire complet !', 2000, 'success');
    } else {
        progressBar.style.background = 'linear-gradient(90deg, var(--bf-red), var(--bf-green))';
        submitBtn.disabled = true;
        submitBtn.classList.remove('pulse');
    }
}

function updateLivreurProgressScreen() {
    const fields = [
        document.getElementById('livreur-nom-screen')?.value,
        document.getElementById('livreur-age-screen')?.value,
        document.getElementById('livreur-quartier-screen')?.value,
        document.getElementById('livreur-whatsapp-screen')?.value,
        document.getElementById('livreur-contact-screen')?.value,
        document.getElementById('livreur-contact-tel-screen')?.value,
        document.getElementById('livreur-cnib-screen')?.files[0],
        document.getElementById('livreur-photo-screen')?.files[0],
        document.getElementById('livreur-accept-screen')?.checked
    ];
    
    if (!fields[0]) return;
    
    const filled = fields.filter(f => f && f.toString().trim() !== '').length;
    const progress = (filled / fields.length) * 100;
    const progressBar = document.getElementById('livreur-progress-screen');
    const submitBtn = document.getElementById('livreur-submit-screen');
    const percentDisplay = document.getElementById('livreur-progress-percent-screen');
    
    progressBar.style.width = progress + '%';
    percentDisplay.textContent = Math.round(progress) + '%';
    
    if (progress === 100) {
        progressBar.style.background = 'linear-gradient(90deg, var(--success), var(--bf-green))';
        submitBtn.disabled = false;
        submitBtn.classList.add('pulse');
        
        const age = parseInt(document.getElementById('livreur-age-screen')?.value);
        if (age < 18) {
            showToast("⚠️ Vous devez avoir au moins 18 ans", 3000, 'warning');
        }
    } else {
        progressBar.style.background = 'linear-gradient(90deg, var(--bf-red), var(--bf-green))';
        submitBtn.disabled = true;
        submitBtn.classList.remove('pulse');
    }
}

function validerInscriptionRestaurantScreen() {
    if (!document.getElementById('resto-accept-screen').checked) {
        showToast("❌ Veuillez accepter les conditions d'inscription", 3000, 'error');
        document.getElementById('resto-accept-screen').parentElement.classList.add('shake');
        setTimeout(() => document.getElementById('resto-accept-screen').parentElement.classList.remove('shake'), 500);
        return;
    }

    const btn = document.getElementById('resto-submit-screen');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<span class="loader"></span> Envoi en cours...';
    btn.disabled = true;
    btn.style.transform = 'scale(0.95)';

    setTimeout(() => {
        const restaurant = {
            nom: document.getElementById('resto-nom-screen').value,
            whatsapp: document.getElementById('resto-whatsapp-screen').value,
            proprio: document.getElementById('resto-proprio-screen').value,
            adresse: document.getElementById('resto-adresse-screen').value,
            cnib: document.getElementById('resto-cnib-screen').files[0]?.name || 'Non fourni',
            photo: document.getElementById('resto-photo-screen').files[0]?.name || 'Non fournie',
            date: new Date().toISOString(),
            statut: 'en_attente',
            userId: currentUser?.id || 'inconnu'
        };

        inscriptionsRestaurants.push(restaurant);
        localStorage.setItem('inscriptionsRestaurants', JSON.stringify(inscriptionsRestaurants));

        btn.innerHTML = '<i class="fas fa-check-circle"></i> ENVOYÉ AVEC SUCCÈS !';
        btn.style.background = 'linear-gradient(135deg, var(--success), var(--bf-green))';
        
        showToast("✅ Demande envoyée ! Un administrateur va valider votre inscription.", 4000, 'success');
        
        setTimeout(() => {
            resetFormScreen('restaurant');
            switchTab('profile');
            btn.innerHTML = originalText;
            btn.disabled = true;
            btn.style.transform = 'scale(1)';
            btn.style.background = '';
        }, 2000);
    }, 2000);
}

function validerInscriptionLivreurScreen() {
    if (!document.getElementById('livreur-accept-screen').checked) {
        showToast("❌ Veuillez accepter les conditions d'inscription", 3000, 'error');
        return;
    }

    const age = parseInt(document.getElementById('livreur-age-screen').value);
    if (age < 18) {
        showToast("❌ Vous devez avoir au moins 18 ans", 3000, 'error');
        document.getElementById('livreur-age-screen').classList.add('shake');
        setTimeout(() => document.getElementById('livreur-age-screen').classList.remove('shake'), 500);
        return;
    }

    const btn = document.getElementById('livreur-submit-screen');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<span class="loader"></span> Envoi en cours...';
    btn.disabled = true;
    btn.style.transform = 'scale(0.95)';

    setTimeout(() => {
        const livreur = {
            nom: document.getElementById('livreur-nom-screen').value,
            age: age,
            quartier: document.getElementById('livreur-quartier-screen').value,
            whatsapp: document.getElementById('livreur-whatsapp-screen').value,
            tel2: document.getElementById('livreur-tel2-screen').value,
            contact: document.getElementById('livreur-contact-screen').value,
            contactTel: document.getElementById('livreur-contact-tel-screen').value,
            cnib: document.getElementById('livreur-cnib-screen').files[0]?.name || 'Non fourni',
            photo: document.getElementById('livreur-photo-screen').files[0]?.name || 'Non fournie',
            vehicule: document.getElementById('livreur-vehicule-screen').value,
            date: new Date().toISOString(),
            statut: 'en_attente',
            userId: currentUser?.id || 'inconnu'
        };

        inscriptionsLivreurs.push(livreur);
        localStorage.setItem('inscriptionsLivreurs', JSON.stringify(inscriptionsLivreurs));

        btn.innerHTML = '<i class="fas fa-check-circle"></i> ENVOYÉ AVEC SUCCÈS !';
        btn.style.background = 'linear-gradient(135deg, var(--success), var(--bf-green))';
        
        showToast("✅ Demande envoyée ! Vous serez contacté sous 24h.", 4000, 'success');
        
        setTimeout(() => {
            resetFormScreen('livreur');
            switchTab('profile');
            btn.innerHTML = originalText;
            btn.disabled = true;
            btn.style.transform = 'scale(1)';
            btn.style.background = '';
        }, 2000);
    }, 2000);
}

function resetFormScreen(type) {
    if (type === 'restaurant') {
        document.getElementById('restaurant-form-screen').reset();
        document.getElementById('resto-progress-screen').style.width = '0%';
        document.getElementById('resto-progress-percent-screen').textContent = '0%';
        document.getElementById('resto-cnib-name-screen').innerHTML = '';
        document.getElementById('resto-photo-name-screen').innerHTML = '';
        document.getElementById('resto-photo-preview-screen').style.display = 'none';
    } else {
        document.getElementById('livreur-form-screen').reset();
        document.getElementById('livreur-progress-screen').style.width = '0%';
        document.getElementById('livreur-progress-percent-screen').textContent = '0%';
        document.getElementById('livreur-cnib-name-screen').innerHTML = '';
        document.getElementById('livreur-photo-name-screen').innerHTML = '';
        document.getElementById('livreur-photo-preview-screen').style.display = 'none';
    }
}

// --- CONTRATS ---
function showFullContract(type) {
    const modal = document.getElementById('contract-modal');
    const body = document.getElementById('contract-body');
    
    if (type === 'restaurant') {
        body.innerHTML = `
            <h4>CONTRAT DE PARTENARIAT RESTAURANT</h4>
            <p>Entre Tenga-Express BF et le restaurant partenaire</p>
            
            <h4>Article 1 : Objet</h4>
            <p>Le présent contrat a pour objet de définir les conditions de collaboration entre Tenga-Express BF et le restaurant pour la livraison de repas.</p>
            
            <h4>Article 2 : Commission</h4>
            <p>La commission Tenga-Express est fixée à 15% du montant total de chaque commande.</p>
            
            <h4>Article 3 : Paiement</h4>
            <p>Les revenus sont versés chaque semaine par Mobile Money.</p>
            
            <h4>Article 4 : Engagement du restaurant</h4>
            <ul>
                <li>Fournir des repas de qualité</li>
                <li>Respecter les délais de préparation</li>
                <li>Maintenir des conditions d'hygiène strictes</li>
                <li>Informer Tenga-Express de tout changement</li>
            </ul>
            
            <h4>Article 5 : Durée</h4>
            <p>Le contrat est valable pour une durée indéterminée, résiliable par l'une ou l'autre des parties avec un préavis de 15 jours.</p>
        `;
    } else {
        body.innerHTML = `
            <h4>CONTRAT DE PARTENARIAT LIVREUR</h4>
            <p>Entre Tenga-Express BF et le livreur partenaire</p>
            
            <h4>Article 1 : Objet</h4>
            <p>Le présent contrat définit les conditions de collaboration pour les services de livraison.</p>
            
            <h4>Article 2 : Rémunération</h4>
            <p>Le livreur perçoit 70% des frais de livraison.</p>
            
            <h4>Article 3 : Disponibilité</h4>
            <p>Le livreur s'engage à être disponible selon ses horaires déclarés.</p>
            
            <h4>Article 4 : Équipement</h4>
            <p>Le livreur doit disposer d'un moyen de locomotion en bon état.</p>
            
            <h4>Article 5 : Obligations</h4>
            <ul>
                <li>Respecter les délais de livraison</li>
                <li>Avoir une tenue correcte</li>
                <li>Traiter les clients avec courtoisie</li>
                <li>Signaler tout incident</li>
            </ul>
            
            <h4>Article 6 : Durée</h4>
            <p>Contrat à durée indéterminée avec période d'essai de 30 jours.</p>
        `;
    }
    
    modal.style.display = 'flex';
}

function closeContractModal() {
    const modal = document.getElementById('contract-modal');
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.animation = 'fadeIn 0.3s ease';
    }, 300);
}

function acceptContract() {
    closeContractModal();
    showToast("Contrat accepté !", 2000, 'success');
}

// --- ADMIN ---
function accesAdmin() {
    const code = prompt("🔐 Code Secret Administrateur :");
    if(code === "2003") {
        const modal = document.getElementById('admin-modal');
        
        const total = DB.finance.admin + DB.finance.resto + DB.finance.liv;
        document.getElementById('adm-total').innerText = Math.round(total) + ' F';
        document.getElementById('adm-admin').innerText = Math.round(DB.finance.admin) + ' F';
        document.getElementById('adm-resto').innerText = Math.round(DB.finance.resto) + ' F';
        document.getElementById('adm-liv').innerText = Math.round(DB.finance.liv) + ' F';
        document.getElementById('adm-users').innerText = DB.users.length;
        
        document.getElementById('adm-resto-demandes').innerText = inscriptionsRestaurants.length;
        document.getElementById('adm-livreur-demandes').innerText = inscriptionsLivreurs.length;
        
        modal.style.display = 'flex';
    } else if(code !== null) {
        showToast("⛔ Code incorrect !", 2000, 'error');
    }
}

function reinitialiserStats() {
    if(confirm("Êtes-vous sûr de vouloir réinitialiser toutes les statistiques ?")) {
        DB.finance = { admin: 0, resto: 0, liv: 0 };
        saveDB();
        showToast("Statistiques réinitialisées !", 2000, 'success');
        document.getElementById('admin-modal').style.display = 'none';
    }
}

// --- INITIALISATION ---
window.onload = function() {
    if (currentUser) {
        document.getElementById('auth-overlay').style.display = 'none';
    }
    chargerMarket();
    
    const style = document.createElement('style');
    style.textContent = `
        .form-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .form-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            background: var(--bf-yellow);
            border-radius: 50%;
            pointer-events: none;
            animation: confetti 1s ease-out;
        }
        
        @keyframes confetti {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(720deg);
                opacity: 0;
            }
        }
        
        .pulse {
            animation: pulse 1s infinite;
        }
        
        .file-selected {
            color: var(--success) !important;
            font-weight: 600;
        }
        
        .file-selected i {
            margin-right: 5px;
        }
        
        .shake {
            animation: shake 0.5s ease;
        }
    `;
    document.head.appendChild(style);
};

// ========== GESTION DES DASHBOARDS ==========

// Données pour les dashboards
let restoData = JSON.parse(localStorage.getItem('restoData')) || {
    commandes: [],
    gains: [],
    note: 4.8,
    status: 'actif'
};

let livreurData = JSON.parse(localStorage.getItem('livreurData')) || {
    livraisons: [],
    gains: [],
    note: 5.0,
    status: 'en ligne'
};

// Initialiser les données de démonstration
function initDemoData() {
    // Commandes restaurant
    if (restoData.commandes.length === 0) {
        restoData.commandes = [
            {
                id: 'CMD001',
                client: 'Oumar S.',
                plats: ['Poulet Braisé', 'Riz'],
                total: 3500,
                status: 'preparation',
                date: new Date().toISOString()
            },
            {
                id: 'CMD002',
                client: 'Aminata D.',
                plats: ['Chawarma', 'Frites'],
                total: 2500,
                status: 'pret',
                date: new Date().toISOString()
            }
        ];
        
        restoData.gains = [
            {
                date: '2024-03-07',
                montant: 25000,
                commission: 3750,
                net: 21250
            }
        ];
    }
    
    // Livraisons livreur
    if (livreurData.livraisons.length === 0) {
        livreurData.livraisons = [
            {
                id: 'LIV001',
                restaurant: 'Chez JAUJAU',
                client: 'Ibrahim K.',
                adresse: 'Ouaga 2000',
                distance: '3.5 km',
                montant: 1000,
                status: 'disponible'
            },
            {
                id: 'LIV002',
                restaurant: 'Chez HAÏDI',
                client: 'Fatou B.',
                adresse: 'Dassasgho',
                distance: '2.1 km',
                montant: 1000,
                status: 'disponible'
            }
        ];
        
        livreurData.gains = [
            {
                date: '2024-03-07',
                jour: 3500,
                semaine: 18500,
                mois: 78500
            }
        ];
    }
    
    localStorage.setItem('restoData', JSON.stringify(restoData));
    localStorage.setItem('livreurData', JSON.stringify(livreurData));
}

// Appeler l'initialisation
initDemoData();

// Fonctions pour le dashboard restaurant
function showRestoDashboard() {
    switchTab('resto-dashboard');
    updateRestoDashboard();
}

function updateRestoDashboard() {
    // Mettre à jour les stats
    const commandesAujourdhui = restoData.commandes.filter(c => {
        const date = new Date(c.date);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }).length;
    
    const chiffreAffaires = restoData.gains.reduce((acc, g) => acc + g.montant, 0);
    const commandesEncours = restoData.commandes.filter(c => c.status === 'preparation').length;
    
    document.getElementById('resto-commandes').textContent = commandesAujourdhui;
    document.getElementById('resto-chiffre').textContent = chiffreAffaires.toLocaleString() + ' F';
    document.getElementById('resto-commandes-encours').textContent = commandesEncours;
    document.getElementById('resto-note').textContent = restoData.note;
    
    document.getElementById('resto-total-ventes').textContent = chiffreAffaires.toLocaleString() + ' F';
    const commission = chiffreAffaires * 0.15;
    document.getElementById('resto-commission').textContent = Math.round(commission).toLocaleString() + ' F';
    document.getElementById('resto-net').textContent = Math.round(chiffreAffaires - commission).toLocaleString() + ' F';
    
    // Afficher les commandes en préparation
    const commandesPreparation = restoData.commandes.filter(c => c.status === 'preparation');
    document.getElementById('resto-count-preparation').textContent = commandesPreparation.length;
    
    const listePreparation = document.getElementById('resto-commandes-liste');
    if (commandesPreparation.length > 0) {
        listePreparation.innerHTML = commandesPreparation.map(cmd => `
            <div class="commande-item">
                <div class="commande-info">
                    <h4>${cmd.client}</h4>
                    <p>${cmd.plats.join(' • ')}</p>
                    <div class="commande-prix">${cmd.total} F</div>
                </div>
                <div class="commande-actions">
                    <button class="btn-commande pret" onclick="marquerPret('${cmd.id}')">
                        <i class="fas fa-check"></i> Prêt
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        listePreparation.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Aucune commande en cours</p>
            </div>
        `;
    }
    
    // Afficher les commandes prêtes
    const commandesPretes = restoData.commandes.filter(c => c.status === 'pret');
    document.getElementById('resto-count-pretes').textContent = commandesPretes.length;
    
    const listePretes = document.getElementById('resto-commandes-pretes');
    if (commandesPretes.length > 0) {
        listePretes.innerHTML = commandesPretes.map(cmd => `
            <div class="commande-item pret">
                <div class="commande-info">
                    <h4>${cmd.client}</h4>
                    <p>${cmd.plats.join(' • ')}</p>
                    <div class="commande-prix">${cmd.total} F</div>
                </div>
                <div class="commande-actions">
                    <span class="badge" style="background: var(--bf-green); color: white;">Prête</span>
                </div>
            </div>
        `).join('');
    } else {
        listePretes.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-smile"></i>
                <p>Aucune commande prête</p>
            </div>
        `;
    }
    
    // Afficher l'historique des paiements
    const paiementsListe = document.getElementById('resto-paiements-liste');
    if (restoData.gains.length > 0) {
        paiementsListe.innerHTML = restoData.gains.map(p => `
            <div class="paiement-item">
                <div>
                    <div class="paiement-date">${p.date}</div>
                    <div class="paiement-montant">${p.net.toLocaleString()} F</div>
                </div>
                <div>
                    <span class="paiement-status effectue">Effectué</span>
                </div>
            </div>
        `).join('');
    } else {
        paiementsListe.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-wallet"></i>
                <p>Aucun paiement pour le moment</p>
            </div>
        `;
    }
}

function marquerPret(commandeId) {
    const commande = restoData.commandes.find(c => c.id === commandeId);
    if (commande) {
        commande.status = 'pret';
        localStorage.setItem('restoData', JSON.stringify(restoData));
        updateRestoDashboard();
        showToast("✅ Commande marquée comme prête", 2000, 'success');
    }
}

// Fonctions pour le dashboard livreur
function showLivreurDashboard() {
    switchTab('livreur-dashboard');
    updateLivreurDashboard();
}

function toggleLivreurStatus() {
    const statusBtn = document.getElementById('livreur-status');
    const isOnline = livreurData.status === 'en ligne';
    
    livreurData.status = isOnline ? 'hors ligne' : 'en ligne';
    localStorage.setItem('livreurData', JSON.stringify(livreurData));
    
    statusBtn.textContent = livreurData.status;
    statusBtn.className = `status-badge ${isOnline ? 'inactive' : 'active'}`;
    
    showToast(isOnline ? "🔴 Vous êtes hors ligne" : "🟢 Vous êtes en ligne", 2000);
    updateLivreurDashboard();
}

function updateLivreurDashboard() {
    // Mettre à jour les stats
    const livraisonsAujourdhui = livreurData.livraisons.filter(l => l.status === 'livre').length;
    const gainsJour = livreurData.gains[0]?.jour || 0;
    
    document.getElementById('livreur-livraisons').textContent = livraisonsAujourdhui;
    document.getElementById('livreur-gains').textContent = gainsJour.toLocaleString() + ' F';
    document.getElementById('livreur-temps').textContent = '25 min';
    document.getElementById('livreur-note').textContent = livreurData.note;
    
    document.getElementById('livreur-gains-jour').textContent = gainsJour.toLocaleString() + ' F';
    document.getElementById('livreur-gains-semaine').textContent = (livreurData.gains[0]?.semaine || 0).toLocaleString() + ' F';
    document.getElementById('livreur-gains-mois').textContent = (livreurData.gains[0]?.mois || 0).toLocaleString() + ' F';
    
    // Livraisons disponibles
    const livraisonsDispo = livreurData.livraisons.filter(l => l.status === 'disponible' && livreurData.status === 'en ligne');
    document.getElementById('livreur-disponibles').textContent = livraisonsDispo.length;
    
    const listeDispo = document.getElementById('livreur-livraisons-dispo');
    if (livraisonsDispo.length > 0 && livreurData.status === 'en ligne') {
        listeDispo.innerHTML = livraisonsDispo.map(liv => `
            <div class="commande-item">
                <div class="commande-info">
                    <h4>${liv.restaurant}</h4>
                    <p>${liv.client} - ${liv.adresse}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${liv.distance}</p>
                    <div class="commande-prix">+${liv.montant} F</div>
                </div>
                <div class="commande-actions">
                    <button class="btn-commande accepter" onclick="accepterLivraison('${liv.id}')">
                        <i class="fas fa-check"></i> Accepter
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        listeDispo.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>${livreurData.status === 'en ligne' ? 'Aucune livraison disponible' : 'Vous êtes hors ligne'}</p>
            </div>
        `;
    }
    
    // Livraisons en cours
    const livraisonsEncours = livreurData.livraisons.filter(l => l.status === 'encours');
    document.getElementById('livreur-encours').textContent = livraisonsEncours.length;
    
    const listeEncours = document.getElementById('livreur-livraisons-encours');
    if (livraisonsEncours.length > 0) {
        listeEncours.innerHTML = livraisonsEncours.map(liv => `
            <div class="commande-item">
                <div class="commande-info">
                    <h4>${liv.restaurant}</h4>
                    <p>${liv.client} - ${liv.adresse}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${liv.distance}</p>
                    <div class="commande-prix">${liv.montant} F</div>
                </div>
                <div class="commande-actions">
                    <button class="btn-commande livrer" onclick="livrerCommande('${liv.id}')">
                        <i class="fas fa-check"></i> Livré
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        listeEncours.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-smile"></i>
                <p>Vous n'avez pas de livraison en cours</p>
            </div>
        `;
    }
    
    // Historique des paiements
    const paiementsListe = document.getElementById('livreur-paiements-liste');
    paiementsListe.innerHTML = `
        <div class="paiement-item">
            <div>
                <div class="paiement-date">${new Date().toLocaleDateString()}</div>
                <div class="paiement-montant">${gainsJour.toLocaleString()} F</div>
            </div>
            <div>
                <span class="paiement-status effectue">Disponible</span>
            </div>
        </div>
        <div class="paiement-item">
            <div>
                <div class="paiement-date">${new Date(Date.now() - 86400000).toLocaleDateString()}</div>
                <div class="paiement-montant">4500 F</div>
            </div>
            <div>
                <span class="paiement-status effectue">Versé</span>
            </div>
        </div>
    `;
}

function accepterLivraison(livraisonId) {
    const livraison = livreurData.livraisons.find(l => l.id === livraisonId);
    if (livraison) {
        livraison.status = 'encours';
        localStorage.setItem('livreurData', JSON.stringify(livreurData));
        updateLivreurDashboard();
        showToast("✅ Livraison acceptée ! Rendez-vous au restaurant", 3000, 'success');
    }
}

function livrerCommande(livraisonId) {
    const livraison = livreurData.livraisons.find(l => l.id === livraisonId);
    if (livraison) {
        livraison.status = 'livre';
        
        // Mettre à jour les gains
        livreurData.gains[0].jour += livraison.montant;
        livreurData.gains[0].semaine += livraison.montant;
        livreurData.gains[0].mois += livraison.montant;
        
        localStorage.setItem('livreurData', JSON.stringify(livreurData));
        updateLivreurDashboard();
        showToast("✅ Livraison terminée ! +" + livraison.montant + " F", 3000, 'success');
    }
}

// ========== GESTION DES VALIDATIONS ADMIN ==========

function validerInscriptions() {
    document.getElementById('admin-modal').style.display = 'none';
    const modal = document.getElementById('validation-modal');
    modal.style.display = 'flex';
    
    chargerValidationRestaurants();
    chargerValidationLivreurs();
}

function closeValidationModal() {
    document.getElementById('validation-modal').style.display = 'none';
}

function switchValidationTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.validation-list').forEach(list => list.style.display = 'none');
    
    if (tab === 'restaurants') {
        document.querySelector('.tab-btn').classList.add('active');
        document.getElementById('validation-restaurants').style.display = 'block';
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('validation-livreurs').style.display = 'block';
    }
}

function chargerValidationRestaurants() {
    const container = document.getElementById('validation-restaurants');
    
    if (inscriptionsRestaurants.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-store"></i><p>Aucune demande en attente</p></div>';
        return;
    }
    
    container.innerHTML = inscriptionsRestaurants.map((resto, index) => `
        <div class="validation-item">
            <div class="validation-info">
                <h4>${resto.nom}</h4>
                <p><i class="fab fa-whatsapp"></i> ${resto.whatsapp}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${resto.adresse}</p>
                <p><i class="fas fa-file-pdf"></i> CNIB: ${resto.cnib}</p>
                <p><i class="fas fa-camera"></i> Photo: ${resto.photo}</p>
            </div>
            <div class="validation-actions">
                <button class="btn-validation accepter" onclick="validerRestaurant(${index})">
                    <i class="fas fa-check"></i> Accepter
                </button>
                <button class="btn-validation refuser" onclick="refuserRestaurant(${index})">
                    <i class="fas fa-times"></i> Refuser
                </button>
            </div>
        </div>
    `).join('');
}

function chargerValidationLivreurs() {
    const container = document.getElementById('validation-livreurs');
    
    if (inscriptionsLivreurs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-motorcycle"></i><p>Aucune demande en attente</p></div>';
        return;
    }
    
    container.innerHTML = inscriptionsLivreurs.map((livreur, index) => `
        <div class="validation-item">
            <div class="validation-info">
                <h4>${livreur.nom}</h4>
                <p><i class="fas fa-calendar"></i> ${livreur.age} ans</p>
                <p><i class="fab fa-whatsapp"></i> ${livreur.whatsapp}</p>
                <p><i class="fas fa-map-pin"></i> ${livreur.quartier}</p>
                <p><i class="fas fa-motorcycle"></i> ${livreur.vehicule}</p>
            </div>
            <div class="validation-actions">
                <button class="btn-validation accepter" onclick="validerLivreur(${index})">
                    <i class="fas fa-check"></i> Accepter
                </button>
                <button class="btn-validation refuser" onclick="refuserLivreur(${index})">
                    <i class="fas fa-times"></i> Refuser
                </button>
            </div>
        </div>
    `).join('');
}

function validerRestaurant(index) {
    const resto = inscriptionsRestaurants[index];
    
    // Ajouter le restaurant à la liste des restaurants
    DB.restaurants.push({
        id: resto.nom.toLowerCase().replace(/\s/g, ''),
        nom: resto.nom,
        img: 'https://images.unsplash.com/photo-1552566624-52f8b3d8b5a4?w=400',
        menu: [{n: "Menu à définir", p: 0}]
    });
    
    // Retirer de la liste des inscriptions
    inscriptionsRestaurants.splice(index, 1);
    localStorage.setItem('inscriptionsRestaurants', JSON.stringify(inscriptionsRestaurants));
    saveDB();
    
    chargerValidationRestaurants();
    showToast("✅ Restaurant validé et ajouté à la plateforme", 3000, 'success');
}

function validerLivreur(index) {
    const livreur = inscriptionsLivreurs[index];
    
    // Ajouter aux utilisateurs comme livreur
    DB.users.push({
        id: livreur.nom.toLowerCase().replace(/\s/g, ''),
        pwd: 'livreur123',
        nom: livreur.nom,
        whatsapp: livreur.whatsapp,
        role: 'livreur',
        history: []
    });
    
    // Retirer de la liste des inscriptions
    inscriptionsLivreurs.splice(index, 1);
    localStorage.setItem('inscriptionsLivreurs', JSON.stringify(inscriptionsLivreurs));
    saveDB();
    
    chargerValidationLivreurs();
    showToast("✅ Livreur validé et ajouté à la plateforme", 3000, 'success');
}

function refuserRestaurant(index) {
    if(confirm("❓ Êtes-vous sûr de vouloir refuser cette inscription ?")) {
        inscriptionsRestaurants.splice(index, 1);
        localStorage.setItem('inscriptionsRestaurants', JSON.stringify(inscriptionsRestaurants));
        chargerValidationRestaurants();
        showToast("Demande refusée", 2000);
    }
}

function refuserLivreur(index) {
    if(confirm("❓ Êtes-vous sûr de vouloir refuser cette inscription ?")) {
        inscriptionsLivreurs.splice(index, 1);
        localStorage.setItem('inscriptionsLivreurs', JSON.stringify(inscriptionsLivreurs));
        chargerValidationLivreurs();
        showToast("Demande refusée", 2000);
    }
}

// ========== MISE À JOUR DE LA NAVIGATION ==========

// Modifier la fonction switchTab pour inclure les nouveaux dashboards
function switchTab(tab) {
    const currentScreen = document.querySelector('.screen.active');
    if(currentScreen) {
        currentScreen.style.opacity = '0';
        currentScreen.style.transform = 'translateY(10px)';
    }
    
    setTimeout(() => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const newScreen = document.getElementById('screen-' + tab);
        newScreen.classList.add('active');
        newScreen.style.opacity = '0';
        newScreen.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            newScreen.style.opacity = '1';
            newScreen.style.transform = 'translateY(0)';
        }, 50);
        
        if (tab === 'home') document.getElementById('t-hom').classList.add('active');
        else if (tab === 'cart') document.getElementById('t-car').classList.add('active');
        else if (tab === 'history') document.getElementById('t-his').classList.add('active');
        else if (tab === 'profile') document.getElementById('t-pro').classList.add('active');
        else if (tab === 'inscriptions' || tab === 'resto-dashboard' || tab === 'livreur-dashboard') {
            document.getElementById('t-pro').classList.add('active');
        }
        
        if (tab === 'cart') majPanierUI();
        if (tab === 'history' && currentUser) majHistoriqueUI();
        if (tab === 'profile') chargerProfilModerne();
        closeMiniCart();
    }, 200);
}
class FitStyleApp {
    constructor() {
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.currentView = 'products';
        this.currentPath = '/';
        this.routes = {
            '/': () => this.showProducts(),
            '/products': () => this.showProducts(),
            '/about': () => this.showAbout(),
            '/profile': () => this.showProfile(),
            '/admin': () => this.showAdminPanel(),
            '/admin/products': () => this.showAdminPanel('products'),
            '/admin/reservations': () => this.showAdminPanel('reservations'),
            '/admin/comments': () => this.showAdminPanel('comments'),
            '/admin/users': () => this.showAdminPanel('users')
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupRouting();
        await this.checkAuthentication();
        await this.handleInitialRoute();
        await this.updateNavigation();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showModal('login'));
        }

        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showModal('register'));
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('/profile');
            });
        }

        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) {
            adminBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('/admin');
            });
        }
    }

    setupRouting() {
        window.addEventListener('popstate', async (event) => {
            await this.handleRoute(event.state?.path || window.location.pathname);
        });
        
        // Intercept navigation clicks
        document.addEventListener('click', async (e) => {
            if (e.target.matches('[data-navigate]')) {
                e.preventDefault();
                const path = e.target.getAttribute('data-navigate');
                await this.navigateTo(path);
            }
        });
    }

    async navigateTo(path, replace = false) {
        this.currentPath = path;
        
        if (replace) {
            history.replaceState({ path }, '', path);
        } else {
            history.pushState({ path }, '', path);
        }
        
        await this.handleRoute(path);
    }

    async handleRoute(path) {
        this.currentPath = path;
        
        if (this.routes[path]) {
            await this.routes[path]();
        } else {
            // Handle dynamic routes or fallback
            if (path.startsWith('/admin/')) {
                const adminTab = path.split('/')[2];
                this.showAdminPanel(adminTab);
            } else if (path.startsWith('/product/')) {
                const productId = path.split('/')[2];
                await this.loadAndShowProduct(productId);
            } else {
                // Default to products page
                this.navigateTo('/products', true);
            }
        }
    }

    async handleInitialRoute() {
        const path = window.location.pathname || '/';
        await this.handleRoute(path);
    }

    getCurrentPath() {
        return this.currentPath;
    }

    updateURL(path) {
        if (this.currentPath !== path) {
            this.currentPath = path;
            history.replaceState({ path }, '', path);
            this.updatePageTitle(path);
        }
    }

    updatePageTitle(path) {
        const baseTitle = 'FitStyle - Brazilian Fitness Fashion';
        let title = baseTitle;
        
        if (path === '/about') {
            title = 'About Us - FitStyle';
        } else if (path === '/profile') {
            title = 'My Profile - FitStyle';
        } else if (path.startsWith('/admin')) {
            const section = path.split('/')[2];
            if (section) {
                title = `Admin ${section.charAt(0).toUpperCase() + section.slice(1)} - FitStyle`;
            } else {
                title = 'Admin Panel - FitStyle';
            }
        } else if (path.startsWith('/product/')) {
            title = 'Product Details - FitStyle';
        }
        
        document.title = title;
    }

    async checkAuthentication() {
        if (this.authToken) {
            try {
                const response = await fetch('/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                } else {
                    localStorage.removeItem('authToken');
                    this.authToken = null;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('authToken');
                this.authToken = null;
            }
        }
    }

    async updateNavigation() {
        const navLinks = document.querySelector('.nav-links');

        if (this.currentUser) {
            const html = await templateManager.render('navigation-auth', {
                username: this.currentUser.username,
                isAdmin: this.currentUser.role === 'admin'
            });
            navLinks.innerHTML = html;
            this.setupEventListeners();
        } else {
            const html = await templateManager.render('navigation-guest');
            navLinks.innerHTML = html;
            this.setupEventListeners();
        }
    }

    async showModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const templateName = type === 'login' ? 'login-modal' : 'register-modal';
        modal.innerHTML = await templateManager.render(templateName);
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        const form = modal.querySelector('form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (type === 'login') {
                this.handleLogin(form);
            } else if (type === 'register') {
                this.handleRegister(form);
            }
            modal.remove();
        });
    }


    async handleLogin(form) {
        const formData = new FormData(form);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                await this.updateNavigation();
                this.showMessage('Login successful!', 'success');
            } else {
                this.showMessage(data.error || 'Login failed', 'error');
            }
        } catch (error) {
            this.showMessage('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                this.authToken = data.token;
                this.currentUser = data.user;
                localStorage.setItem('authToken', this.authToken);
                await this.updateNavigation();
                this.showMessage('Registration successful!', 'success');
            } else {
                this.showMessage(data.error || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showMessage('Registration failed. Please try again.', 'error');
        }
    }

    async logout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        await this.updateNavigation();
        this.showMessage('Logged out successfully', 'success');
        this.navigateTo('/products');
    }

    async loadProducts() {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const products = await response.json();
                await this.displayProducts(products);
            } else {
                await this.displayPlaceholderMessage();
            }
        } catch (error) {
            await this.displayPlaceholderMessage();
        }
    }

    async displayProducts(products) {
        const productsGrid = document.getElementById('products-grid');
        productsGrid.innerHTML = '';

        if (products.length === 0) {
            await this.displayPlaceholderMessage();
            return;
        }

        for (const product of products) {
            const productCard = await this.createProductCard(product);
            productsGrid.appendChild(productCard);
        }
    }

    async createProductCard(product) {
        const card = document.createElement('div');
        
        const html = await templateManager.render('product-card', {
            ...product
        });
        
        card.innerHTML = html;
        return card;
    }

    async viewProduct(productId) {
        // Use navigateTo to properly add to browser history
        await this.navigateTo(`/product/${productId}`);
    }

    async loadAndShowProduct(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
                const product = await response.json();
                this.showProductDetails(product);
            } else {
                this.showMessage('Product not found', 'error');
                // Navigate back to products page if product not found
                await this.navigateTo('/products', true);
            }
        } catch (error) {
            this.showMessage('Error loading product', 'error');
            // Navigate back to products page on error
            await this.navigateTo('/products', true);
        }
    }

    async showProductDetails(product) {
        this.currentView = 'product';
        this.updateURL(`/product/${product.id}`);
        
        const main = document.querySelector('main');
        
        // Clear template cache to ensure fresh templates
        templateManager.clearCache();
        
        // Prepare comments data - Handlebars will handle the iteration
        const comments = product.comments || [];
        
        const html = await templateManager.render('product-details-page', {
            ...product,
            comments: comments,
            showInterestBtn: !!this.currentUser,
            showCommentForm: !!this.currentUser,
            showReplyBtn: !!this.currentUser
        });
        
        main.innerHTML = html;

        const commentForm = document.getElementById('comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addComment(product.id, commentForm);
            });
        }
    }

    async addComment(productId, form) {
        const formData = new FormData(form);
        const commentData = {
            product_id: productId,
            content: formData.get('content')
        };

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(commentData)
            });

            if (response.ok) {
                this.showMessage('Comment added successfully!', 'success');
                this.viewProduct(productId);
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to add comment', 'error');
            }
        } catch (error) {
            this.showMessage('Error adding comment', 'error');
        }
    }

    async showReplyForm(parentId, parentLevel) {
        if (!this.currentUser) {
            this.showMessage('Please login to reply', 'error');
            return;
        }

        // Check if max nesting level reached
        if (parentLevel >= 2) {
            this.showMessage('Maximum reply depth reached', 'error');
            return;
        }

        // Hide any other open reply forms
        document.querySelectorAll('.reply-form-container').forEach(container => {
            container.style.display = 'none';
            container.innerHTML = '';
        });

        const container = document.getElementById(`reply-form-${parentId}`);
        if (!container) return;

        const html = await templateManager.render('reply-form', {
            parentId: parentId
        });
        
        container.innerHTML = html;
        container.style.display = 'block';

        // Setup form submission
        const form = container.querySelector('.comment-reply-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReply(form, parentId);
            });
        }

        // Focus on textarea
        const textarea = container.querySelector('textarea');
        if (textarea) {
            textarea.focus();
        }
    }

    hideReplyForm(parentId) {
        const container = document.getElementById(`reply-form-${parentId}`);
        if (container) {
            container.style.display = 'none';
            container.innerHTML = '';
        }
    }

    async submitReply(form, parentId) {
        const formData = new FormData(form);
        const content = formData.get('content');

        if (!content || content.trim().length === 0) {
            this.showMessage('Reply content cannot be empty', 'error');
            return;
        }

        // Get current product ID from URL
        const productId = this.currentPath.split('/')[2];

        const replyData = {
            product_id: parseInt(productId),
            content: content.trim(),
            parent_id: parseInt(parentId)
        };

        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(replyData)
            });

            if (response.ok) {
                this.showMessage('Reply added successfully!', 'success');
                this.hideReplyForm(parentId);
                this.viewProduct(productId);
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to add reply', 'error');
            }
        } catch (error) {
            this.showMessage('Error adding reply', 'error');
        }
    }

    async showInterestForm(productId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const html = await templateManager.render('interest-modal', {
            userEmail: this.currentUser.email
        });
        modal.innerHTML = html;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        const form = modal.querySelector('#interest-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitInterest(productId, form, modal);
        });
    }

    async submitInterest(productId, form, modal) {
        const formData = new FormData(form);
        const interestData = {
            product_id: productId,
            contact_email: formData.get('contact_email'),
            contact_phone: formData.get('contact_phone'),
            notes: formData.get('notes')
        };

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(interestData)
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage(data.message, 'success');
                modal.remove();
            } else {
                this.showMessage(data.error || 'Failed to register interest', 'error');
            }
        } catch (error) {
            this.showMessage('Error registering interest', 'error');
        }
    }

    async displayPlaceholderMessage() {
        const productsGrid = document.getElementById('products-grid');
        const html = await templateManager.render('placeholder-products');
        productsGrid.innerHTML = html;
    }

    showMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    async showProducts() {
        this.currentView = 'products';
        this.updateURL('/products');
        
        const main = document.querySelector('main');
        const html = await templateManager.render('products-page');
        main.innerHTML = html;
        
        await this.loadProducts();
    }

    async showAbout() {
        this.currentView = 'about';
        this.updateURL('/about');
        
        const main = document.querySelector('main');
        const html = await templateManager.render('about-page');
        main.innerHTML = html;
    }

    async showProfile() {
        if (!this.currentUser) {
            this.showMessage('Please login to view profile', 'error');
            this.navigateTo('/products');
            return;
        }
        
        this.currentView = 'profile';
        this.updateURL('/profile');

        try {
            const reservationsResponse = await fetch('/api/reservations', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const reservations = reservationsResponse.ok ? await reservationsResponse.json() : [];

            const main = document.querySelector('main');
            main.innerHTML = `
                <section class="profile-section">
                    <h2>My Profile</h2>
                    <div class="profile-info">
                        <div class="profile-card">
                            <h3>Account Information</h3>
                            <p><strong>Username:</strong> ${this.currentUser.username}</p>
                            <p><strong>Email:</strong> ${this.currentUser.email}</p>
                            <p><strong>Role:</strong> ${this.currentUser.role}</p>
                            <p><strong>Member since:</strong> ${new Date(this.currentUser.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="profile-card">
                            <h3>My Interest Registrations</h3>
                            ${reservations.length === 0 ?
                    '<p>You haven\'t registered interest in any products yet.</p>' :
                    `<div class="reservations-list">
                                    ${reservations.map(reservation => `
                                        <div class="reservation-item">
                                            <h4>${reservation.product_name}</h4>
                                            <p><strong>Brand:</strong> ${reservation.brand}</p>
                                            <p><strong>Status:</strong> <span class="status-${reservation.status}">${reservation.status}</span></p>
                                            <p><strong>Date:</strong> ${new Date(reservation.created_at).toLocaleDateString()}</p>
                                        </div>
                                    `).join('')}
                                </div>`
                }
                        </div>
                    </div>
                </section>
            `;
        } catch (error) {
            this.showMessage('Error loading profile', 'error');
        }
    }

    // Admin Panel Methods
    showAdminPanel(defaultTab = 'products') {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showMessage('Access denied. Admin privileges required.', 'error');
            this.navigateTo('/products');
            return;
        }
        
        this.currentView = 'admin';
        this.updateURL(`/admin/${defaultTab}`);
        
        const main = document.querySelector('main');
        main.innerHTML = `
            <section class="admin-panel">
                <h2>Admin Panel</h2>
                <div class="admin-tabs">
                    <button class="tab-btn ${defaultTab === 'products' ? 'active' : ''}" data-navigate="/admin/products">Manage Products</button>
                    <button class="tab-btn ${defaultTab === 'reservations' ? 'active' : ''}" data-navigate="/admin/reservations">View Reservations</button>
                    <button class="tab-btn ${defaultTab === 'comments' ? 'active' : ''}" data-navigate="/admin/comments">Manage Comments</button>
                    <button class="tab-btn ${defaultTab === 'users' ? 'active' : ''}" data-navigate="/admin/users">Manage Users</button>
                </div>
                <div id="admin-content">
                    <!-- Content will be loaded here -->
                </div>
            </section>
        `;
        this.showAdminTab(defaultTab);
    }

    showAdminTab(tab) {
        this.updateURL(`/admin/${tab}`);
        
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-navigate="/admin/${tab}"]`).classList.add('active');

        const content = document.getElementById('admin-content');

        switch (tab) {
            case 'products':
                this.showProductsAdmin(content);
                break;
            case 'reservations':
                this.showReservationsAdmin(content);
                break;
            case 'comments':
                this.showCommentsAdmin(content);
                break;
            case 'users':
                this.showUsersAdmin(content);
                break;
        }
    }

    async showProductsAdmin(container) {
        container.innerHTML = `
            <div class="admin-section">
                <div class="admin-header">
                    <h3>Products Management</h3>
                    <button onclick="app.showAddProductForm()" class="btn-primary">Add New Product</button>
                </div>
                <div id="admin-products-list">Loading...</div>
            </div>
        `;

        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const products = await response.json();
                await this.displayAdminProducts(products);
            }
        } catch (error) {
            document.getElementById('admin-products-list').innerHTML = 'Error loading products';
        }
    }

    async displayAdminProducts(products) {
        const list = document.getElementById('admin-products-list');
        
        const html = await templateManager.render('admin-products-table', {
            products: products
        });
        
        list.innerHTML = html;
    }

    showAddProductForm() {
        this.showProductForm(null);
    }

    async editProduct(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (response.ok) {
                const product = await response.json();
                this.showProductForm(product);
            }
        } catch (error) {
            this.showMessage('Error loading product', 'error');
        }
    }

    showProductForm(product = null) {
        const isEdit = product !== null;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
                <form id="product-form">
                    <input type="text" name="name" placeholder="Product Name" value="${product?.name || ''}" required>
                    <textarea name="description" placeholder="Description" required>${product?.description || ''}</textarea>
                    <input type="text" name="brand" placeholder="Brand" value="${product?.brand || ''}" required>
                    <input type="text" name="price" placeholder="Price (e.g., €35)" value="${product?.price || ''}">
                    <input type="text" name="size" placeholder="Size" value="${product?.size || ''}">
                    <input type="text" name="color" placeholder="Color" value="${product?.color || ''}">
                    <input type="url" name="image_url" placeholder="Image URL" value="${product?.image_url || ''}">
                    <button type="submit">${isEdit ? 'Update Product' : 'Add Product'}</button>
                    <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#product-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (isEdit) {
                this.updateProduct(product.id, form, modal);
            } else {
                this.createProduct(form, modal);
            }
        });
    }

    async createProduct(form, modal) {
        const formData = new FormData(form);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            brand: formData.get('brand'),
            price: formData.get('price'),
            size: formData.get('size'),
            color: formData.get('color'),
            image_url: formData.get('image_url')
        };

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                this.showMessage('Product added successfully!', 'success');
                modal.remove();
                this.showAdminTab('products');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to add product', 'error');
            }
        } catch (error) {
            this.showMessage('Error adding product', 'error');
        }
    }

    async updateProduct(productId, form, modal) {
        const formData = new FormData(form);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            brand: formData.get('brand'),
            price: formData.get('price'),
            size: formData.get('size'),
            color: formData.get('color'),
            image_url: formData.get('image_url')
        };

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                this.showMessage('Product updated successfully!', 'success');
                modal.remove();
                this.showAdminTab('products');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to update product', 'error');
            }
        } catch (error) {
            this.showMessage('Error updating product', 'error');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.showMessage('Product deleted successfully!', 'success');
                this.showAdminTab('products');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to delete product', 'error');
            }
        } catch (error) {
            this.showMessage('Error deleting product', 'error');
        }
    }

    async showReservationsAdmin(container) {
        container.innerHTML = `
            <div class="admin-section">
                <h3>Customer Reservations</h3>
                <div id="admin-reservations-list">Loading...</div>
            </div>
        `;

        try {
            const response = await fetch('/api/reservations/all', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const reservations = await response.json();
                this.displayAdminReservations(reservations);
            }
        } catch (error) {
            document.getElementById('admin-reservations-list').innerHTML = 'Error loading reservations';
        }
    }

    displayAdminReservations(reservations) {
        const list = document.getElementById('admin-reservations-list');

        if (reservations.length === 0) {
            list.innerHTML = '<p>No reservations found.</p>';
            return;
        }

        list.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Customer</th>
                        <th>Contact Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${reservations.map(reservation => `
                        <tr>
                            <td>${reservation.product_name} (${reservation.brand})</td>
                            <td>${reservation.username}</td>
                            <td>${reservation.contact_email}</td>
                            <td>${reservation.contact_phone || 'N/A'}</td>
                            <td>${reservation.status}</td>
                            <td>${new Date(reservation.created_at).toLocaleDateString()}</td>
                            <td class="actions">
                                <select onchange="app.updateReservationStatus(${reservation.id}, this.value)">
                                    <option value="pending" ${reservation.status === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="contacted" ${reservation.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                                    <option value="completed" ${reservation.status === 'completed' ? 'selected' : ''}>Completed</option>
                                    <option value="cancelled" ${reservation.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                </select>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    async updateReservationStatus(reservationId, status) {
        try {
            const response = await fetch(`/api/reservations/${reservationId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                this.showMessage('Reservation status updated!', 'success');
            } else {
                this.showMessage('Failed to update status', 'error');
            }
        } catch (error) {
            this.showMessage('Error updating status', 'error');
        }
    }

    async showCommentsAdmin(container) {
        container.innerHTML = `
            <div class="admin-section">
                <h3>Comments Management</h3>
                <div id="admin-comments-list">Loading...</div>
            </div>
        `;

        try {
            const response = await fetch('/api/comments', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const comments = await response.json();
                this.displayAdminComments(comments);
            }
        } catch (error) {
            document.getElementById('admin-comments-list').innerHTML = 'Error loading comments';
        }
    }

    displayAdminComments(comments) {
        const list = document.getElementById('admin-comments-list');

        if (comments.length === 0) {
            list.innerHTML = '<p>No comments found.</p>';
            return;
        }

        list.innerHTML = `
            <div class="comments-admin-filters">
                <label>Filter by status:</label>
                <select id="comment-filter" onchange="app.filterComments()">
                    <option value="all">All Comments</option>
                    <option value="approve">Approved</option>
                    <option value="reject">Rejected</option>
                    <option value="flag">Flagged</option>
                    <option value="pending">Pending</option>
                </select>
            </div>
            <div class="comments-admin-list">
                ${comments.map(comment => `
                    <div class="comment-admin-item" data-status="${comment.status || 'pending'}">
                        <div class="comment-header">
                            <strong>${comment.username}</strong> on <em>${comment.product_name}</em>
                            <span class="comment-date">${new Date(comment.created_at).toLocaleDateString()}</span>
                            <span class="comment-status status-${comment.status || 'pending'}">${comment.status || 'pending'}</span>
                        </div>
                        <div class="comment-content">${comment.content}</div>
                        ${comment.moderation_reason ? `<div class="moderation-reason"><strong>Moderation reason:</strong> ${comment.moderation_reason}</div>` : ''}
                        <div class="comment-actions">
                            <button onclick="app.moderateComment(${comment.id}, 'approve')" class="btn-approve" ${comment.status === 'approve' ? 'disabled' : ''}>Approve</button>
                            <button onclick="app.moderateComment(${comment.id}, 'reject')" class="btn-reject" ${comment.status === 'reject' ? 'disabled' : ''}>Reject</button>
                            <button onclick="app.moderateComment(${comment.id}, 'flag')" class="btn-flag" ${comment.status === 'flag' ? 'disabled' : ''}>Flag</button>
                            <button onclick="app.deleteComment(${comment.id})" class="btn-delete">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async moderateComment(commentId, action) {
        let reason = null;
        if (action === 'reject' || action === 'flag') {
            reason = prompt(`Please provide a reason for ${action}ing this comment:`);
            if (reason === null) return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}/moderate`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ action, reason })
            });

            if (response.ok) {
                this.showMessage(`Comment ${action}ed successfully!`, 'success');
                this.showAdminTab('comments');
            } else {
                const data = await response.json();
                this.showMessage(data.error || `Failed to ${action} comment`, 'error');
            }
        } catch (error) {
            this.showMessage(`Error ${action}ing comment`, 'error');
        }
    }

    filterComments() {
        const filter = document.getElementById('comment-filter').value;
        const comments = document.querySelectorAll('.comment-admin-item');

        comments.forEach(comment => {
            const status = comment.getAttribute('data-status');
            if (filter === 'all' || status === filter) {
                comment.style.display = 'block';
            } else {
                comment.style.display = 'none';
            }
        });
    }

    async deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.showMessage('Comment deleted successfully!', 'success');
                this.showAdminTab('comments');
            } else {
                this.showMessage('Failed to delete comment', 'error');
            }
        } catch (error) {
            this.showMessage('Error deleting comment', 'error');
        }
    }

    async showUsersAdmin(container) {
        container.innerHTML = `
            <div class="admin-section">
                <h3>Users Management</h3>
                <div class="users-admin-filters">
                    <label>Filter by role:</label>
                    <select id="user-filter" onchange="app.filterUsers()">
                        <option value="all">All Users</option>
                        <option value="user">Regular Users</option>
                        <option value="admin">Administrators</option>
                    </select>
                </div>
                <div id="admin-users-list">Loading...</div>
            </div>
        `;

        try {
            const response = await fetch('/api/auth/users', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const users = await response.json();
                this.displayAdminUsers(users);
            }
        } catch (error) {
            document.getElementById('admin-users-list').innerHTML = 'Error loading users';
        }
    }

    displayAdminUsers(users) {
        const list = document.getElementById('admin-users-list');

        if (users.length === 0) {
            list.innerHTML = '<p>No users found.</p>';
            return;
        }

        list.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Comments</th>
                        <th>Reservations</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr data-role="${user.role}" data-user-id="${user.id}">
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>
                                <span class="role-badge role-${user.role}">${user.role}</span>
                            </td>
                            <td>
                                <span class="status-badge ${user.is_active !== 0 ? 'status-active' : 'status-inactive'}">
                                    ${user.is_active !== 0 ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${user.comment_count || 0}</td>
                            <td>${user.reservation_count || 0}</td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                            <td class="actions">
                                ${user.id !== this.currentUser.id ? `
                                    <button onclick="app.editUser(${user.id})" class="btn-edit">Edit</button>
                                    <select onchange="app.updateUserRole(${user.id}, this.value)" class="role-select">
                                        <option value="">Change Role</option>
                                        <option value="user" ${user.role === 'user' ? 'disabled' : ''}>User</option>
                                        <option value="admin" ${user.role === 'admin' ? 'disabled' : ''}>Admin</option>
                                    </select>
                                    <button onclick="app.toggleUserStatus(${user.id}, ${user.is_active === 0})" class="btn-${user.is_active !== 0 ? 'deactivate' : 'activate'}">
                                        ${user.is_active !== 0 ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onclick="app.deleteUser(${user.id})" class="btn-delete">Delete</button>
                                ` : '<span class="current-user">Current User</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    filterUsers() {
        const filter = document.getElementById('user-filter').value;
        const rows = document.querySelectorAll('[data-role]');

        rows.forEach(row => {
            const role = row.getAttribute('data-role');
            if (filter === 'all' || role === filter) {
                row.style.display = 'table-row';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async editUser(userId) {
        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const user = await response.json();
                this.showUserEditForm(user);
            }
        } catch (error) {
            this.showMessage('Error loading user details', 'error');
        }
    }

    showUserEditForm(user) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Edit User</h3>
                <form id="user-edit-form">
                    <input type="text" name="username" placeholder="Username" value="${user.username}" required>
                    <input type="email" name="email" placeholder="Email" value="${user.email}" required>
                    <div class="user-stats">
                        <p><strong>Comments:</strong> ${user.comment_count || 0}</p>
                        <p><strong>Reservations:</strong> ${user.reservation_count || 0}</p>
                        <p><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                    <button type="submit">Update User</button>
                    <button type="button" onclick="this.closest('.modal').remove()">Cancel</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const form = modal.querySelector('#user-edit-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser(user.id, form, modal);
        });
    }

    async updateUser(userId, form, modal) {
        const formData = new FormData(form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email')
        };

        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                this.showMessage('User updated successfully!', 'success');
                modal.remove();
                this.showAdminTab('users');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to update user', 'error');
            }
        } catch (error) {
            this.showMessage('Error updating user', 'error');
        }
    }

    async updateUserRole(userId, newRole) {
        if (!newRole) return;

        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            event.target.value = '';
            return;
        }

        try {
            const response = await fetch(`/api/auth/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                this.showMessage('User role updated successfully!', 'success');
                this.showAdminTab('users');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to update user role', 'error');
            }
        } catch (error) {
            this.showMessage('Error updating user role', 'error');
        }

        event.target.value = '';
    }

    async toggleUserStatus(userId, activate) {
        const action = activate ? 'activate' : 'deactivate';

        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/auth/users/${userId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ is_active: activate })
            });

            if (response.ok) {
                this.showMessage(`User ${action}d successfully!`, 'success');
                this.showAdminTab('users');
            } else {
                const data = await response.json();
                this.showMessage(data.error || `Failed to ${action} user`, 'error');
            }
        } catch (error) {
            this.showMessage(`Error ${action}ing user`, 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will remove all their data.')) {
            return;
        }

        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.showMessage('User deleted successfully!', 'success');
                this.showAdminTab('users');
            } else {
                const data = await response.json();
                this.showMessage(data.error || 'Failed to delete user', 'error');
            }
        } catch (error) {
            this.showMessage('Error deleting user', 'error');
        }
    }
}

const app = new FitStyleApp();

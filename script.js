document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded:', window.location.pathname);

  // Initialize users and logged-in state
  const users = JSON.parse(localStorage.getItem('users')) || [];
  const loggedInUser = localStorage.getItem('loggedInUser');

  // Get cart based on login state
  function getCart() {
    const cartKey = loggedInUser ? `cart_${loggedInUser}` : 'cart_guest';
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  }

  // Save cart
  function saveCart(cart) {
    const cartKey = loggedInUser ? `cart_${loggedInUser}` : 'cart_guest';
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }

  // Update cart count in navbar
  function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.querySelector('#cart-count');
    if (cartCount) {
      cartCount.textContent = totalItems;
    }
  }

  // Calculate item subtotal with discounts
  function calculateSubtotal(item) {
    let price = parseFloat(item.price);
    if (isNaN(price)) {
      console.warn(`Invalid price for item ${item.name}: ${item.price}`);
      return 0;
    }
    if (item.discount) {
      if (item.discount.type === 'percentage') {
        price *= (1 - item.discount.value / 100);
      } else if (item.discount.type === 'buy2get1free' && item.quantity >= 3) {
        const freeItems = Math.floor(item.quantity / 3);
        return (item.quantity - freeItems) * price;
      }
    }
    return item.quantity * price;
  }

  // Update navbar based on login state
  function updateNavbar() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) {
      console.error('Navbar links container not found');
      return;
    }

    if (loggedInUser) {
      const user = users.find(user => user.email === loggedInUser);
      navLinks.innerHTML = `
        <li><a href="index.html" class="${window.location.pathname.includes('index.html') ? 'active' : ''}">Home</a></li>
        <li><a href="products.html" class="${window.location.pathname.includes('products.html') ? 'active' : ''}">Products</a></li>
        <li><a href="offers.html" class="${window.location.pathname.includes('offers.html') ? 'active' : ''}">Offers</a></li>
        <li><a href="cart.html" class="${window.location.pathname.includes('cart.html') ? 'active' : ''}">Cart</a></li>
        <li><a href="profile.html" class="${window.location.pathname.includes('profile.html') ? 'active' : ''}">Profile</a></li>
        <li><a href="#" id="logout">Logout (${user ? user.name : 'User'})</a></li>
      `;
      const logoutLink = document.querySelector('#logout');
      if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('loggedInUser');
          localStorage.removeItem('cart_guest');
          window.location.href = 'login.html';
        });
      }
    } else {
      navLinks.innerHTML = `
        <li><a href="index.html" class="${window.location.pathname.includes('index.html') ? 'active' : ''}">Home</a></li>
        <li><a href="products.html" class="${window.location.pathname.includes('products.html') ? 'active' : ''}">Products</a></li>
        <li><a href="offers.html" class="${window.location.pathname.includes('offers.html') ? 'active' : ''}">Offers</a></li>
        <li><a href="cart.html" class="${window.location.pathname.includes('cart.html') ? 'active' : ''}">Cart</a></li>
        <li><a href="signup.html" class="${window.location.pathname.includes('signup.html') ? 'active' : ''}">Sign Up</a></li>
        <li><a href="login.html" class="${window.location.pathname.includes('login.html') ? 'active' : ''}">Login</a></li>
      `;
    }
  }

  updateNavbar();
  updateCartCount();

  // Profile Page
  const profilePage = document.querySelector('.profile-page');
  if (profilePage) {
    if (!loggedInUser) {
      window.location.href = 'login.html';
      return;
    }

    const user = users.find(user => user.email === loggedInUser);
    const userName = document.querySelector('#user-name');
    const userEmail = document.querySelector('#user-email');
    const orderList = document.querySelector('#order-list');
    const ordersEmpty = document.querySelector('#orders-empty');
    const ordersTable = document.querySelector('.orders-table');
    const errorElement = document.querySelector('#profile-error');

    if (!userName || !userEmail || !orderList || !ordersEmpty || !ordersTable || !errorElement) {
      console.error('Profile elements not found');
      errorElement.textContent = 'Error loading profile page.';
      return;
    }

    // Display user info
    userName.textContent = user ? user.name : 'N/A';
    userEmail.textContent = loggedInUser;

    // Display order history
    const orders = JSON.parse(localStorage.getItem(`orders_${loggedInUser}`)) || [];
    if (orders.length === 0) {
      ordersEmpty.style.display = 'block';
      ordersTable.style.display = 'none';
      return;
    }

    ordersEmpty.style.display = 'none';
    ordersTable.style.display = 'table';

    orders.forEach(order => {
      const itemsSummary = order.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
      const shippingAddress = `${order.shipping.fullName}, ${order.shipping.address}, ${order.shipping.city}, ${order.shipping.state}, ${order.shipping.zip}, ${order.shipping.country}`;
      const date = new Date(order.date).toLocaleDateString();

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.orderId}</td>
        <td>${date}</td>
        <td><span class="toggle-items">View Items</span></td>
        <td>$${parseFloat(order.total).toFixed(2)}</td>
        <td>${shippingAddress}</td>
      `;
      orderList.appendChild(row);

      // Create expandable items details row
      const detailsRow = document.createElement('tr');
      detailsRow.className = 'items-details';
      detailsRow.style.display = 'none';
      detailsRow.innerHTML = `
        <td colspan="5">
          <table class="items-details-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>$${calculateSubtotal(item).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </td>
      `;
      orderList.appendChild(detailsRow);

      // Toggle items details
      const toggleLink = row.querySelector('.toggle-items');
      toggleLink.addEventListener('click', () => {
        const isVisible = detailsRow.style.display === 'table-row';
        detailsRow.style.display = isVisible ? 'none' : 'table-row';
        toggleLink.textContent = isVisible ? 'View Items' : 'Hide Items';
      });
    });
  }

  // Sign Up Form
  const signupForm = document.querySelector('#signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.querySelector('#name')?.value.trim();
      const email = document.querySelector('#email')?.value.trim();
      const password = document.querySelector('#password')?.value;
      const confirmPassword = document.querySelector('#confirm-password')?.value;
      const errorElement = document.querySelector('#signup-error');

      if (!errorElement) {
        console.error('Signup error element not found');
        return;
      }

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        errorElement.textContent = 'All fields are required.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorElement.textContent = 'Please enter a valid email address.';
        return;
      }
      if (password.length < 8) {
        errorElement.textContent = 'Password must be at least 8 characters.';
        return;
      }
      if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match.';
        return;
      }
      if (users.find(user => user.email === email)) {
        errorElement.textContent = 'Email already registered.';
        return;
      }

      // Store user
      users.push({ name, email, password: btoa(password) });
      localStorage.setItem('users', JSON.stringify(users));
      errorElement.textContent = '';
      alert('Registration successful! Please login.');
      window.location.href = 'login.html';
    });
  }

  // Login Form (merge guest cart on login)
  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.querySelector('#email')?.value.trim();
      const password = document.querySelector('#password')?.value;
      const errorElement = document.querySelector('#login-error');

      if (!errorElement) {
        console.error('Login error element not found');
        return;
      }

      const user = users.find(user => user.email === email && user.password === btoa(password));
      if (!user) {
        errorElement.textContent = 'Invalid email or password.';
        return;
      }

      // Merge guest cart with user cart
      const guestCart = JSON.parse(localStorage.getItem('cart_guest')) || [];
      const userCart = JSON.parse(localStorage.getItem(`cart_${email}`)) || [];
      guestCart.forEach(guestItem => {
        const existingItem = userCart.find(item => item.id === guestItem.id);
        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          userCart.push(guestItem);
        }
      });
      localStorage.setItem(`cart_${email}`, JSON.stringify(userCart));
      localStorage.removeItem('cart_guest');

      localStorage.setItem('loggedInUser', email);
      errorElement.textContent = '';
      alert('Login successful!');
      window.location.href = 'index.html';
    });
  }

  // Checkout Page
  const checkoutForm = document.querySelector('#checkout-form');
  if (checkoutForm) {
    // Redirect to login if not logged in
    if (!loggedInUser) {
      window.location.href = 'login.html';
      return;
    }

    function renderOrderSummary() {
      const cart = getCart();
      const orderItemsContainer = document.querySelector('#order-items');
      const orderTotalElement = document.querySelector('#order-total');
      const errorElement = document.querySelector('#checkout-error');

      if (!orderItemsContainer || !orderTotalElement || !errorElement) {
        console.error('Checkout elements not found');
        return;
      }

      orderItemsContainer.innerHTML = '';
      if (cart.length === 0) {
        errorElement.textContent = 'Your cart is empty.';
        orderTotalElement.textContent = '$0.00';
        return;
      }

      let total = 0;
      cart.forEach(item => {
        const subtotal = calculateSubtotal(item);
        total += subtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>$${subtotal.toFixed(2)}</td>
        `;
        orderItemsContainer.appendChild(row);
      });

      orderTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    renderOrderSummary();

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const errorElement = document.querySelector('#checkout-error');
      if (!errorElement) {
        console.error('Checkout error element not found');
        return;
      }

      const cart = getCart();
      if (cart.length === 0) {
        errorElement.textContent = 'Your cart is empty.';
        return;
      }

      // Collect form data
      const fullName = document.querySelector('#full-name')?.value.trim();
      const address = document.querySelector('#address')?.value.trim();
      const city = document.querySelector('#city')?.value.trim();
      const state = document.querySelector('#state')?.value.trim();
      const zip = document.querySelector('#zip')?.value.trim();
      const country = document.querySelector('#country')?.value.trim();
      const cardNumber = document.querySelector('#card-number')?.value.trim();
      const expiry = document.querySelector('#expiry')?.value.trim();
      const cvv = document.querySelector('#cvv')?.value.trim();

      // Validation
      if (!fullName || !address || !city || !state || !zip || !country || !cardNumber || !expiry || !cvv) {
        errorElement.textContent = 'All fields are required.';
        return;
      }
      if (!/^\d{5}$/.test(zip)) {
        errorElement.textContent = 'ZIP code must be 5 digits.';
        return;
      }
      if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
        errorElement.textContent = 'Card number must be 16 digits.';
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(expiry)) {
        errorElement.textContent = 'Expiry date must be MM/YY.';
        return;
      }
      if (!/^\d{3}$/.test(cvv)) {
        errorElement.textContent = 'CVV must be 3 digits.';
        return;
      }

      // Calculate total
      const total = cart.reduce((sum, item) => sum + calculateSubtotal(item), 0);

      // Store order
      const order = {
        orderId: Date.now().toString(),
        date: new Date().toISOString(),
        items: cart,
        total: total.toFixed(2),
        shipping: { fullName, address, city, state, zip, country },
        payment: { last4: cardNumber.slice(-4) }
      };

      const orders = JSON.parse(localStorage.getItem(`orders_${loggedInUser}`)) || [];
      orders.push(order);
      localStorage.setItem(`orders_${loggedInUser}`, JSON.stringify(orders));

      // Clear cart
      saveCart([]);
      updateCartCount();

      errorElement.textContent = '';
      alert('Order placed successfully!');
      window.location.href = 'index.html';
    });
  }

  // Cart Page
  const cartItemsContainer = document.querySelector('#cart-items');
  if (cartItemsContainer) {
    function renderCart() {
      const cart = getCart();
      cartItemsContainer.innerHTML = '';
      const cartEmpty = document.querySelector('#cart-empty');
      const cartTable = document.querySelector('#cart-table');
      const cartTotalElement = document.querySelector('#cart-total');
      const emptyCartButton = document.querySelector('#empty-cart-button');

      if (cart.length === 0) {
        if (cartEmpty) cartEmpty.style.display = 'block';
        if (cartTable) cartTable.style.display = 'none';
        if (cartTotalElement) cartTotalElement.textContent = '$0.00';
        if (emptyCartButton) emptyCartButton.disabled = true;
        return;
      }

      if (cartEmpty) cartEmpty.style.display = 'none';
      if (cartTable) cartTable.style.display = 'table';
      if (emptyCartButton) emptyCartButton.disabled = false;

      let total = 0;
      cart.forEach(item => {
        const subtotal = calculateSubtotal(item);
        total += subtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.name}</td>
          <td>$${parseFloat(item.price).toFixed(2)}${item.discount ? ` (${item.discount.type === 'percentage' ? `${item.discount.value}% off` : 'Buy 2 Get 1 Free'})` : ''}</td>
          <td>
            <div class="quantity-controls">
              <button class="decrement">-</button>
              <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
              <button class="increment">+</button>
            </div>
          </td>
          <td>$${subtotal.toFixed(2)}</td>
          <td><button class="remove-button" data-id="${item.id}">Remove</button></td>
        `;
        cartItemsContainer.appendChild(row);
      });

      if (cartTotalElement) {
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
      }

      // Quantity controls
      document.querySelectorAll('.increment').forEach(button => {
        button.addEventListener('click', () => {
          const input = button.previousElementSibling;
          const id = input.dataset.id;
          const cart = getCart();
          const item = cart.find(item => item.id === id);
          if (item) {
            item.quantity += 1;
            saveCart(cart);
            renderCart();
            updateCartCount();
          }
        });
      });

      document.querySelectorAll('.decrement').forEach(button => {
        button.addEventListener('click', () => {
          const input = button.nextElementSibling;
          const id = input.dataset.id;
          const cart = getCart();
          const item = cart.find(item => item.id === id);
          if (item && item.quantity > 1) {
            item.quantity -= 1;
            saveCart(cart);
            renderCart();
            updateCartCount();
          }
        });
      });

      document.querySelectorAll('.quantity-controls input').forEach(input => {
        input.addEventListener('change', () => {
          const id = input.dataset.id;
          const value = parseInt(input.value);
          if (value < 1) {
            input.value = 1;
            return;
          }
          const cart = getCart();
          const item = cart.find(item => item.id === id);
          if (item) {
            item.quantity = value;
            saveCart(cart);
            renderCart();
            updateCartCount();
          }
        });
      });

      // Remove buttons
      document.querySelectorAll('.remove-button').forEach(button => {
        button.addEventListener('click', () => {
          const id = button.dataset.id;
          let cart = getCart();
          cart = cart.filter(item => item.id !== id);
          saveCart(cart);
          renderCart();
          updateCartCount();
        });
      });
    }

    renderCart();

    // Empty Cart button
    const emptyCartButton = document.querySelector('#empty-cart-button');
    if (emptyCartButton) {
      emptyCartButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to empty your cart?')) {
          saveCart([]);
          renderCart();
          updateCartCount();
          alert('Cart emptied successfully.');
        }
      });
    }
  }

  // Add to Cart
  const cartButtons = document.querySelectorAll('.add-to-cart');
  cartButtons.forEach(button => {
    button.removeEventListener('click', handleCartClick); // Prevent duplicates
    button.addEventListener('click', handleCartClick);
  });

  function handleCartClick() {
  const id = this.dataset.id;
  const name = this.dataset.product;
  const price = parseFloat(this.dataset.price);
  const page = window.location.pathname;
  if (!id || !name || isNaN(price)) {
    const errors = [];
    if (!id) errors.push('missing data-id');
    if (!name) errors.push('missing data-product');
    if (isNaN(price)) errors.push(`invalid data-price: "${this.dataset.price}"`);
    console.error(`Invalid cart item on ${page}:`, { id, name, price, errors });
    alert(`Error adding product to cart on ${page}. Issues: ${errors.join(', ')}. Please check the product details.`);
    return;
  }

    let discount = null;
    if (window.location.pathname.includes('offers.html')) {
      if (id === 'fountain-pen') {
        discount = { type: 'percentage', value: 40 };
      } else if (id === 'notebook') {
        discount = { type: 'buy2get1free' };
      } else if (id === 'markers') {
        discount = { type: 'percentage', value: 25 };
      } else if (id === 'sticker-set') {
        discount = { type: 'percentage', value: 50 };
      }
    }

    let cart = getCart();
    const existingItem = cart.find(item => item.id === id && JSON.stringify(item.discount || {}) === JSON.stringify(discount || {}));
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({ id, name, price, quantity: 1, discount });
    }
    saveCart(cart);
    updateCartCount();
    alert(`Added ${name} to cart!`);
  }

  // Countdown Timer
  const timerElement = document.querySelector('#timer');
  if (timerElement) {
    const offersGrid = document.querySelector('#offers-grid');
    const offersExpired = document.querySelector('#offers-expired');
    const endDate = new Date('2025-06-05T23:59:59+09:00').getTime();

    function updateTimer() {
      const now = new Date().getTime();
      const timeLeft = endDate - now;

      if (timeLeft <= 0) {
        timerElement.innerHTML = '0 Days 0 Hours 0 Minutes 0 Seconds';
        if (offersGrid) offersGrid.style.display = 'none';
        if (offersExpired) offersExpired.style.display = 'block';
        return;
      }

      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      const daysElement = document.querySelector('#days');
      const hoursElement = document.querySelector('#hours');
      const minutesElement = document.querySelector('#minutes');
      const secondsElement = document.querySelector('#seconds');

      if (daysElement) daysElement.textContent = days;
      if (hoursElement) hoursElement.textContent = hours;
      if (minutesElement) minutesElement.textContent = minutes;
      if (secondsElement) secondsElement.textContent = seconds;
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // Search Bar
  const searchInput = document.querySelector('#search-input');
  const searchButton = document.querySelector('#search-button');
  const productsList = document.querySelector('#products-list');
  const noResults = document.querySelector('#no-results');

  function filterProducts(query) {
    if (!productsList) return;

    console.log('Filtering products with query:', query);
    const lowerQuery = query.trim().toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;

    productCards.forEach(card => {
      const productName = card.querySelector('h3')?.textContent.toLowerCase() || '';
      if (productName.includes(lowerQuery)) {
        card.style.display = 'block';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    console.log('Visible products:', visibleCount);
  }

  if (searchInput && searchButton) {
    searchButton.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (productsList) {
        filterProducts(query);
      } else if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (productsList) {
          filterProducts(query);
        } else if (query) {
          window.location.href = `products.html?search=${encodeURIComponent(query)}`;
        }
      }
    });

    searchInput.addEventListener('input', () => {
      if (productsList) {
        filterProducts(searchInput.value);
      }
    });

    if (productsList) {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('search') || '';
      if (query) {
        searchInput.value = decodeURIComponent(query);
        filterProducts(query);
      }
    }
  }

  // Carousel
  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevButton = document.querySelector('.carousel-prev');
    const nextButton = document.querySelector('.carousel-next');
    let currentIndex = 0;

    function showSlide(index) {
      if (index >= slides.length) {
        currentIndex = 0;
      } else if (index < 0) {
        currentIndex = slides.length - 1;
      } else {
        currentIndex = index;
      }
      carouselContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });
    }

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        showSlide(currentIndex - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        showSlide(currentIndex + 1);
      });
    }

    setInterval(() => {
      showSlide(currentIndex + 1);
    }, 5000);
  }
});
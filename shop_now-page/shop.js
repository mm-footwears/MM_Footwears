document.addEventListener('DOMContentLoaded', () => {
  const formatPrice = amount =>
    new Intl.NumberFormat('en-NG').format(amount);

  /* =========================
     USER SESSION
  ========================== */
  const USER_ID_KEY = 'mm_user_id';
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = 'MM-' + crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  const CART_KEY = `mm_cart_${userId}`;
  const getCart = () => JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const saveCart = cart => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  /* =========================
     DOM ELEMENTS
  ========================== */
  const shoeContainer = document.getElementById('shoe_container');
  const cartIcon = document.getElementById('cart-icon');
  const cartPopup = document.getElementById('cart-popup');
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');
  const paymentModal = document.getElementById('payment-modal');
  const bankStep = document.getElementById('account-step');
  const contactStep = document.getElementById('upload-step');
  const payBtn = document.getElementById('pay-btn');
  const nextBtn = document.getElementById('paid-btn');

  /* =========================
     SHOE DETAIL OVERLAY
  ========================== */
  const overlay = document.getElementById('shoe-overlay');
  const overlayImg = document.getElementById('overlay-img');
  const overlayName = document.getElementById('overlay-name');
  const overlayPrice = document.getElementById('overlay-price');
  const overlayInfo = document.getElementById('overlay-info');
  const overlayBuyBtn = document.getElementById('overlay-buy-btn');
  const overlayCloseBtn = document.getElementById('overlay-close-btn');

  let currentOverlayShoe = null;

  function openOverlay(shoe) {
    currentOverlayShoe = shoe;

    // Show loading state first
    overlayImg.src = '';
    overlayImg.classList.add('loading-img');

    // Load full HD image
    const fullUrl = shoe.image.replace('/upload/', '/upload/w_1080,q_auto,f_auto/');
    const tempImg = new Image();
    tempImg.onload = () => {
      overlayImg.src = fullUrl;
      overlayImg.classList.remove('loading-img');
    };
    tempImg.onerror = () => {
      overlayImg.src = shoe.image;
      overlayImg.classList.remove('loading-img');
    };
    tempImg.src = fullUrl;

    overlayName.textContent = shoe.name;
    overlayPrice.textContent = `₦${formatPrice(shoe.price)}`;
    overlayInfo.textContent = shoe.info || '';

    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    currentOverlayShoe = null;
  }

  overlayCloseBtn.addEventListener('click', closeOverlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeOverlay();
  });

  overlayBuyBtn.addEventListener('click', () => {
    if (currentOverlayShoe) {
      addToCart(currentOverlayShoe);
      closeOverlay();
      alert('Item added to your cart');
    }
  });

  /* =========================
     FETCH SHOES
  ========================== */
  const RAILWAY_API = 'https://mm-footwears-admintwo-production.up.railway.app';
  const CACHE_KEY = 'mm_shoes_cache';
  const CACHE_TIME_KEY = 'mm_shoes_cache_time';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async function fetchShoes() {
    // Try cache first for instant load
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const now = Date.now();

    if (cached && cachedTime && (now - Number(cachedTime)) < CACHE_TTL) {
      renderShoes(JSON.parse(cached));
      // Refresh in background silently
      refreshShoesInBackground();
      return;
    }

    shoeContainer.innerHTML = `<p style="text-align:center;color:hsl(0,0%,60%);">Loading shoes...</p>`;

    try {
      const res = await fetch(`${RAILWAY_API}/api/shoes`);
      const shoes = await res.json();

      localStorage.setItem(CACHE_KEY, JSON.stringify(shoes));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));

      renderShoes(shoes);
    } catch (err) {
      console.error(err);
      // If cache exists but expired, still show it
      if (cached) {
        renderShoes(JSON.parse(cached));
        return;
      }
      shoeContainer.innerHTML = `<p style="text-align:center;color:red;">Failed to load shoes. Please refresh.</p>`;
    }
  }

  async function refreshShoesInBackground() {
    try {
      const res = await fetch(`${RAILWAY_API}/api/shoes`);
      const shoes = await res.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify(shoes));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      renderShoes(shoes);
    } catch (err) {
      // silent fail — cached version already showing
    }
  }

  function renderShoes(shoes) {
    if (!shoes.length) {
      shoeContainer.innerHTML = `<h1 style="margin:auto;color:hsl(0,0%,60%);">NO SHOES AVAILABLE AT THIS MOMENT</h1>`;
      return;
    }

    shoeContainer.innerHTML = '';
    shoes.forEach(shoe => {
      const box = document.createElement('div');
      box.className = 'shoeBoxesElement';

      // Compressed 480p thumbnail for fast card loading
      const thumbUrl = shoe.image.replace('/upload/', '/upload/w_480,q_auto,f_auto/');

      box.innerHTML = `
        <div id="shoeIMG-Container">
          <img src="${thumbUrl}" loading="lazy" alt="${shoe.name}">
        </div>
        <p id="name">${shoe.name}</p>
        <p id="price">₦${formatPrice(shoe.price)}</p>
        <p id="info">${shoe.info}</p>
        <button class="buy-BTN">Buy Now</button>
      `;

      // Click anywhere on card (except buy button) opens overlay
      box.addEventListener('click', (e) => {
        if (!e.target.classList.contains('buy-BTN')) {
          openOverlay(shoe);
        }
      });

      box.querySelector('.buy-BTN').onclick = (e) => {
        e.stopPropagation();
        addToCart(shoe);
        alert('Item added to your cart');
      };

      shoeContainer.appendChild(box);
    });
  }

  fetchShoes();

  /* =========================
     CART LOGIC
  ========================== */
  function addToCart(shoe) {
    const cart = getCart();
    cart.push(shoe);
    saveCart(cart);
    renderCart();
  }

  function renderCart() {
    const cart = getCart();
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
      total += Number(item.price);
      const row = document.createElement('div');
      row.innerHTML = `
        <span>${item.name} — ₦<a id="cart-prices">${formatPrice(item.price)}</a></span>
        <button id="remove-BTN">Remove Item ✖</button>
      `;
      row.querySelector('button').onclick = () => {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
      };
      cartItems.appendChild(row);
    });

    cartCount.textContent = cart.length;
    cartTotal.textContent = `Total: ₦${formatPrice(total)}`;
  }

  renderCart();

  /* =========================
     UI FLOW
  ========================== */
  cartIcon.onclick = (e) => {
    e.stopPropagation();
    cartPopup.classList.toggle('hidden');
    paymentModal.classList.add('hidden');
  };

  cartPopup.onclick = (e) => e.stopPropagation();

  payBtn.onclick = () => {
    cartPopup.classList.add('hidden');
    paymentModal.classList.remove('hidden');
    bankStep.classList.remove('hidden');
    contactStep.classList.add('hidden');
  };

  nextBtn.onclick = () => {
    bankStep.classList.add('hidden');
    contactStep.classList.remove('hidden');

    const paymentMessage = generatePaymentMessage();

    emailjs.send('service_114saii', 'template_46vdtk5', {
      subject: 'New Payment - M&M Footwears',
      time: new Date().toLocaleString(),
      message: paymentMessage
    })
    .then(() => console.log('Payment email sent successfully'))
    .catch(err => console.error('Email failed:', err));
  };

  document.addEventListener('click', (e) => {
    if (cartPopup.classList.contains('hidden')) return;
    if (!cartPopup.contains(e.target) && !cartIcon.contains(e.target)) {
      cartPopup.classList.add('hidden');
    }
  });

  // Copy account number
  const copyBtn = document.getElementById('copyBTN');
  const accountNumEl = document.getElementById('AccountNum');

  copyBtn.addEventListener('click', async () => {
    const accountNumber = accountNumEl.textContent.trim();
    try {
      await navigator.clipboard.writeText(accountNumber);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    } catch (err) {
      const tempInput = document.createElement('input');
      tempInput.value = accountNumber;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    }
  });

  /* =========================
     PAYMENT MESSAGE
  ========================== */
  function generatePaymentMessage() {
    const cart = getCart();
    if (!cart.length) return '';

    const itemMap = {};
    let total = 0;

    cart.forEach(item => {
      total += Number(item.price);
      if (!itemMap[item.name]) {
        itemMap[item.name] = { qty: 1, price: Number(item.price), info: item.info || 'No description' };
      } else {
        itemMap[item.name].qty += 1;
        itemMap[item.name].price += Number(item.price);
      }
    });

    const itemsText = Object.entries(itemMap)
      .map(([name, data]) => `${name} - ${data.info}(${data.qty}-[₦${formatPrice(data.price)}])`)
      .join(', ');

    return `M&M Purchase - A customer just made a payment from your shoe site.

    Items: [${itemsText}]

    Total = ₦${formatPrice(total)}.

    You should receive a message from them soon.`;
  }
});

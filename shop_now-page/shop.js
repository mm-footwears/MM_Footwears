document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     USER SESSION (NO CLASH)
  ========================== */
  const USER_ID_KEY = 'mm_user_id';
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = 'MM-' + crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  const CART_KEY = `mm_cart_${userId}`;

  const getCart = () =>
    JSON.parse(localStorage.getItem(CART_KEY)) || [];

  const saveCart = cart =>
    localStorage.setItem(CART_KEY, JSON.stringify(cart));

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
     FETCH SHOES
  ========================== */
  fetch('https://mm-footwears-admin.onrender.com/api/shoes')
    .then(res => res.json())
    .then(shoes => {
      shoeContainer.innerHTML = '';

      if (!shoes.length) {
        shoeContainer.innerHTML =
          `<h1 style="margin:auto;">NO SHOES AVAILABLE AT THIS MOMENT</h1>`;
        return;
      }

      shoes.forEach(shoe => {
        const box = document.createElement('div');
        box.className = 'shoeBoxesElement';

        box.innerHTML = `
          <div id="shoeIMG-Container">
            <img src="${shoe.image}">
          </div>
          <p id="name">${shoe.name}</p>
          <p id="price">₦${shoe.price}</p>
          <p id="info">${shoe.info}</p>
          <button class="buy-BTN">Buy Now</button>
        `;

        box.querySelector('.buy-BTN').onclick = () => {
          addToCart(shoe);
          alert("Item added to your cart");
        };

        shoeContainer.appendChild(box);
      });
    });

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
        <span>${item.name} — ₦ <a id="cart-prices">${item.price}</a></span>
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
    cartTotal.textContent = `Total: ₦${total}`;
  }

  renderCart();

  /* =========================
     UI FLOW
  ========================== */
  cartIcon.onclick = (e) => {
    e.stopPropagation(); // prevents immediate close
    cartPopup.classList.toggle('hidden');
    paymentModal.classList.add('hidden');
  };

  cartPopup.onclick = (e) => {
    e.stopPropagation();
  };


  payBtn.onclick = () => {
    cartPopup.classList.add('hidden');
    paymentModal.classList.remove('hidden');
    bankStep.classList.remove('hidden');
    contactStep.classList.add('hidden');
  };

  nextBtn.onclick = () => {
    bankStep.classList.add('hidden');
    contactStep.classList.remove('hidden');
  };


  document.addEventListener('click', (e) => {
    if (cartPopup.classList.contains('hidden')) return;

    const clickedInsideCart = cartPopup.contains(e.target);
    const clickedCartIcon = cartIcon.contains(e.target);

    if (!clickedInsideCart && !clickedCartIcon) {
      cartPopup.classList.add('hidden');
    }
  });

  const copyBtn = document.getElementById('copyBTN');
  const accountNumEl = document.getElementById('AccountNum');

  copyBtn.addEventListener('click', async () => {
    const accountNumber = accountNumEl.textContent.trim();

    try {
      await navigator.clipboard.writeText(accountNumber);
      copyBtn.textContent = 'Copied!';
      
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    } catch (err) {
      // Fallback for older browsers
      const tempInput = document.createElement('input');
      tempInput.value = accountNumber;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);

      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    }
  });
});
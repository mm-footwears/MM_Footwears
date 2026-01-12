document.addEventListener('DOMContentLoaded', () => {
  const formatPrice = amount =>
  new Intl.NumberFormat('en-NG').format(amount);
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
  async function fetchShoes() {
    shoeContainer.innerHTML = `<p style="text-align:center;">Loading shoes... Pls wait</p>`;
    
    try {
      const res = await fetch('https://mm-footwears-admin.onrender.com/api/shoes');
      const shoes = await res.json();

      if (!shoes.length) {
        shoeContainer.innerHTML = `<h1 style="margin:auto;">NO SHOES AVAILABLE AT THIS MOMENT</h1>`;
        return;
      }

      shoeContainer.innerHTML = '';
      shoes.forEach(shoe => {
        const box = document.createElement('div');
        box.className = 'shoeBoxesElement';
        box.innerHTML = `
          <div id="shoeIMG-Container"><img src="${shoe.image}" loading="lazy"></div>
          <p id="name">${shoe.name}</p>
          <p id="price">₦${formatPrice(shoe.price)}</p>
          <p id="info">${shoe.info}</p>
          <button class="buy-BTN">Buy Now</button>
        `;
        box.querySelector('.buy-BTN').onclick = () => {
          addToCart(shoe);
          alert("Item added to your cart");
        };
        shoeContainer.appendChild(box);
      });

    } catch (err) {
      console.error(err);
      shoeContainer.innerHTML = `<p style="text-align:center;color:red;">Failed to load shoes. Please try again.</p>`;
    }
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
        <span>
          ${item.name} — ₦
          <a id="cart-prices">${formatPrice(item.price)}</a>
        </span>

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
    // cartTotal.textContent = `Total: ₦${total}`;
    cartTotal.textContent = `Total: ₦${formatPrice(total)}`;
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

    const paymentMessage = generatePaymentMessage();

    emailjs.send(
      'service_114saii',
      'template_46vdtk5',
      {
        subject: 'New Payment - M&M Footwears',
        time: new Date().toLocaleString(),
        message: paymentMessage
      }
    )

    // console.log(paymentMessage)

  .then(() => {
    console.log('Payment email sent successfully');
  })
  .catch(err => {
    console.error('Email failed:', err);
  });
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








  function generatePaymentMessage() {
  const cart = getCart();

  if (!cart.length) return '';

  const itemMap = {};
  let total = 0;

  cart.forEach(item => {
    total += Number(item.price);

    if (!itemMap[item.name]) {
      itemMap[item.name] = {
        qty: 1,
        price: Number(item.price),
        info: item.info || 'No description'
      };
    } else {
      itemMap[item.name].qty += 1;
      itemMap[item.name].price += Number(item.price);
    }
  });

  const itemsText = Object.entries(itemMap)
    .map(([name, data]) =>
      `${name} - ${data.info}(${data.qty}-[₦${formatPrice(data.price)}])`
    )
    .join(', ');

  return `M&M Purchase - A customer just made a payment from your shoe site.

    Items: [${itemsText}]

    Total = ₦${formatPrice(total)}.

    You should recieve a message from them soon.`;
  }
});

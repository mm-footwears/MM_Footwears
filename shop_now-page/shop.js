// document.addEventListener('DOMContentLoaded', () => {
//   const shoeContainer = document.getElementById('shoe_container');
//   const cartIcon = document.getElementById('cart-icon');
//   const cartPopup = document.getElementById('cart-popup');
//   const cartItemsDiv = document.getElementById('cart-items');
//   const cartCount = document.getElementById('cart-count');
//   const cartTotal = document.getElementById('cart-total');

//   const paymentModal = document.getElementById('payment-modal');
//   const paidBtn = document.getElementById('paid-btn');
//   const uploadSection = document.getElementById('upload-section');
//   const continueBtn = document.getElementById('continue-btn');

//   let cart = [];

//   // FETCH SHOES
//   fetch('http://localhost:3000/api/shoes')
//     .then(res => res.json())
//     .then(shoes => {
//       shoeContainer.innerHTML = '';

//       if (!shoes.length) {
//         shoeContainer.innerHTML =
//           `<h1 style="margin:auto;">NO SHOES AVAILABLE AT THIS MOMENT</h1>`;
//         return;
//       }

//       shoes.forEach(shoe => {
//         const div = document.createElement('div');
//         // div.className = 'shoeBoxesElement';
//         div.classList.add('shoeBoxesElement');
//         div.innerHTML = `
//           <div id="shoeIMG-Container">
//             <img src="${shoe.image}">
//           </div>
//           <p id="price">₦${shoe.price}</p>
//           <p id="info">Info: ${shoe.info}</p>
//           <button class="buy-BTN">Buy Now</button>
//         `;

//         div.querySelector('.buy-BTN').onclick = () => addToCart(shoe);
//         shoeContainer.appendChild(div);
//       });
//     });

//   function addToCart(shoe) {
//     cart.push(shoe);
//     updateCart();
//   }

//   function updateCart() {
//     cartItemsDiv.innerHTML = '';
//     let total = 0;

//     cart.forEach((item, i) => {
//       total += item.price;
//       cartItemsDiv.innerHTML += `
//         <div>
//           <span>₦${item.price}</span>
//           <button onclick="removeItem(${i})">✖</button>
//         </div>
//       `;
//     });

//     cartCount.textContent = cart.length;
//     cartTotal.textContent = `Total: ₦${total}`;
//   }

//   window.removeItem = index => {
//     cart.splice(index, 1);
//     updateCart();
//   };

//   cartIcon.onclick = () => cartPopup.classList.toggle('hidden');

//   document.getElementById('pay-btn').onclick = () => {
//     paymentModal.classList.remove('hidden');
//   };

//   paidBtn.onclick = () => {
//     uploadSection.classList.remove('hidden');
//   };

//   continueBtn.onclick = () => {
//     alert('Attach your payment screenshot to mmFootwears email (or reach to us on contact page with your screenshot)');

//     // EMAIL
//     window.location.href =
//       `mailto:mmfootwears231@gmail.com?subject=I%20Just%20Made%20a%20Payment%20(MMFootwears)&body=Please%20find%20my%20payment%20screenshot%20attached.`;

//     // WHATSAPP
//     // window.open(
//     //   'https://wa.me/234XXXXXXXXXX?text=Hello%20MM%20Footwears,%20I%20just%20made%20a%20payment.%20Screenshot%20attached.',
//     //   '_blank'
//     // );
//   };
// });

document.addEventListener('DOMContentLoaded', () => {
  const shoeContainer = document.getElementById('shoe_container');
  const cartIcon = document.getElementById('cart-icon');
  const cartPopup = document.getElementById('cart-popup');
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartTotal = document.getElementById('cart-total');

  const paymentModal = document.getElementById('payment-modal');
  const paidBtn = document.getElementById('paid-btn');
  const uploadStep = document.getElementById('upload-step');
  const continueBtn = document.getElementById('continue-btn');

  let cart = [];

  // FETCH SHOES
  // fetch('http://localhost:3000/api/shoes')
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
        const div = document.createElement('div');
        div.className = 'shoeBoxesElement';
        div.innerHTML = `
          <div id="shoeIMG-Container">
            <img src="${shoe.image}">
          </div>
          <p id="price">₦${shoe.price}</p>
          <p id="info">${shoe.info}</p>
          <button class="buy-BTN">Buy Now</button>
        `;

        div.querySelector('.buy-BTN').onclick = () => addToCart(shoe);
        shoeContainer.appendChild(div);
      });
    });

  function addToCart(shoe) {
    cart.push(shoe);
    renderCart();
  }

  function renderCart() {
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
      total += item.price;
      const row = document.createElement('div');
      row.innerHTML = `
        <span>₦${item.price}</span><br>
        <span>₦${item.info}</span>
        <button data-index="${index}">✖</button>
      `;
      row.querySelector('button').onclick = () => {
        cart.splice(index, 1);
        renderCart();
      };
      cartItems.appendChild(row);
    });

    cartCount.textContent = cart.length;
    cartTotal.textContent = `Total: ₦${total}`;
  }

  cartIcon.onclick = () => {
    cartPopup.classList.toggle('hidden');
    paymentModal.classList.add('hidden');
  };

  document.getElementById('pay-btn').onclick = () => {
    cartPopup.classList.add('hidden');
    paymentModal.classList.remove('hidden');
    uploadStep.classList.add('hidden');
  };

  paidBtn.onclick = () => {
    uploadStep.classList.remove('hidden');
  };

  continueBtn.onclick = () => {
    alert('Please attach screenshot manually');

    window.location.href =
      `mailto:mmfootwears231@gmail.com?subject=I%20Just%20Made%20a%20Payment%20(MMFootwears)`;

    // window.open(
    //   'https://wa.me/234XXXXXXXXXX?text=Hello%20MM%20Footwears,%20I%20have%20completed%20payment.',
    //   '_blank'
    // );
  };
});

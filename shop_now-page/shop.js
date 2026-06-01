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

    if (shoe.outOfStock) {
      overlay.classList.add('out-of-stock');
    } else {
      overlay.classList.remove('out-of-stock');
    }
    overlayBuyBtn.disabled = shoe.outOfStock;

    // show or remove out of stock notice
    const existing = document.getElementById('out-of-stock-notice');
    if (existing) existing.remove();
    if (shoe.outOfStock) {
      const notice = document.createElement('p');
      notice.id = 'out-of-stock-notice';
      notice.textContent = '⚠️ This item is currently out of stock';
      overlayBuyBtn.insertAdjacentElement('beforebegin', notice);
    }

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

  let shopSettings = { lat: 10.468322, lng: 7.471292, pricePerTenKm: 500 };
  let waybillFee = 0;
  let selectedDeliveryPoint = null;

  const CACHE_KEY = 'mm_shoes_cache';
  const CACHE_TIME_KEY = 'mm_shoes_cache_time';
  // const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  // const CACHE_TTL = 30 * 1000; // 30 seconds
  const CACHE_TTL = 15 * 1000; // 15 seconds

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

    shoeContainer.innerHTML = `<p style="text-align:center;color:hsl(0,0%,60%);">Loading shoes... pls wait.</p>`;

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
      // box.className = 'shoeBoxesElement';
      box.className = `shoeBoxesElement ${shoe.outOfStock ? 'out-of-stock' : ''}`;

      // Compressed 480p thumbnail for fast card loading
      const thumbUrl = shoe.image.replace('/upload/', '/upload/w_480,q_auto,f_auto/');

      box.innerHTML = `
        <div id="shoeIMG-Container">
          <img src="${thumbUrl}" loading="lazy" alt="${shoe.name}">
        </div>
        <p id="name">${shoe.name}</p>
        <p id="price">₦${formatPrice(shoe.price)}</p>
        <p id="info">${shoe.info}</p>
        <button class="buy-BTN ${shoe.outOfStock ? 'out-of-stock-BTN' : ''}" ${shoe.outOfStock ? 'disabled' : ''}>
          ${shoe.outOfStock ? 'Out of Stock' : 'Buy Now'}
        </button>
      `;
      // box.innerHTML = `
      //   <div id="shoeIMG-Container">
      //     <img src="${thumbUrl}" loading="lazy" alt="${shoe.name}">
      //   </div>
      //   <p id="name">${shoe.name}</p>
      //   <p id="price">₦${formatPrice(shoe.price)}</p>
      //   <p id="info">${shoe.info}</p>
      //   <button class="buy-BTN">Buy Now</button>
      // `;

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







  // ---------------------------------------------
  // Waybill fee calculation based on distance
  // ---------------------------------------------
  // Fetch shop settings
  async function fetchSettings() {
    try {
      const res = await fetch(`${RAILWAY_API}/api/settings`);
      const data = await res.json();
      shopSettings = data;
    } catch (err) {
      console.error('Failed to fetch settings, using defaults');
    }
  }

  fetchSettings();

  const waybillToggleBtn = document.getElementById('waybill-toggle-btn');
  const waybillForm = document.getElementById('waybill-form');

  waybillToggleBtn.addEventListener('click', () => {
    waybillForm.classList.toggle('waybill-collapsed');
    waybillToggleBtn.textContent = waybillForm.classList.contains('waybill-collapsed')
      ? '🚚 Want delivery? Click here'
      : '🚚 Hide delivery options';
  });

  document.getElementById('wb-skip-btn').addEventListener('click', () => {
    waybillFee = 0;
    selectedDeliveryPoint = null;
    waybillForm.classList.add('waybill-collapsed');
    waybillToggleBtn.textContent = '🚚 Want delivery? Click here';
    renderCart();
  });




  // Distance calculator (Haversine formula)
  function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in KM
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1.3; // 1.3 road multiplier
  }

  // Calculate waybill fee
  function calcFee(distanceKm) {
    return Math.ceil((distanceKm / 10) * shopSettings.pricePerTenKm);
  }







  // Find delivery points via Nominatim
  async function findDeliveryPoints(address, district, lga, state) {
    const nominatimHeaders = {
      'Accept-Language': 'en',
      'User-Agent': 'MMFootwears/1.0 (mmfootwears231@gmail.com)'
    };

    // Step 1: Geocode — district is the primary key, fast fallbacks
    let customerLat, customerLng;
    const geoAttempts = [
      `${district}, ${lga}, ${state}, Nigeria`,
      `${lga}, ${state}, Nigeria`,
      `${state}, Nigeria`
    ];

    for (const attempt of geoAttempts) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(attempt)}&format=json&limit=1`,
          { headers: nominatimHeaders, signal: ctrl.signal }
        );
        clearTimeout(tid);
        const data = await res.json();
        if (data.length) {
          customerLat = parseFloat(data[0].lat);
          customerLng = parseFloat(data[0].lon);
          break;
        }
      } catch (e) { continue; }
    }

    if (!customerLat) throw new Error('Location not found. Try a different district name.');

    const results = [];

    // Check if customer is within 3km of shop
    const distanceToShop = calcDistance(customerLat, customerLng, shopSettings.lat, shopSettings.lng);
    if (distanceToShop < 3) {
      results.push({
        name: 'M&M Footwears Shop (Pickup Only)',
        fullName: 'M&M Footwears Shop',
        lat: shopSettings.lat,
        lng: shopSettings.lng,
        distanceFromShop: 0,
        distanceFromCustomer: distanceToShop,
        isShop: true
      });
    }

    // Step 2: Geographic radius search via Overpass — finds real mapped places near customer coords
    let overpassSuccess = false;
    const radius = 6000; // 6km radius
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["place"~"neighbourhood|suburb|village|town|quarter"](around:${radius},${customerLat},${customerLng});
        node["amenity"~"marketplace|police|hospital|bank|fuel"](around:${radius},${customerLat},${customerLng});
        node["highway"="bus_stop"](around:${radius},${customerLat},${customerLng});
        node["shop"~"supermarket|mall|department_store"](around:${radius},${customerLat},${customerLng});
      );
      out body 30;
    `;

    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 22000);
      const overpassRes = await fetch(`${RAILWAY_API}/api/overpass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: overpassQuery }),
        signal: ctrl.signal
      });
      clearTimeout(tid);

      if (overpassRes.ok) {
        const overpassData = await overpassRes.json();
        const elements = (overpassData.elements || []).filter(e => e.tags?.name);

        const seenNames = new Set();
        const unique = elements.filter(e => {
          const n = e.tags.name.toLowerCase();
          if (seenNames.has(n)) return false;
          seenNames.add(n);
          return true;
        });

        const withDistance = unique.map(e => ({
          name: e.tags.name,
          fullName: e.tags.name,
          lat: e.lat,
          lng: e.lon,
          distanceFromShop: calcDistance(shopSettings.lat, shopSettings.lng, e.lat, e.lon),
          distanceFromCustomer: calcDistance(customerLat, customerLng, e.lat, e.lon),
          isShop: false
        }));

        withDistance.sort((a, b) => a.distanceFromCustomer - b.distanceFromCustomer);
        const maxPoints = distanceToShop < 3 ? 3 : 4;
        results.push(...withDistance.slice(0, maxPoints));
        overpassSuccess = true;
      }
    } catch (e) {
      console.warn('Overpass failed, falling back to Nominatim text search');
    }

    // Step 3: Nominatim fallback if Overpass failed and nothing found
    if (!overpassSuccess && results.filter(r => !r.isShop).length === 0) {
      const types = ['junction', 'bus_stop', 'marketplace', 'police'];
      let allPoints = [];

      for (const type of types) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 8000);
          const nearRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${type} ${district} ${lga} ${state} Nigeria`)}&format=json&limit=5`,
            { headers: nominatimHeaders, signal: ctrl.signal }
          );
          clearTimeout(tid);
          const nearData = await nearRes.json();
          allPoints = allPoints.concat(nearData);
        } catch (e) { continue; }
      }

      const seen = new Set();
      const withDistance = allPoints
        .filter(p => { if (seen.has(p.place_id)) return false; seen.add(p.place_id); return true; })
        .map(p => ({
          name: p.display_name.split(',')[0],
          fullName: p.display_name,
          lat: parseFloat(p.lat),
          lng: parseFloat(p.lon),
          distanceFromShop: calcDistance(shopSettings.lat, shopSettings.lng, parseFloat(p.lat), parseFloat(p.lon)),
          distanceFromCustomer: calcDistance(customerLat, customerLng, parseFloat(p.lat), parseFloat(p.lon)),
          isShop: false
        }))
        .filter(p => p.distanceFromCustomer <= 10);

      withDistance.sort((a, b) => a.distanceFromCustomer - b.distanceFromCustomer);
      const maxPoints = distanceToShop < 3 ? 3 : 4;
      results.push(...withDistance.slice(0, maxPoints));
    }

    return results;
  }
  // async function findDeliveryPoints(address, district, lga, state) {
  //   // Step 1: Geocode with 5-step fallbacks
  //   let customerLat, customerLng;
  //   const attempts = [
  //     `${address}, ${district}, ${lga}, ${state}, Nigeria`,
  //     `${district}, ${lga}, ${state}, Nigeria`,
  //     `${lga}, ${state}, Nigeria`,
  //     `${state}, Nigeria`
  //   ];

  //   let found = false;
  //   for (const attempt of attempts) {
  //     const geoRes = await fetch(
  //       `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(attempt)}&format=json&limit=1`,
  //       { headers: { 'Accept-Language': 'en' } }
  //     );
  //     const geoData = await geoRes.json();
  //     if (geoData.length) {
  //       customerLat = parseFloat(geoData[0].lat);
  //       customerLng = parseFloat(geoData[0].lon);
  //       found = true;
  //       break;
  //     }
  //   }

  //   if (!found) throw new Error('Location not found. Try a nearby landmark or junction name instead.');

  //   const results = [];

  //   // Check if customer is within 3km of shop
  //   const distanceToShop = calcDistance(customerLat, customerLng, shopSettings.lat, shopSettings.lng);
  //   if (distanceToShop < 3) {
  //     results.push({
  //       name: 'M&M Footwears Shop (Pickup Only)',
  //       fullName: 'M&M Footwears Shop',
  //       lat: shopSettings.lat,
  //       lng: shopSettings.lng,
  //       distanceFromShop: 0,
  //       distanceFromCustomer: distanceToShop,
  //       isShop: true,
  //       fee: 0
  //     });
  //   }

  //   // Step 2: Use Overpass API — query real OSM nodes near customer coords
  //   // Search radius: 5km, looking for highway=junction, amenity=marketplace, highway=bus_stop, amenity=police
  //   const radius = 5000; // meters
  //   const overpassQuery = `
  //     [out:json][timeout:15];
  //     (
  //       node["highway"="bus_stop"](around:${radius},${customerLat},${customerLng});
  //       node["amenity"="marketplace"](around:${radius},${customerLat},${customerLng});
  //       node["amenity"="police"](around:${radius},${customerLat},${customerLng});
  //       node["junction"="yes"](around:${radius},${customerLat},${customerLng});
  //       node["place"="neighbourhood"](around:${radius},${customerLat},${customerLng});
  //       node["place"="suburb"](around:${radius},${customerLat},${customerLng});
  //       node["place"="village"](around:${radius},${customerLat},${customerLng});
  //       node["place"="town"](around:${radius},${customerLat},${customerLng});
  //     );
  //     out body 30;
  //   `;

  //   // const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
      
  //   // const overpassRes = await fetch('https://overpass.kumi.systems/api/interpreter', {
  //   //   method: 'POST',
  //   //   body: 'data=' + encodeURIComponent(overpassQuery)
  //   // });
  
  //   // const overpassRes = await fetch(`${RAILWAY_API}/api/overpass`, {
  //   //   method: 'POST',
  //   //   headers: { 'Content-Type': 'application/json' },
  //   //   body: JSON.stringify({ query: overpassQuery })
  //   // });

  //   const controller = new AbortController();
  //   const timeoutId = setTimeout(() => controller.abort(), 35000);

  //   let overpassData;
  //   try {
  //     const overpassRes = await fetch(`${RAILWAY_API}/api/overpass`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ query: overpassQuery }),
  //       signal: controller.signal
  //     });
  //     clearTimeout(timeoutId);
  //     overpassData = await overpassRes.json();
  //   } catch (err) {
  //     clearTimeout(timeoutId);
  //     if (err.name === 'AbortError') {
  //       throw new Error('Search timed out. Please try again.');
  //     }
  //     throw err;
  //   }

  //   // const overpassData = await overpassRes.json();

  //   const elements = overpassData.elements || [];

  //   // Filter: must have a name tag
  //   const named = elements.filter(e => e.tags && e.tags.name);

  //   // Deduplicate by name
  //   const seenNames = new Set();
  //   const unique = named.filter(e => {
  //     const n = e.tags.name.toLowerCase();
  //     if (seenNames.has(n)) return false;
  //     seenNames.add(n);
  //     return true;
  //   });

  //   const withDistance = unique.map(e => ({
  //     name: e.tags.name,
  //     fullName: e.tags.name + (e.tags['addr:full'] ? ', ' + e.tags['addr:full'] : ''),
  //     lat: e.lat,
  //     lng: e.lon,
  //     distanceFromShop: calcDistance(shopSettings.lat, shopSettings.lng, e.lat, e.lon),
  //     distanceFromCustomer: calcDistance(customerLat, customerLng, e.lat, e.lon),
  //     isShop: false
  //   }));

  //   // Sort by closest to customer
  //   withDistance.sort((a, b) => a.distanceFromCustomer - b.distanceFromCustomer);

  //   const maxPoints = distanceToShop < 3 ? 3 : 4;
  //   results.push(...withDistance.slice(0, maxPoints));

  //   return results;
  // }
  // async function findDeliveryPoints(address, district, lga, state) {
  //   // Step 1: Geocode with 5-step fallbacks
  //   let customerLat, customerLng;
  //   const attempts = [
  //     `${address}, ${district}, ${lga}, ${state}, Nigeria`,
  //     `${district}, ${lga}, ${state}, Nigeria`,
  //     `${lga}, ${state}, Nigeria`,
  //     `${state}, Nigeria`,
  //     `Nigeria`
  //   ];

  //   let found = false;
  //   for (const attempt of attempts) {
  //     const geoRes = await fetch(
  //       `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(attempt)}&format=json&limit=1`,
  //       { headers: { 'Accept-Language': 'en' } }
  //     );
  //     const geoData = await geoRes.json();
  //     if (geoData.length) {
  //       customerLat = parseFloat(geoData[0].lat);
  //       customerLng = parseFloat(geoData[0].lon);
  //       found = true;
  //       break;
  //     }
  //   }

  //   if (!found) throw new Error('Location not found. Try a nearby landmark or junction name instead.');

  //   // Check if customer is within 3km of shop — add shop as first option
  //   const distanceToShop = calcDistance(customerLat, customerLng, shopSettings.lat, shopSettings.lng);
  //   const results = [];

  //   if (distanceToShop < 3) {
  //     results.push({
  //       name: 'M&M Footwears Shop (Pickup Only)',
  //       fullName: 'M&M Footwears Shop',
  //       lat: shopSettings.lat,
  //       lng: shopSettings.lng,
  //       distanceFromShop: 0,
  //       distanceFromCustomer: distanceToShop,
  //       isShop: true,
  //       fee: 0
  //     });
  //   }

  //   // Step 2: Find nearby delivery-suitable public spots
  //   // Include junctions, bus stops, markets, police stations, government offices
  //   const types = ['junction', 'bus_stop', 'marketplace', 'police', 'government_office'];
  //   let allPoints = [];

  //   for (const type of types) {
  //     const nearRes = await fetch(
  //       `https://nominatim.openstreetmap.org/search?q=${type}+${lga}+${state}+Nigeria&format=json&limit=5&addressdetails=1`,
  //       { headers: { 'Accept-Language': 'en' } }
  //     );
  //     const nearData = await nearRes.json();
  //     allPoints = allPoints.concat(nearData);
  //   }

  //   // Remove duplicates and calculate distances
  //   const seen = new Set();
  //   const unique = allPoints.filter(p => {
  //     if (seen.has(p.place_id)) return false;
  //     seen.add(p.place_id);
  //     return true;
  //   });

  //   const withDistance = unique
  //     .map(p => ({
  //       name: p.display_name.split(',')[0],
  //       fullName: p.display_name,
  //       lat: parseFloat(p.lat),
  //       lng: parseFloat(p.lon),
  //       distanceFromShop: calcDistance(shopSettings.lat, shopSettings.lng, parseFloat(p.lat), parseFloat(p.lon)),
  //       distanceFromCustomer: calcDistance(customerLat, customerLng, parseFloat(p.lat), parseFloat(p.lon)),
  //       isShop: false
  //     }))
  //     // Filter out points that are too far (>7km from customer)
  //     .filter(p => p.distanceFromCustomer <= 7);

  //   // Sort by closest to customer first
  //   withDistance.sort((a, b) => a.distanceFromCustomer - b.distanceFromCustomer);

  //   // Add up to 4 nearby points (or 3 if shop was included)
  //   const maxNearbyPoints = distanceToShop < 3 ? 3 : 4;
  //   results.push(...withDistance.slice(0, maxNearbyPoints));

  //   return results;
  // }

  // Handle Find Delivery Points button
  document.getElementById('wb-find-btn').addEventListener('click', async () => {
    const name = document.getElementById('wb-name').value.trim();
    const phone = document.getElementById('wb-phone').value.trim();
    const address = document.getElementById('wb-address').value.trim();
    const district = document.getElementById('wb-district').value.trim();
    const lga = document.getElementById('wb-lga').value.trim();
    const state = document.getElementById('wb-state').value.trim();

    if (!name || !phone || !address || !district || !lga || !state) {
      alert('Please fill all delivery fields');
      return;
    }

    const findBtn = document.getElementById('wb-find-btn');
    const wbResults = document.getElementById('wb-results');

    findBtn.textContent = 'Searching...';
    findBtn.disabled = true;
    wbResults.classList.add('hidden');
    wbResults.innerHTML = '';

    try {
      const points = await findDeliveryPoints(address, district, lga, state);

      if (!points.length) {
        wbResults.innerHTML = `<p style="color:hsl(26,99%,40%);padding:10px;">No nearby meetup points found. Please contact Moker directly for delivery.</p>`;
        wbResults.classList.remove('hidden');
        return;
      }

      wbResults.innerHTML = `<p style="color:hsl(0,0%,60%);font-size:13px;margin-bottom:10px;">Select your nearest meetup point:</p>`;

      points.forEach((point, i) => {
        const fee = point.isShop ? 0 : calcFee(point.distanceFromShop);
        const card = document.createElement('div');
        card.className = 'wb-point-card';
        card.dataset.index = i;
        
        // Show special message for shop option
        const shopLabel = point.isShop ? '<p style="color:hsl(152,99%,32%);font-size:11px;font-weight:bold;margin-bottom:5px;">✅ 0 DELIVERY FEE</p>' : '';
        
        card.innerHTML = `
          ${shopLabel}
          <p class="wb-point-name">📍 ${point.name}</p>
          <p class="wb-point-dist">~${point.distanceFromShop.toFixed(1)} km from shop</p>
          <p class="wb-point-fee">Delivery fee: <span>₦${formatPrice(fee)}</span></p>
        `;

        card.addEventListener('click', () => {
          // Deselect all
          document.querySelectorAll('.wb-point-card').forEach(c => c.classList.remove('wb-point-selected'));
          card.classList.add('wb-point-selected');

          selectedDeliveryPoint = {
            name: point.name,
            fullName: point.fullName,
            distanceKm: point.distanceFromShop.toFixed(1),
            customerName: name,
            customerPhone: phone,
            customerAddress: `${address}, ${district}, ${lga}, ${state}`,
            fee,
            isShop: point.isShop || false
          };
          waybillFee = fee;
          renderCart();

          // Show selected summary
          const wbSelected = document.getElementById('wb-selected');
          wbSelected.innerHTML = `
            <p style="color:hsl(152,99%,32%);font-size:13px;margin-top:10px;">
              ✅ Delivery to <b>${point.name}</b> — ₦${formatPrice(fee)} added to total
            </p>
          `;
          wbSelected.classList.remove('hidden');
        });

        wbResults.appendChild(card);
      });

      wbResults.classList.remove('hidden');

    } catch (err) {
      wbResults.innerHTML = `<p style="color:red;padding:10px;">⚠️ ${err.message}</p>`;
      wbResults.classList.remove('hidden');
    } finally {
      findBtn.textContent = 'Find Delivery Points';
      findBtn.disabled = false;
    }
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

    // cartCount.textContent = cart.length;
    // cartTotal.textContent = `Total: ₦${formatPrice(total)}`;
    cartCount.textContent = cart.length;
    const grandTotal = total + waybillFee;
    cartTotal.innerHTML = waybillFee > 0
      ? `Shoes: ₦${formatPrice(total)}<br>
        <span style="color:hsl(152,99%,32%);font-size:16px;">🚚 Delivery: ₦${formatPrice(waybillFee)}</span><br>
        <b>Total: ₦${formatPrice(grandTotal)}</b>`
      : `Total: ₦${formatPrice(total)}`;
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

    const deliveryInfo = selectedDeliveryPoint
      ? `\n\n    Delivery: YES
        Customer: ${selectedDeliveryPoint.customerName}
        Phone: ${selectedDeliveryPoint.customerPhone}
        Address: ${selectedDeliveryPoint.customerAddress}
        Meetup Point: ${selectedDeliveryPoint.name}
        Distance: ~${selectedDeliveryPoint.distanceKm} km
        Delivery Fee: ₦${formatPrice(selectedDeliveryPoint.fee)}
        Grand Total: ₦${formatPrice(total + selectedDeliveryPoint.fee)}`
      : `\n\n    Delivery: NO — Customer will pick up`;

    return `M&M Purchase - A customer just made a payment from your shoe site.

    Items: [${itemsText}]

    Shoes Total = ₦${formatPrice(total)}.${deliveryInfo}

    You should receive a message from them soon.`;
    // Items: [${itemsText}]

    // Total = ₦${formatPrice(total)}.

    // You should receive a message from them soon.`;
  }
});

fetch('http://localhost:3000/api/shoes')
  .then((response) => response.json())
  .then((shoes) => {
    console.log(shoes); // Log the shoe data to see if it's being fetched correctly
    const shoeContainer = document.getElementById('shoe_container');
    shoes.forEach((shoe) => {
      const shoeElement = document.createElement('div');
      shoeElement.classList.add ('shoeBoxesElement')
      shoeElement.innerHTML = `
        <div id="shoeIMG-Container"><img src="${shoe.image}" alt="${shoe.name}"></div>
        <p id="price">Price: ₦ ${shoe.price}</p>
        <p id="info">Info: ${shoe.info}</p>
        <button class="buy-BTN">Buy Now</button>
      `;
      shoeContainer.appendChild(shoeElement);
    });
  })
  .catch((error) => console.error(error));
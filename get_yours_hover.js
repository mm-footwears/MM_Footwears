let timeoutId;
let lastX, lastY;
const shoeContainer = document.getElementById('BG_shoe-container');

shoeContainer.addEventListener('mousemove', (e) => {
    if (lastX !== e.clientX || lastY !== e.clientY) {
        clearTimeout(timeoutId);
        shoeContainer.classList.remove('show-popup');
        lastX = e.clientX;
        lastY = e.clientY;
        shoeContainer.style.setProperty('--x', `${e.offsetX}px`);
        shoeContainer.style.setProperty('--y', `${e.offsetY}px`);
        timeoutId = setTimeout(() => {
            shoeContainer.classList.add('show-popup');
        }, 1000);
    }
});

shoeContainer.addEventListener('mouseenter', (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    shoeContainer.style.setProperty('--x', `${e.offsetX}px`);
    shoeContainer.style.setProperty('--y', `${e.offsetY}px`);
    timeoutId = setTimeout(() => {
        shoeContainer.classList.add('show-popup');
    }, 1000);
});

shoeContainer.addEventListener('mouseleave', () => {
    clearTimeout(timeoutId);
    shoeContainer.classList.remove('show-popup');
});
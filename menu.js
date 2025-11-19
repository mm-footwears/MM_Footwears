const menu_btn = document.getElementById('menu_bars');
const menu_popUp = document.getElementById('menu_pop-UP');
const close_menu = document.getElementById('close_menu');

menu_btn.addEventListener('click', () => {
    menu_popUp.classList.add('showMenu');
});

close_menu.addEventListener('click', () => {
    menu_popUp.classList.remove('showMenu');
});

document.addEventListener('click', (e) => {
    if (!menu_popUp.contains(e.target) && e.target !== menu_btn) {
        menu_popUp.classList.remove('showMenu');
    }
});
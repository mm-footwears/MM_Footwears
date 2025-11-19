// Get the toggle button (add this to your HTML: <button id="theme-toggle">Toggle Theme</button>)
const themeToggle = document.getElementById('dark_mode-light_mode-BTN');

// reduce theme_text font size
document.getElementById('theme_text').style.fontSize = '8px';

// Check for saved theme preference
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById('theme_text').textContent = 'Light_mode';
}

// Add event listener to toggle button
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
        document.getElementById('theme_text').textContent = 'Light_mode';
    } else {
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme_text').textContent = 'Dark_mode';
    }
});
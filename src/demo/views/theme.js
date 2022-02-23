import { localStorage } from '../local-storage.js';

// Theme Switch
let theme = localStorage.restore('theme', 'light');
if(theme === 'dark')  onThemeDarkSwitch();
if(theme === 'light') onThemeLightSwitch();

let themeLightSwitch = document.getElementById('theme-light-switch');
let themeDarkSwitch  = document.getElementById('theme-dark-switch');

themeLightSwitch.addEventListener('pointerup', onThemeLightSwitch);
themeDarkSwitch.addEventListener('pointerup', onThemeDarkSwitch);

function onThemeLightSwitch(e) {
    document.body.id = 'light';
    localStorage.write('theme', 'light');
}

function onThemeDarkSwitch(e) {
    document.body.id = 'dark';
    localStorage.write('theme', 'dark');
}

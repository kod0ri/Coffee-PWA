if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW зареєстровано!', reg))
            .catch(err => console.log('Помилка:', err));
    });
}

// Task 4: Offline Detection [cite: 152]
window.addEventListener('online', () => document.getElementById('offline').style.display = 'none');
window.addEventListener('offline', () => document.getElementById('offline').style.display = 'block');

// Task 5: Update SW Logic [cite: 166]
async function updateSW() {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return alert('Немає SW');
    
    reg.update();
    
    reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('Нова версія! Оновити?')) {
                    newSW.postMessage({ action: 'skipWaiting' });
                }
            }
        });
    });
}

navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());

// Task 6: Load Menu from API [cite: 198]
fetch('/api/menu.json')
    .then(res => res.json())
    .then(menu => {
        const ul = document.createElement('ul');
        menu.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} - ${item.price} ₴`;
            ul.appendChild(li);
        });
        document.querySelector('main').appendChild(ul);
    });

// Task 7: Background Sync Logic [cite: 232]
async function placeOrder() {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
        await reg.sync.register('send-order');
        alert('Замовлення в черзі! Відправиться автоматично.');
    } else {
        alert('Sync не підтримується');
    }
}

navigator.serviceWorker.addEventListener('message', event => {
    alert(event.data);
});
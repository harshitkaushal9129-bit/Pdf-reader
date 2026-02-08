const CACHE_NAME = 'snt-vault-v1';

// In sabhi files ko offline chalne ke liye cache kiya jayega
const assets = [
  './',
  './index.html',
  './manifest.json',
  './logo.png', // Agar aapka logo hai
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. Service Worker Install karna
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching App Shell...');
      return cache.addAll(assets);
    })
  );
  self.skipWaiting(); // Naye version ko turant active karne ke liye
});

// 2. Purane cache ko delete karna (Activation)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetching Assets (Offline Support)
self.addEventListener('fetch', (event) => {
  // Firebase Database ke requests ko cache NA karein (Live data ke liye)
  if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Agar cache mein hai toh wahi se load karo, warna network se fetch karo
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        // Nayi files ko fetch karke cache mein store karna (Dynamic Caching)
        return caches.open(CACHE_NAME).then((cache) => {
          // Sirf valid responses ko cache karein
          if (event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => {
      // Agar internet nahi hai aur file cache mein bhi nahi hai
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});

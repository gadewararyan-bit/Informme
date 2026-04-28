importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAPORoDQTU_wgjYdl8aNUM3h5FLn0i86U8",
  authDomain: "informme-app-87a59.firebaseapp.com",
  projectId: "informme-app-87a59",
  storageBucket: "informme-app-87a59.firebasestorage.app",
  messagingSenderId: "164299555943",
  appId: "1:164299555943:web:9a180906e90606a1b9c0c2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

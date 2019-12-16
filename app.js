const webpush = require('web-push');
// CORE
// create and store vapid keys
let vapidkeys;
let subscription;

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

if (!localStorage.vapidkeys) {
    vapidkeys = webpush.generateVAPIDKeys();
    localStorage.vapidkeys = JSON.stringify(vapidkeys);
    console.log('generated new vapid');
} else {
    vapidkeys = JSON.parse(localStorage.vapidkeys);
    console.log('using saved vapid');
}

if(localStorage.subscription) {
    subscription = JSON.parse(localStorage.subscription);
}

webpush.setVapidDetails(
    'localhost:4200',
    vapidkeys.publicKey,
    vapidkeys.privateKey
);


console.log(vapidkeys);

let reqNotification = () => {
    console.log(subscription);
    setTimeout(() => {
        webpush.sendNotification(subscription, null, 200);
    }, 2000);
}

navigator.serviceWorker.register('/sw.js');
navigator.serviceWorker.ready.then(async (e) => {
    const s = await e.pushManager.getSubscription();
    let cvp = urlBase64ToUint8Array(vapidkeys.publicKey);
    let s_1;
    if(s===null) {
        s_1 = await e.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: cvp
        });
    } else {
        s_1 = await e.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: cvp
        });
    }
    console.log(s_1);
    
    localStorage.subscription = JSON.stringify(s_1);
    subscription = s_1;
    setTimeout(() => {
        reqNotification();
    }, 2000);
});
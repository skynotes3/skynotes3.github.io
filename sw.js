self.addEventListener('push', (e)=>{
    let payload = e.data ? e.data.text() : 'no payload';
    e.waitUntil(
        self.registration.showNotification('SkyTalk', {
            body: payload
        })
    );
});
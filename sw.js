var connectDB = (dbDef, resolve, reject) => {
    return new Promise((resolve, reject) => {
        // Opens a connection to the existing database or creates a new one    
        req = indexedDB.open(dbDef.dbName, dbDef.dbVer);
        req.onsuccess = (ev) => {
            // Saves an instance of the connection to our custom object        
            dbDef.dbCon = ev.target.result;
            resolve();
        }
        req.onupgradeneeded = (event) => {
            // Only fired once per db version, used to initiliaze the db
            dbDef.dbCon = event.target.result;
            dbDef.dbInit = 1;
            resolve();
        }
        req.onerror = (e) => {
            // Returns error event
            reject(e);
        }
    });
  }

var readDB = (dbDef, key, dex) => {
    return new Promise((resolve, reject) => {
        var trx = dbDef.dbCon.transaction([dbDef.dbStore]).objectStore(dbDef.dbStore);
        // If reading by an index
        if (dex) {
            // request index lookup
            trx = trx.index(dex);
            trx.get(key).onsuccess = (r) => {
                if (r.target.result !== undefined) {
                    resolve(r.target.result);
                } else {
                    resolve(`[readDB] ${dbDef.dbStore}, key: ${key} not found (${dex})`)
                }
            }
        }
        trx = trx.get(key);
        trx.onsuccess = (r) => {
            if (r.target.result === undefined) {
                reject(`[readDB] ${dbDef.dbStore}, key: ${key} not found`);
            } else {
                resolve(r.target.result);
            }
        }
        trx.onerror = (e) => {
            reject(e);
        }
    });
  }

  
var dbDef = {
    dbName: "skyroutes",
    dbVer: 1,
    dbStore: "routes",
    dbKeyp: "auto",
};

console.log("[SKYROUTES-BETA-0.6] An innovative client side router by Aakash Pandey");
const chng = ["initial testing"];
const vn = "version-p10";

var appCash = [
    '/index.html',
    '/lib/skyroute.css',
    '/lib/skyroute.js'
];

var RoutesSW;

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(vn).then((cache) => {
            return cache.addAll(appCash);
        })
    );
});


self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    } else if (event.data.action === 'clearOld') {
        event.waitUntil(
            caches.keys().then((keys) => Promise.all(
                keys.map((k) => {
                    if (!vn.includes(k)) {
                        return caches.delete(k);
                    }
                })
            )).then(() => {
                console.log('[App Update]');
            })
        )
    }
});

// RoutesSW[url.pathname.slice(1,)]


self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    connectDB(dbDef).then((c)=>{
        readDB(dbDef, 1).then((r)=>{
            RoutesSW = r;
            // console.log(RoutesSW);
        });
    });
    if (url.origin === location.origin && (!url.pathname.includes(".")) && (RoutesSW[url.pathname.slice(1,)])) {
        var r = caches.match(location.origin + '/index.html');
        e.respondWith(r)
        
    } else if(appCash.includes(url.pathname)) {
        e.respondWith(caches.match(url))
    } else {
        // console.log("Server Fetch: " + url);
    }
});
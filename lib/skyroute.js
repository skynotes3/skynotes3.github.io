// State management
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();
  // window.location = "/";
});

var halt = () => {
  document.body.innerHTML = `<div id="ee">Dev</div>`;
  document.getElementById('ee').style.display = "block";
}

// sw ref
var swork;
// SW Reg
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(function (reg) {
      if (swork = reg.waiting) {
        upsw();
      }
      reg.addEventListener('updatefound', () => {
        console.log('New state found');
        // Copy reference of new worker being installed
        swork = reg.installing;
        swork.addEventListener('statechange', () => {
          // Has service worker state changed and it's not the first call since n.s.c is not defined then
          if (swork.state === 'installed' && navigator.serviceWorker.controller) {
            upsw();
          }
        })
      })  // updatefound

    }).catch(function (error) {

    });
} else {
  halt();
}

var upsw = () => {
  swork.postMessage({ action: 'clearOld' });
  swork.postMessage({ action: 'skipWaiting' });
  console.log('fired the update');
}


// Utils

// Toggle pg
var ui = (el) => {
  el = document.getElementById(el);
  if (el.classList.contains('pgi')) {
    el.classList.toggle('pgi');
    el.classList.toggle('vis');
    return;
  }
  el.classList.toggle('pg');
  el.classList.toggle('vis');

}

// Hide all pgs
var iu = () => {
  e = document.querySelectorAll(".vis");
  for (i = 0; i < e.length; i++) {
    e[i].classList.remove('vis');
    e[i].classList.add('pg');
  }
}

// ---------------- End Utils

// Globals
var Routes;

// Scan and save paths
var ipp = () => {
  var Path = {};
  e = document.querySelectorAll(".pgi");
  Path[""] = e[0].id;
  e = document.querySelectorAll(".pg");
  for (i = 0; i < e.length; i++) {
    Path[e[i].id] = e[i].id;
  }
  localStorage.Path = JSON.stringify(Path);
}

// Handlers

var run = () => {
  ipp();
  Routes = JSON.parse(localStorage.Path);
  nav();
  connectDB(dbDef).then((c)=>{
    createDB(dbDef, Routes);
  });
}

// Actions

var nav = (p) => {
  // If URI Load
  if (!p && p !== "") {
    pg = Routes[location.pathname.slice(1)];
  } else {
    pg = Routes[p];
    if (p !== "") {
      history.pushState({ path: pg }, "SkyRoute", `/${pg}`);
    } else {
      history.pushState({ path: pg }, "SkyRoute", `/`);
    }
  }
  iu();
  ui(pg);
  try { pathEvents(location.pathname.slice(1)); } catch (e) { }
}

// On load
document.addEventListener('DOMContentLoaded', () => {
  run();
  window.addEventListener('popstate', () => {
    nav();
  })
}, false);

// IndexedDB
var connectDB = (dbDef, resolve, reject) => {
  return new Promise((resolve, reject) => {
      // Opens a connection to the existing database or creates a new one    
      req = window.indexedDB.open(dbDef.dbName, dbDef.dbVer);
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

var createDB = (dbDef, dbInit) => {
  return new Promise((resolve, reject) => {
      if (!dbDef.dbInit) {
          // resolve(`[createDB] ${dbDef.dbName}, already initialized`)
          resolve();
      }

      if (dbDef.dbKeyp === "auto") {
        var objectStore = dbDef.dbCon.createObjectStore(dbDef.dbStore, { autoIncrement : true });
      } else {
        var objectStore = dbDef.dbCon.createObjectStore(dbDef.dbStore, { keyPath: dbDef.dbKeyp });
      }

      // HERE
      if (dbDef.dbIndex) {
          dbDef.dbIndex.map(dx => {
              // Create indexes dynamically based on dbDef
              objectStore.createIndex(dx.name, dx.key, { unique: dx.pri });
          });
      } 
      objectStore.transaction.oncomplete = (e) => {
          trx = dbDef.dbCon.transaction(dbDef.dbStore, "readwrite").objectStore(dbDef.dbStore);
          if(Array.isArray(dbInit)) {
            dbInit.map(row => trx.add(row));
          } else {
            trx.add(dbInit);
          }
          resolve(`[createDB] ${dbDef.dbName}, task finished`);
      }
      objectStore.transaction.onerror = (event) => {
          reject(`[createDB] ${dbDef.dbName}, ${event.request.errorCode}`);
      };
  });
}

var updateDB = (dbDef, key, newData) => {
  return new Promise((resolve, reject) => {
      var trx = dbDef.dbCon.transaction([dbDef.dbStore], "readwrite").objectStore(dbDef.dbStore);
      // Attempt to fetch the object row based on key
      req = trx.get(key);
      req.onsuccess = (r) => {
          // resolve(r.target.result);
          if (r.target.result !== undefined) {
              // assign a reference of fetched row to data 
              data = r.target.result;
              // Iterate over the keys of newData
              Array.from(Object.keys(newData)).map((i) => {
                  // Update with new data values
                  data[i] = newData[i];
              });
              // Write the changes back to store
              var upd = trx.put(data);
              upd.onsuccess = (e) => {
                  resolve(`[updateDB] ${dbDef.dbName}, updated ${key} `);
              }
          } else {
              resolve(`[updateDB] ${dbDef.dbStore}, key: ${key} not found`);
          }
      }; trx.onerror = (e) => {
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








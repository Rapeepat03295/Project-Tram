import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, onValue, push, remove, set, off, orderByChild, limitToLast, query} from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Firebase client config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase client SDK
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const storage = getStorage(app);

export const fetchFromDb = (path) => {
  return new Promise((resolve, reject) => {
    try {
      const dbRef = ref(realtimeDb, path);

      const onDataChange = (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const dataWithId = Object.entries(data).map(([id, value]) => ({
              id: id,
              ...value,
            }));
            const dataArray = Object.values(dataWithId);
            resolve(dataArray);
          } else {
            resolve([]);
          }
        } catch (error) {
          reject(error);
        } finally {
          off(dbRef, 'value', onDataChange);
        }
      };

      onValue(dbRef, onDataChange, (error) => {
        off(dbRef, 'value', onDataChange);
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
};


export const fetchNewestFirst = (path, timestampField='createdAt' ) => {
     return new Promise((resolve, reject) => {
    try {
      const dbRef = ref(realtimeDb, path);
      const sortedQuery = query(dbRef, orderByChild(timestampField));

      const onDataChange = (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const dataWithId = Object.entries(data).map(([id, value]) => ({
              id: id,
              ...value,
            }));
            dataWithId.sort((a, b) => b[timestampField] - a[timestampField]);
            resolve(dataWithId);
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error("Error importing snapshot data:", error);
          reject(error);
        } finally {
          off(sortedQuery, 'value', onDataChange);
        }
      };

      onValue(sortedQuery, onDataChange, (error) => {
       
        console.error("Firebase fetch error:", error);
        off(sortedQuery, 'value', onDataChange); // Ensure listener is detached on error
        reject(error);
      });

    } catch (error) {
     
      console.error("Initial function error:", error);
      reject(error);
    }
  });
};

export const editFromDb = (data, path, id) => {
  return new Promise((resolve, reject) => {
    try {
      const dataRef = ref(realtimeDb, `${path}/${id}`);

      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString()
      }
      set(dataRef, updatedData).then(() => {
        resolve(true);
      })
        .catch((e) => {
          reject(e);
        })
    } catch (e) {
      reject(e);
    }
  });
}


export const editRouteFromDb = (data, path, id) => {
  return new Promise((resolve, reject) => {
    try {
      const dataRef = ref(realtimeDb, `${path}/${id}`);
      set(dataRef, data).then(() => {
        resolve(true);
      })
        .catch((e) => {
          reject(e);
        })
    } catch (e) {
      reject(e);
    }
  });
}



export const deleteFromDb = (path, id) => {
  return new Promise((resolve, reject) => {
    try {
      const itemRef = ref(realtimeDb, `${path}/${id}`);

      remove(itemRef)
        .then(() => {
          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const addFromDb = (data, path) => {
  return new Promise((resolve, reject) => {
    try {
      const collectionRef = ref(realtimeDb, path);
      const newItemRef = push(collectionRef); // Generate a unique ID

      const dataWithCreatedAt = {
        ...data,
        createdAt: new Date().toISOString()
      };

      set(newItemRef, dataWithCreatedAt)
        .then(() => {
          resolve(newItemRef.key); // Resolve with the newly generated ID
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

export const addRouteFromDb = (data, path) => {
  return new Promise((resolve, reject) => {
    try {
      const collectionRef = ref(realtimeDb, path);
      const newItemRef = push(collectionRef); // Generate a unique ID
      set(newItemRef, data)
        .then(() => {
          resolve(newItemRef.key); // Resolve with the newly generated ID
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};


export const addEventWithImage = async (eventId, eventData, imageFile) => {
    let imageUrl = null;
    let imageName = null;

    if (imageFile) {
        const newImgRef = storageRef(storage, `events/${eventId}/${imageFile.name}`);
        await uploadBytes(newImgRef, imageFile);
        imageUrl = await getDownloadURL(newImgRef);
        imageName = imageFile.name;
    }

    const fullEventData = {
        ...eventData,
        imageUrl,
        imageName
    };

    const eventRef = ref(realtimeDb, `events/${eventId}`);
    await set(eventRef, fullEventData);
};


/*
// Function to get stations data from Realtime Database
export const getStationsData = (callback) => {
  const stationsRef = ref(realtimeDb, 'stations');
  
  if (callback) {
    // Subscription mode
    const unsubscribe = onValue(stationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const stationsData = Object.entries(snapshot.val()).map(([key, data]) => ({
          id: key,
          ...data
        }));
        callback(stationsData);
      } else {
        callback([]);
      }
    }, (error) => {
      console.error('Firebase data fetch error:', error);
      callback([]);
    });
 
    // Return unsubscribe function
    return () => {
      off(stationsRef);
      unsubscribe();
    };
  } else {
    // Promise mode
    return new Promise((resolve, reject) => {
      onValue(stationsRef, (snapshot) => {
        if (snapshot.exists()) {
          const stationsData = Object.entries(snapshot.val()).map(([key, data]) => ({
            id: key,
            ...data
          }));
          resolve(stationsData);
        } else {
          resolve([]);
        }
      }, (error) => {
        console.error('Firebase data fetch error:', error);
        reject(error);
      }, { onlyOnce: true }); // Only get the value once for Promise mode
    });
  }
};
 
// Function to get a specific station by ID
export const getStationById = (stationId) => {
  return new Promise((resolve, reject) => {
    const stationRef = ref(realtimeDb, `stations/${stationId}`);
    onValue(stationRef, (snapshot) => {
      if (snapshot.exists()) {
        resolve({
          id: stationId,
          ...snapshot.val()
        });
      } else {
        resolve(null);
      }
    }, reject, { onlyOnce: true });
  });
};
 
// Function to update a station
export const updateStation = async (stationId, stationData) => {
  const stationRef = ref(realtimeDb, `stations/${stationId}`);
  await set(stationRef, stationData);
  return getStationById(stationId);
};
 
// Function to get stations by color
export const getStationsByColor = async (color) => {
  try {
    const stations = await getStationsData();
    return stations.filter(station => 
      station.colors?.includes(color)
    );
  } catch (error) {
    console.error('Error getting stations by color:', error);
    throw error;
  }
};
 
// Function to get all station names
export const getAllStationNames = async () => {
  try {
    const stations = await getStationsData();
    return stations.map(station => ({
      id: station.id,
      nameEn: station.nameEn,
      nameTh: station.nameTh
    }));
  } catch (error) {
    console.error('Error getting station names:', error);
    throw error;
  }
};
*/
export {
  app,
  auth,
  db,
  realtimeDb,
  signInWithEmailAndPassword,
};


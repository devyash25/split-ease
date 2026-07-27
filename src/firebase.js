import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAuhd3--egYCs1I1Z18EWm5Y4rIhuU6LYk',
  authDomain: 'splitease-app-740fb.firebaseapp.com',
  projectId: 'splitease-app-740fb',
  storageBucket: 'splitease-app-740fb.firebasestorage.app',
  messagingSenderId: '161723404199',
  appId: '1:161723404199:web:d28ba619fad10f0c32b082',
  measurementId: 'G-XCYQ77LPW7'
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  app,
  analytics,
  db,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc,
  onSnapshot,
};

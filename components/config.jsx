import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAJ23ABwnx7wx6ahpF552ZZh7s3D2xWkGo",
  authDomain: "recipeguess.firebaseapp.com",
  projectId: "recipeguess",
  storageBucket: "recipeguess.appspot.com",
  messagingSenderId: "994035261416",
  appId: "1:994035261416:web:a2e2258d344160c0c7ce5d"
};

const app = initializeApp(firebaseConfig);

const storage = getStorage(app)

const db = getFirestore(app)

export {app, db, storage}
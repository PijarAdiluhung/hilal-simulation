import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAHN56fAkPVmRzJ_eRcZhEnpwQ2hY_1Q40",
  authDomain: "hilal-sim.firebaseapp.com",
  projectId: "hilal-sim",
  storageBucket: "hilal-sim.firebasestorage.app",
  messagingSenderId: "452800497688",
  appId: "1:452800497688:web:7638dc80f49eec30a39b6d",
  measurementId: "G-G2Z1D8NSGZ"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
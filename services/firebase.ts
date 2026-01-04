
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';

// Configuração atualizada com os dados fornecidos pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyCT8qOWehWvW3Uc33Ag_iMf_kLFFJ7HR9Q",
  authDomain: "gen-lang-client-0372184580.firebaseapp.com",
  projectId: "gen-lang-client-0372184580",
  storageBucket: "gen-lang-client-0372184580.firebasestorage.app",
  messagingSenderId: "144726799776",
  appId: "1:144726799776:web:5aefd7a51c0e414422e0c5",
  measurementId: "G-004DEC7KKJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Analytics em modo ultra-seguro
export const analyticsPromise = isSupported().then(async (supported) => {
  if (supported) {
    try {
      return getAnalytics(app);
    } catch (e) {
      console.warn("[XTAGY] Analytics bloqueado.");
      return null;
    }
  }
  return null;
}).catch(() => null);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência: Múltiplas abas abertas.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistência: Navegador não suportado.');
    }
  });
}

export const ENVIRONMENT: "test" | "production" = "test";
export const FIRESTORE_ROOT = ENVIRONMENT === "test" ? "sandbox" : "production";

export const getEnvCollection = (collectionName: string) => {
  const root = "environments";
  if (!collectionName) return `${root}/${FIRESTORE_ROOT}`;
  return `${root}/${FIRESTORE_ROOT}/${collectionName}`;
};

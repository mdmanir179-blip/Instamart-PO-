import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  onSnapshot, 
  addDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ItemMaster, PurchaseOrder, DNRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test connection on boot per Skill Guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
  }
}
testConnection();

// Initial catalog seed data if collection is empty
export const DEFAULT_ITEMS: Omit<ItemMaster, 'id'>[] = [
  { itemId: 'INST-SKU-1001', itemName: 'Amul Taaza Homogenised Toned Milk 1L', category: 'Dairy', unit: 'Pcs' },
  { itemId: 'INST-SKU-1002', itemName: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg', category: 'Staples', unit: 'Bag' },
  { itemId: 'INST-SKU-1003', itemName: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch', category: 'Oils & Ghee', unit: 'Pcs' },
  { itemId: 'INST-SKU-1004', itemName: 'Tata Salt Vacuum Evaporated Iodised Salt 1kg', category: 'Staples', unit: 'Pcs' },
  { itemId: 'INST-SKU-1005', itemName: 'Maggi 2-Minute Masala Instant Noodles 280g (Pack of 4)', category: 'Instant Food', unit: 'Pack' },
  { itemId: 'INST-SKU-1006', itemName: 'Cadbury Dairy Milk Silk Chocolate Bar 60g', category: 'Snacks & Confectionery', unit: 'Pcs' },
  { itemId: 'INST-SKU-1007', itemName: 'Surf Excel Quick Wash Detergent Powder 1kg', category: 'Household Essentials', unit: 'Pack' },
  { itemId: 'INST-SKU-1008', itemName: 'Lay\'s India\'s Magic Masala Potato Chips 50g', category: 'Snacks', unit: 'Pack' },
  { itemId: 'INST-SKU-1009', itemName: 'Coca-Cola Soft Drink 750ml PET Bottle', category: 'Beverages', unit: 'Bottle' },
  { itemId: 'INST-SKU-1010', itemName: 'Dettol Original Liquid Handwash Refill 675ml', category: 'Personal Care', unit: 'Pcs' },
];

export const DEFAULT_WAREHOUSES = [
  'Instamart Kolkata DarkStore-01 (Salt Lake Sector V)',
  'Instamart Kolkata Hub-02 (Rajarhat Newtown)',
  'Instamart Bangalore Hub-North (Hebbal)',
  'Instamart Bangalore DarkStore-04 (Koramangala)',
  'Instamart Mumbai Central WH (Andheri East)',
  'Instamart Delhi NCR Hub (Gurugram Sec 48)',
  'Instamart Hyderabad Hub (Madhapur)',
];

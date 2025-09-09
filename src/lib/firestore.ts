
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  writeBatch,
  serverTimestamp,
  addDoc,
  Timestamp,
  runTransaction,
  where,
  onSnapshot,
  collectionGroup,
} from 'firebase/firestore';
import type { Settings, User, TrialBalanceEntry, HsnCode, Invoice, BrandingSettings } from './types';

// --- Helper Functions ---
function getCurrentFinancialYear(): string {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    if (currentMonth >= 3) { // April (index 3) to December
        return `${currentYear}-${String(currentYear + 1).slice(-2)}`;
    } else { // January to March
        return `${currentYear - 1}-${String(currentYear).slice(-2)}`;
    }
}

// --- Listener Functions ---

export function listenToCollection<T>(path: string, callback: (data: T[]) => void): () => void {
    const q = query(collection(db, path));
    return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        callback(data);
    });
}

export function listenToDoc<T>(path: string, callback: (data: T | null) => void): () => void {
    return onSnapshot(doc(db, path), (doc) => {
        callback(doc.exists() ? { id: doc.id, ...doc.data() } as T : null);
    });
}


// --- User Service ---
export const createUserProfile = async (user: { uid: string; email: string | null; displayName: string | null }) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return; // User profile already exists.
    }

    const { uid, email, displayName } = user;
    
    // Assign role based on email address
    const userRole = email === 'sruthikranthi24@gmail.com' ? 'superadmin' : 'direct';

    const newUser: Omit<User, 'id'> = {
        name: displayName || email || 'New User',
        email: email || '',
        role: userRole,
        onboarded: false,
        createdAt: serverTimestamp() as Timestamp,
        activeChildId: uid, // A user always starts in their own workspace
        activeFinancialYear: getCurrentFinancialYear(),
    };
    await setDoc(userRef, newUser);
};

export const getUser = async (userId: string): Promise<User | null> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;
    return { id: userSnap.id, ...userSnap.data() } as User;
}

export const getManagedUsers = async(ownerId: string): Promise<User[]> => {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where("ownerId", "==", ownerId));
    const userSnapshot = await getDocs(q);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
}

export const addUser = async (userData: Partial<User>): Promise<User> => {
    const usersCollection = collection(db, 'users');
    const userPayload: Omit<User, 'id'> = {
        name: userData.name || 'New Client',
        email: userData.email || '',
        role: userData.role || 'direct',
        onboarded: userData.onboarded ?? true,
        createdAt: serverTimestamp() as Timestamp,
        ownerId: userData.ownerId,
        activeChildId: '', // Clients don't manage others
        activeFinancialYear: getCurrentFinancialYear(),
    };
    
    const docRef = await addDoc(usersCollection, userPayload);
    
    // Also add this new client to the professional's list of clients
    if(userData.ownerId) {
        const professionalUserRef = doc(db, 'users', userData.ownerId);
        const professionalDoc = await getDoc(professionalUserRef);
        if (professionalDoc.exists()) {
            const professionalData = professionalDoc.data();
            const clients = professionalData.clients || [];
            clients.push({ id: docRef.id, name: userPayload.name });
            await updateDoc(professionalUserRef, { clients });
        }
    }
    
    return {
        ...userPayload,
        id: docRef.id,
    } as User;
}

export const updateUser = async (userId: string, userData: Partial<User>) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { ...userData, updatedAt: serverTimestamp() });
}

export const inviteTeamMember = async (ownerId: string, email: string, role: string) => {
    // In a real application, this would send an email and create a pending user document.
    // For this prototype, we'll just log it.
    console.log(`Inviting ${email} to workspace of ${ownerId} with role ${role}`);
    // This function can be expanded to handle the full invitation flow.
    return Promise.resolve();
};

// --- Generic Subcollection Services ---

export const getCollectionFromUser = async <T>(userId: string, collectionName: string): Promise<T[]> => {
    const path = `users/${userId}/${collectionName}`;
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
}

export const getDocFromSubcollection = async <T>(userId: string, collectionName: string, docId: string): Promise<T | null> => {
    const path = `users/${userId}/${collectionName}/${docId}`;
    const docSnap = await getDoc(doc(db, path));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as T;
}

export const docExists = async (path: string): Promise<boolean> => {
    const docRef = doc(db, path);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

export const addDocToSubcollection = async (userId: string, collectionName: string, data: any, docId?: string) => {
    const path = `users/${userId}/${collectionName}`;
    if (docId) {
        await setDoc(doc(db, path, docId), data);
    } else {
        await addDoc(collection(db, path), data);
    }
}

export const setDocInSubcollection = async (userId: string, collectionName: string, docId: string, data: any) => {
    const path = `users/${userId}/${collectionName}/${docId}`;
    await setDoc(doc(db, path), data);
}

export const updateDocInSubcollection = async (userId: string, collectionName: string, docId: string, data: any) => {
    const path = `users/${userId}/${collectionName}/${docId}`;
    await updateDoc(doc(db, path), data);
}

export const deleteDocFromSubcollection = async (userId: string, collectionName: string, docId: string) => {
    const path = `users/${userId}/${collectionName}/${docId}`;
    await deleteDoc(doc(db, path));
}

export const updateDocTransaction = async (docRef: any, updateFunction: (data: any) => any) => {
    try {
        await runTransaction(db, async (transaction) => {
            const sfDoc = await transaction.get(docRef);
            if (!sfDoc.exists()) {
                // If the document doesn't exist, we might need to create it.
                // For stock, we assume it exists. For simplicity, we throw error if not.
                throw "Document does not exist!";
            }
            const data = sfDoc.data();
            const newValues = updateFunction(data);
            transaction.update(docRef, newValues);
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
};


// --- HSN Codes (Global Collection) ---
export const getHsnCodes = async (): Promise<HsnCode[]> => {
    const snapshot = await getDocs(collection(db, 'hsnCodes'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as HsnCode));
}

export const addHsnCode = async (hsnData: Omit<HsnCode, 'id'>): Promise<HsnCode> => {
    const docRef = doc(db, 'hsnCodes', hsnData.code);
    await setDoc(docRef, hsnData, { merge: false });
    return { ...hsnData, id: hsnData.code };
};

export const updateHsnCode = async (id: string, hsnData: Partial<HsnCode>) => {
    const docRef = doc(db, 'hsnCodes', id);
    await updateDoc(docRef, hsnData);
};

export const deleteHsnCode = async (id: string) => {
    const docRef = doc(db, 'hsnCodes', id);
    await deleteDoc(docRef);
};

export const bulkAddHsnCodes = async (hsnCodes: Omit<HsnCode, 'id'>[]) => {
    const batch = writeBatch(db);
    const hsnCollectionRef = collection(db, 'hsnCodes');
    
    hsnCodes.forEach(hsnData => {
      const docRef = doc(hsnCollectionRef, hsnData.code);
      batch.set(docRef, hsnData, { merge: true });
    });
    
    await batch.commit();
};

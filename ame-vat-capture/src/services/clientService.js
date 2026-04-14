import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, DEFAULT_FIRM_ID } from '../config/firebase.js';
import {
  normaliseVatNumber,
  normaliseRegistrationNumber,
  normalisePhone
} from '../utils/validation.js';

function clientsCollection(firmId = DEFAULT_FIRM_ID) {
  return collection(db, 'firms', firmId, 'clients');
}

function clientDocRef(clientId, firmId = DEFAULT_FIRM_ID) {
  return doc(db, 'firms', firmId, 'clients', clientId);
}

function sanitise(data) {
  return {
    businessName: (data.businessName || '').trim(),
    tradingName: (data.tradingName || '').trim(),
    vatNumber: normaliseVatNumber(data.vatNumber),
    registrationNumber: normaliseRegistrationNumber(data.registrationNumber),
    contactPerson: (data.contactPerson || '').trim(),
    phone: data.phone ? normalisePhone(data.phone) : '',
    email: (data.email || '').trim().toLowerCase(),
    whatsappNumber: data.whatsappNumber ? normalisePhone(data.whatsappNumber) : '',
    vatCategory: data.vatCategory || 'B',
    isActive: data.isActive !== false
  };
}

export async function createClient(data, firmId = DEFAULT_FIRM_ID) {
  const payload = {
    ...sanitise(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(clientsCollection(firmId), payload);
  return ref.id;
}

export async function updateClient(clientId, data, firmId = DEFAULT_FIRM_ID) {
  await updateDoc(clientDocRef(clientId, firmId), {
    ...sanitise(data),
    updatedAt: serverTimestamp()
  });
}

export async function deactivateClient(clientId, firmId = DEFAULT_FIRM_ID) {
  await updateDoc(clientDocRef(clientId, firmId), {
    isActive: false,
    updatedAt: serverTimestamp()
  });
}

export async function reactivateClient(clientId, firmId = DEFAULT_FIRM_ID) {
  await updateDoc(clientDocRef(clientId, firmId), {
    isActive: true,
    updatedAt: serverTimestamp()
  });
}

export async function deleteClient(clientId, firmId = DEFAULT_FIRM_ID) {
  await deleteDoc(clientDocRef(clientId, firmId));
}

export async function getClient(clientId, firmId = DEFAULT_FIRM_ID) {
  const snap = await getDoc(clientDocRef(clientId, firmId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeToClients(onNext, onError, firmId = DEFAULT_FIRM_ID) {
  const q = query(clientsCollection(firmId), orderBy('businessName'));
  return onSnapshot(
    q,
    (snap) => {
      const clients = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onNext(clients);
    },
    onError
  );
}

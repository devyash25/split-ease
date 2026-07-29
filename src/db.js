import {
  db,
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
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from './firebase';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function verifyPin(userId, pin) {
  const snap = await getDocs(
    query(collection(db, 'users'), where('__name__', '==', userId))
  );
  if (snap.empty) return false;
  const user = snap.docs[0].data();
  return user.pin === pin;
}

// ─── Seed Users (run once) ────────────────────────────────────────────────────

export async function seedUsers() {
  const INITIAL_USERS = [
    { 
      id: 'u1', 
      name: 'Devyash', 
      pin: '0693', 
      avatar: '/devyash.jpg',
      rollNo: '2025UEC2598',
      phone: '9971503314',
      parentsPhone: '',
      personalEmail: 'devyashjain07@gmail.com',
      collegeEmail: 'devyash.jain.ug25@nsut.ac.in',
      upiId: 'devyashjain07@oksbi',
      isAdmin: true 
    },
    { 
      id: 'u2', 
      name: 'Daksh', 
      pin: '2007', 
      avatar: '/daksh.jpg',
      rollNo: '2025UEC2604',
      phone: '9891100892',
      parentsPhone: '',
      personalEmail: 'daksh.v.jain@gmail.com',
      collegeEmail: 'daksh.jain.ug25@gmail.com',
      upiId: 'daksh.v.jain@oksbi',
      isAdmin: false 
    },
    { 
      id: 'u3', 
      name: 'Arnav', 
      pin: '0611', 
      avatar: '/arnav.jpg',
      rollNo: '2025UEC2511',
      phone: '8287319202',
      parentsPhone: '',
      personalEmail: 'arnavbrijwal722@gmail.com',
      collegeEmail: 'arnav.brijwal.ug25@gmail.com',
      upiId: '8287319202@ptyes',
      isAdmin: false 
    }
  ];

  for (const user of INITIAL_USERS) {
    await setDoc(doc(db, 'users', user.id), user);
  }
}

export async function updateUser(userId, data) {
  return updateDoc(doc(db, 'users', userId), data);
}

export async function addUser(user) {
  const newRef = doc(collection(db, 'users'));
  const newId = newRef.id;
  await setDoc(newRef, { ...user, id: newId });
  return newId;
}

export async function uploadAvatar(userId, file) {
  const fileRef = ref(storage, `avatars/${userId}_${Date.now()}`);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function addExpense(expense) {
  const expenseRef = await addDoc(collection(db, 'expenses'), {
    payerId: expense.payerId,
    payerName: expense.payerName,
    totalAmount: expense.totalAmount,
    description: expense.description,
    isRecurring: expense.isRecurring,
    expenseDate: expense.date,
    createdAt: serverTimestamp(),
  });
  return expenseRef.id;
}

export async function deleteExpenseEntirely(expenseId) {
  // 1. Delete the main expense document
  await deleteDoc(doc(db, 'expenses', expenseId));
  
  // 2. Query and delete all splits associated with this expense
  const q = query(collection(db, 'expense_splits'), where('expenseId', '==', expenseId));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'expense_splits', d.id)));
  await Promise.all(deletePromises);
}

// ─── Expense Splits ───────────────────────────────────────────────────────────

export async function addExpenseSplit(split) {
  return addDoc(collection(db, 'expense_splits'), {
    expenseId: split.expenseId,
    owerId: split.owerId,
    owerName: split.owerName,
    payerId: split.payerId,
    payerName: split.payerName,
    amount: split.amount,
    description: split.description,
    isRecurring: split.isRecurring,
    expenseDate: split.date,
    isPaid: false,
    paymentStatus: 'unpaid',
    paymentRequestedById: null,
    paymentRequestedByName: null,
    paymentRequestedAt: null,
    paymentRespondedAt: null,
    createdAt: serverTimestamp(),
  });
}

export async function markSplitPaid(splitId, isPaid) {
  return updateDoc(doc(db, 'expense_splits', splitId), {
    isPaid,
    paymentStatus: isPaid ? 'paid' : 'unpaid',
    paymentRespondedAt: serverTimestamp(),
  });
}

export async function requestSplitSettlement(splitId, requester) {
  return updateDoc(doc(db, 'expense_splits', splitId), {
    isPaid: false,
    paymentStatus: 'pending_confirmation',
    paymentRequestedById: requester.id,
    paymentRequestedByName: requester.name,
    paymentRequestedAt: serverTimestamp(),
    paymentRespondedAt: null,
  });
}

export async function confirmSplitSettlement(splitId, confirmer) {
  return updateDoc(doc(db, 'expense_splits', splitId), {
    isPaid: true,
    paymentStatus: 'paid',
    paymentConfirmedById: confirmer.id,
    paymentConfirmedByName: confirmer.name,
    paymentRespondedAt: serverTimestamp(),
  });
}

export async function rejectSplitSettlement(splitId, rejecter) {
  return updateDoc(doc(db, 'expense_splits', splitId), {
    isPaid: false,
    paymentStatus: 'unpaid',
    paymentRequestedById: null,
    paymentRequestedByName: null,
    paymentRequestedAt: null,
    paymentRejectedById: rejecter.id,
    paymentRejectedByName: rejecter.name,
    paymentRespondedAt: serverTimestamp(),
  });
}

// ─── Real-time listeners ─────────────────────────────────────────────────────

export function subscribeToMyDebts(userId, callback) {
  const q = query(
    collection(db, 'expense_splits'),
    where('owerId', '==', userId),
    where('isPaid', '==', false)
  );
  return onSnapshot(q, (snap) => {
    const debts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(debts);
  });
}

export function subscribeToOwedToMe(userId, callback) {
  const q = query(
    collection(db, 'expense_splits'),
    where('payerId', '==', userId),
    where('isPaid', '==', false)
  );
  return onSnapshot(q, (snap) => {
    const owed = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => s.owerId !== userId);
    callback(owed);
  });
}

export function subscribeToRecentExpenses(callback) {
  const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(expenses);
  });
}

export function subscribeToMyPaidDebts(userId, callback) {
  const q = query(
    collection(db, 'expense_splits'),
    where('owerId', '==', userId),
    where('isPaid', '==', true)
  );
  return onSnapshot(q, (snap) => {
    const debts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(debts);
  });
}

export function subscribeToPaidToMe(userId, callback) {
  const q = query(
    collection(db, 'expense_splits'),
    where('payerId', '==', userId),
    where('isPaid', '==', true)
  );
  return onSnapshot(q, (snap) => {
    const owed = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => s.owerId !== userId);
    callback(owed);
  });
}

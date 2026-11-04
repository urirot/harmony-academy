// Google sign-in and one progress document per person, in Firestore.
//
// The Firebase SDK loads from Google's CDN only when the app is served over
// http(s): the offline single-file build (file://) keeps progress in the
// browser alone. Each person's progress lives at users/{uid} as a JSON string
// plus an updatedAt timestamp; firestore.rules lets nobody else read it.

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0';

const CONFIG = {
  apiKey: 'AIzaSyAyAkofTWiq3Ca92sbOXRS-L12mQP7ZxPU',
  authDomain: 'harmony-academy-urirot.firebaseapp.com',
  projectId: 'harmony-academy-urirot',
  appId: '1:250032605696:web:194f6afc4f3aa6133ca6e5',
};

export const cloudAvailable = () => /^https?:$/.test(location.protocol);

let fb = null;

/** Load Firebase and report sign-in changes to onUser(user | null). */
export async function initCloud(onUser) {
  const [app, auth, store] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const firebaseApp = app.initializeApp(CONFIG);
  fb = { auth, store, a: auth.getAuth(firebaseApp), db: store.getFirestore(firebaseApp) };
  auth.onAuthStateChanged(fb.a, (user) => onUser(user ? { uid: user.uid, name: user.displayName || user.email, email: user.email, photo: user.photoURL } : null));
}

export async function signIn() {
  const provider = new fb.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await fb.auth.signInWithPopup(fb.a, provider);
  } catch (err) {
    // Some phone browsers block the popup; a full-page redirect still works.
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
      await fb.auth.signInWithRedirect(fb.a, provider);
    } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      throw err;
    }
  }
}

export const signOut = () => fb.auth.signOut(fb.a);

/** { state, updatedAt } for this person, or null if they have nothing saved yet. */
export async function readProgress(uid) {
  const snap = await fb.store.getDoc(fb.store.doc(fb.db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { state: JSON.parse(data.state), updatedAt: data.updatedAt || 0 };
}

export async function writeProgress(uid, state, updatedAt) {
  await fb.store.setDoc(fb.store.doc(fb.db, 'users', uid), {
    state: JSON.stringify(state),
    updatedAt,
    savedAt: fb.store.serverTimestamp(),
  });
}

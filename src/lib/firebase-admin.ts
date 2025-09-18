
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const serviceAccount = require('../../serviceAccountKey.json');

let adminApp: App;

if (!getApps().length) {
  adminApp = initializeApp({
    credential: credential.cert(serviceAccount),
  });
} else {
  adminApp = getApps()[0];
}

export { adminApp };

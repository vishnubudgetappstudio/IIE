import admin from 'firebase-admin';
import serviceAccount from '../../public/firebase-admin.json'; // 👈 replace with your actual path

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;

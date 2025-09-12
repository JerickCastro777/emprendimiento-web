// scripts/setAdmin.js
// Uso: node scripts/setAdmin.js <UID>
// Requiere: npm i firebase-admin
const admin = require("firebase-admin");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "..", "serviceAccountKey.json");
const args = process.argv.slice(2);

if (!args[0]) {
  console.error("Uso: node scripts/setAdmin.js <UID>");
  process.exit(1);
}
const uid = args[0];

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
});

const auth = admin.auth();
const db = admin.firestore();

(async () => {
  try {
    console.log("Setting custom claim 'admin' for uid:", uid);
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log("Custom claim set.");

    console.log("Creating/merging document users/{uid} with role 'admin'");
    await db.collection("users").doc(uid).set({ role: "admin" }, { merge: true });
    console.log("users doc updated.");

    console.log("¡Hecho! Cierra sesión en el cliente y vuelve a iniciar sesión con ese usuario para que el token se actualice.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();

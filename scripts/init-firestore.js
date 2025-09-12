// scripts/init-firestore.js
// Script para poblar Firestore con productos, specialDates y kits de ejemplo.
// Uso: exporta tus env NEXT_PUBLIC_... y corre `node scripts/init-firestore.js`

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeFirestore() {
  try {
    console.log("Initializing Firestore collections...");

    // --- Productos ya existentes (los mismos que tenías) ---
    const productsData = [
      {
        id: "camiseta-personalizada-premium",
        name: "Camiseta Personalizada Premium",
        category: "camisetas",
        basePrice: 35000,
        description: "Camiseta de alta calidad 100% algodón con personalización completa",
        images: ["/premium-custom-t-shirt.png"],
        options: {
          sizes: ["XS", "S", "M", "L", "XL", "XXL"],
          colors: ["Blanco", "Negro", "Gris", "Azul", "Rojo", "Rosa"],
          materials: ["Algodón 100%", "Poliéster", "Mezcla"],
        },
        customization: {
          allowText: true,
          allowImage: true,
          maxTextLength: 50,
        },
        tags: ["camiseta", "personalizada"],
      },
      {
        id: "pocillo-magico-cambio-color",
        name: "Pocillo Mágico Cambio de Color",
        category: "pocillos",
        basePrice: 28000,
        description: "Pocillo que cambia de color con líquidos calientes",
        images: ["/magic-color-changing-mug.png"],
        options: {
          sizes: ["11oz", "15oz"],
          colors: ["Negro a Blanco", "Azul a Blanco", "Rojo a Blanco"],
        },
        customization: {
          allowText: true,
          allowImage: true,
          maxTextLength: 30,
        },
        tags: ["pocillo", "taza", "magico"],
      },
    ];

    for (const product of productsData) {
      await setDoc(doc(db, "products", product.id), product);
      console.log(`Added/updated product: ${product.name}`);
    }

    // --- Special dates (ya tenías) ---
    const specialDatesData = [
      {
        id: "san-valentin",
        name: "Día de San Valentín",
        date: "2024-02-14",
        category: "amor",
        description: "Celebra el amor con regalos personalizados únicos",
        suggestedProducts: ["camiseta-personalizada-premium", "pocillo-magico-cambio-color"],
      },
      {
        id: "dia-madre",
        name: "Día de la Madre",
        date: "2024-05-12",
        category: "familia",
        description: "Honra a mamá con detalles especiales hechos con amor",
        suggestedProducts: ["pocillo-magico-cambio-color"],
      },
    ];

    for (const date of specialDatesData) {
      await setDoc(doc(db, "specialDates", date.id), date);
      console.log(`Added/updated special date: ${date.name}`);
    }

    // --- Kits (nuevo) ---
    const kitsData = [
      {
        id: "kit-romantico-inicial",
        name: "Kit Romántico",
        description: "Camiseta premium + pocillo mágico, ideal para demostrar cariño.",
        image: "/kit-romantico.png",
        productIds: ["camiseta-personalizada-premium", "pocillo-magico-cambio-color"],
        kitPrice: 58000,
        originalPrice: 63000,
        discount: 8,
        featured: true,
      },
      {
        id: "kit-regalo-basico",
        name: "Kit Regalo Básico",
        description: "Un kit simple para quienes buscan algo especial sin complicaciones.",
        image: "/kit-basico.png",
        productIds: ["pocillo-magico-cambio-color"],
        kitPrice: 27000,
        originalPrice: 28000,
        discount: 3,
        featured: false,
      },
    ];

    for (const kit of kitsData) {
      await setDoc(doc(db, "kits", kit.id), kit);
      console.log(`Added/updated kit: ${kit.name}`);
    }

    console.log("Firestore initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
  }
}

initializeFirestore();

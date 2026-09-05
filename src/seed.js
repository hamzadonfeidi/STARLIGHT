import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export const mockProducts = [
  {
    id: 'striped-pants',
    name: 'STRIPED LOUNGE PANTS',
    price: 85,
    description: 'Premium lightweight cotton construction. Wide leg fit for maximum comfort and an effortless silhouette. Elastic waistband. Meticulously tailored for the new era of atmospheric streetwear.',
    imageUrl: '/striped_pants.png',
    detailImageUrl: '/striped_pants_detail_1.png',
    hoverBg: 'bg-item-1',
    sizes: ['S', 'M', 'L', 'XL']
  }
];

export const seedProducts = async () => {
  if (!isFirebaseConfigured) {
    console.log('🌱 Demo Mode: Seeding local storage database...');
    const existing = localStorage.getItem('starlight_products');
    if (!existing) {
      localStorage.setItem('starlight_products', JSON.stringify(mockProducts));
      console.log('✅ Local storage seeded successfully!');
    }
    return;
  }
  
  try {
    const productsCol = collection(db, 'products');
    const snapshot = await getDocs(productsCol);
    
    if (snapshot.empty) {
      console.log('🌱 Firestore products collection is empty. Seeding initial product...');
      
      const initialProduct = {
        name: 'STRIPED LOUNGE PANTS',
        price: 85,
        description: 'Premium lightweight cotton construction. Wide leg fit for maximum comfort and an effortless silhouette. Elastic waistband. Meticulously tailored for the new era of atmospheric streetwear.',
        imageUrl: '/striped_pants.png',
        detailImageUrl: '/striped_pants_detail_1.png',
        hoverBg: 'bg-item-1',
        sizes: ['S', 'M', 'L', 'XL'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(productsCol, initialProduct);
      console.log('✅ Seeding Cloud Firestore completed successfully!');
    } else {
      console.log('🌳 Products collection already contains data. Skipping Cloud seeding.');
    }
  } catch (err) {
    console.error('❌ Error seeding Firestore products:', err);
  }
};

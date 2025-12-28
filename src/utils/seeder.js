import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { restaurantsData, restaurantMenus } from '../data/restaurants';

export const seedDatabase = async () => {
    console.log("Starting seed...");
    try {
        const restaurantsRef = collection(db, 'restaurants');
        const menuItemsRef = collection(db, 'menu_items');

        let addedCount = 0;

        for (const restaurant of restaurantsData) {
            // Check if exists
            const q = query(restaurantsRef, where("name", "==", restaurant.name));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log(`Restaurant ${restaurant.name} already exists. Skipping.`);
                continue;
            }

            // Map data
            const newRestaurant = {
                name: restaurant.name,
                image: restaurant.img, // Mapping img to image
                cuisine: restaurant.cuisine,
                rating: restaurant.rating,
                totalReviews: restaurant.reviews, // Mapping reviews
                deliveryTime: restaurant.deliveryTime,
                isActive: true, // For listing
                description: `Experience the best ${restaurant.cuisine} in town at ${restaurant.name}.`,
                deliveryFee: 25, // Default
                categories: [restaurant.category], // Enable filtering by category
                openingHours: [ // Open all days 8am - 10pm for now
                    { open: "08:00", close: "22:00", closed: false }, // Sun
                    { open: "08:00", close: "22:00", closed: false }, // Mon
                    { open: "08:00", close: "22:00", closed: false }, // Tue
                    { open: "08:00", close: "22:00", closed: false }, // Wed
                    { open: "08:00", close: "22:00", closed: false }, // Thu
                    { open: "08:00", close: "22:00", closed: false }, // Fri
                    { open: "08:00", close: "22:00", closed: false }  // Sat
                ],
                createdAt: serverTimestamp()
            };

            const docRef = await addDoc(restaurantsRef, newRestaurant);
            console.log(`Added restaurant ${restaurant.name} with ID: ${docRef.id}`);

            // Add menu items
            const menus = restaurantMenus[restaurant.name];
            if (menus) {
                for (const item of menus) {
                    await addDoc(menuItemsRef, {
                        restaurantId: docRef.id,
                        name: item.name,
                        description: item.desc,
                        price: item.price,
                        category: item.category,
                        image: item.img,
                        isActive: true,
                        available: true,
                        createdAt: serverTimestamp()
                    });
                }
                console.log(`Added ${menus.length} menu items for ${restaurant.name}`);
            }
            addedCount++;
        }
        return { success: true, message: `Added ${addedCount} restaurants.` };
    } catch (error) {
        console.error("Error seeding database:", error);
        return { success: false, error: error.message };
    }
};

import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const demoService = {
    createDemoData: async (ownerId) => {
        try {
            // 1. Create a Restaurant
            const restaurantData = {
                name: "Burger Palace",
                cuisine: "Fast Food, Burgers",
                description: "The best burgers in town! Juicy patties, fresh veggies, and our secret sauce.",
                address: "Bole, Addis Ababa",
                phone: "+251911234567",
                rating: 4.5,
                deliveryFee: 25,
                deliveryTime: "25-35 min",
                isActive: true,
                ownerId: ownerId,
                totalOrders: 0,
                totalReviews: 120,
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
                createdAt: serverTimestamp()
            };

            const restRef = await addDoc(collection(db, 'restaurants'), restaurantData);
            const restaurantId = restRef.id;

            // 2. Create Menu Items
            const menuItems = [
                {
                    name: "Classic Cheeseburger",
                    description: "Juicy beef patty with cheddar cheese, lettuce, tomato, and pickles.",
                    price: 150,
                    category: "burgers",
                    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
                    available: true,
                    restaurantId: restaurantId
                },
                {
                    name: "Double Bacon Burger",
                    description: "Two beef patties, crispy bacon, cheddar cheese, and BBQ sauce.",
                    price: 220,
                    category: "burgers",
                    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600",
                    available: true,
                    restaurantId: restaurantId
                },
                {
                    name: "Crispy French Fries",
                    description: "Golden crispy fries seasoned with sea salt.",
                    price: 60,
                    category: "sides",
                    image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=600",
                    available: true,
                    restaurantId: restaurantId
                },
                {
                    name: "Coca Cola",
                    description: "Chilled 500ml Coca Cola bottle.",
                    price: 35,
                    category: "drinks",
                    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600",
                    available: true,
                    restaurantId: restaurantId
                },
                {
                    name: "Vanilla Shake",
                    description: "Creamy vanilla milkshake topped with whipped cream.",
                    price: 85,
                    category: "drinks",
                    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600",
                    available: true,
                    restaurantId: restaurantId
                }
            ];

            for (const item of menuItems) {
                await addDoc(collection(db, 'menu_items'), {
                    ...item,
                    createdAt: serverTimestamp(),
                    isActive: true
                });
            }

            return { success: true, message: `Created "Burger Palace" with ${menuItems.length} menu items!` };
        } catch (error) {
            console.error("Error creating demo data:", error);
            return { success: false, error: error.message };
        }
    }
};

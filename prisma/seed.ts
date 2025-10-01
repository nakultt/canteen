import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menu.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing data");

  const user1 = await prisma.user.create({
    data: {
      name: "Nakul",
      email: "nakul@example.com",
      password: "password123",
      role: "USER",
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      password: "password123",
      role: "USER",
    },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "ADMIN",
    },
  });
  console.log("✅ Created 3 users");

  const chickenBiryani = await prisma.foodItem.create({
    data: {
      name: "Chicken Biryani",
      description: "Aromatic basmati rice with tender chicken pieces",
      price: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
      isAvailable: true,
    },
  });
  const vegThali = await prisma.foodItem.create({
    data: {
      name: "Veg Thali",
      description: "Complete meal with dal, sabji, roti, rice & sweet",
      price: 80,
      imageUrl:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
      isAvailable: true,
    },
  });
  const paneerTikka = await prisma.foodItem.create({
    data: {
      name: "Paneer Tikka",
      description: "Grilled cottage cheese with spices",
      price: 100,
      imageUrl:
        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400",
      isAvailable: true,
    },
  });
  const friedRice = await prisma.foodItem.create({
    data: {
      name: "Veg Fried Rice",
      description: "Indo-Chinese style fried rice with vegetables",
      price: 90,
      imageUrl:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
      isAvailable: true,
    },
  });
  const masalaDosa = await prisma.foodItem.create({
    data: {
      name: "Masala Dosa",
      description: "Crispy dosa with spiced potato filling",
      price: 60,
      imageUrl:
        "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400",
      isAvailable: true,
    },
  });
  const idli = await prisma.foodItem.create({
    data: {
      name: "Idli Sambar",
      description: "Steamed rice cakes with lentil curry",
      price: 40,
      imageUrl:
        "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400",
      isAvailable: true,
    },
  });
  const sandwich = await prisma.foodItem.create({
    data: {
      name: "Grilled Sandwich",
      description: "Toasted sandwich with vegetables and cheese",
      price: 50,
      imageUrl:
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
      isAvailable: true,
    },
  });
  const coffee = await prisma.foodItem.create({
    data: {
      name: "Coffee",
      description: "Fresh brewed coffee",
      price: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400",
      isAvailable: true,
    },
  });
  const tea = await prisma.foodItem.create({
    data: {
      name: "Masala Chai",
      description: "Indian spiced tea with milk",
      price: 25,
      imageUrl:
        "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400",
      isAvailable: true,
    },
  });
  const paratha = await prisma.foodItem.create({
    data: {
      name: "Aloo Paratha",
      description: "Stuffed flatbread with spiced potatoes",
      price: 45,
      imageUrl:
        "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400",
      isAvailable: true,
    },
  });
  const samosa = await prisma.foodItem.create({
    data: {
      name: "Samosa (2 pcs)",
      description: "Crispy fried pastry with spiced potato filling",
      price: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
      isAvailable: true,
    },
  });
  const pakora = await prisma.foodItem.create({
    data: {
      name: "Veg Pakora",
      description: "Mixed vegetable fritters",
      price: 40,
      imageUrl:
        "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400",
      isAvailable: true,
    },
  });
  console.log("✅ Created 12 food items");

  // Use current year for time comparison
  const currentYear = new Date().getFullYear();
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  for (const day of days) {
    await prisma.menu.create({
      data: {
        dayOfWeek: day,
        mealType: "Breakfast",
        startTime: new Date(`${currentYear}-01-01T07:00:00`),
        endTime: new Date(`${currentYear}-01-01T10:00:00`),
        items: {
          create: [
            { foodItemId: masalaDosa.id },
            { foodItemId: idli.id },
            { foodItemId: paratha.id },
            { foodItemId: sandwich.id },
            { foodItemId: coffee.id },
            { foodItemId: tea.id },
          ],
        },
      },
    });

    await prisma.menu.create({
      data: {
        dayOfWeek: day,
        mealType: "Lunch",
        startTime: new Date(`${currentYear}-01-01T12:00:00`),
        endTime: new Date(`${currentYear}-01-01T15:00:00`),
        items: {
          create: [
            { foodItemId: chickenBiryani.id },
            { foodItemId: vegThali.id },
            { foodItemId: paneerTikka.id },
            { foodItemId: friedRice.id },
          ],
        },
      },
    });

    await prisma.menu.create({
      data: {
        dayOfWeek: day,
        mealType: "Snacks",
        startTime: new Date(`${currentYear}-01-01T16:00:00`),
        endTime: new Date(`${currentYear}-01-01T18:00:00`),
        items: {
          create: [
            { foodItemId: samosa.id },
            { foodItemId: pakora.id },
            { foodItemId: coffee.id },
            { foodItemId: tea.id },
          ],
        },
      },
    });

    await prisma.menu.create({
      data: {
        dayOfWeek: day,
        mealType: "Dinner",
        startTime: new Date(`${currentYear}-01-01T19:00:00`),
        endTime: new Date(`${currentYear}-01-01T22:00:00`),
        items: {
          create: [
            { foodItemId: chickenBiryani.id },
            { foodItemId: vegThali.id },
            { foodItemId: friedRice.id },
          ],
        },
      },
    });
  }
  console.log("✅ Created menus for all 7 days");

  const cart1 = await prisma.cart.create({
    data: {
      userId: user1.id,
      items: {
        create: [
          { foodItemId: chickenBiryani.id, quantity: 2 },
          { foodItemId: coffee.id, quantity: 1 },
        ],
      },
    },
  });
  console.log("✅ Created sample cart");

  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      totalAmount: 240,
      status: "COMPLETED",
      orderItems: {
        create: [{ foodItemId: chickenBiryani.id, quantity: 2, price: 120 }],
      },
    },
  });
  console.log("✅ Created sample order");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("  - 3 Users");
  console.log("  - 12 Food Items");
  console.log("  - 28 Menus (4 meal types × 7 days)");
  console.log("  - 1 Cart with items");
  console.log("  - 1 Order");
  console.log("\n🌐 Access at: http://localhost:3000");
  console.log("🔐 Test Login: nakul@example.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

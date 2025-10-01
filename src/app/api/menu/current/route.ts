import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const menus = await prisma.menu.findMany({
      where: {
        dayOfWeek: currentDay,
      },
      include: { items: { include: { foodItem: true } } },
    });

    const activeMenu = menus.find((menu) => {
      const startTime =
        new Date(menu.startTime).getHours() * 60 +
        new Date(menu.startTime).getMinutes();
      const endTime =
        new Date(menu.endTime).getHours() * 60 +
        new Date(menu.endTime).getMinutes();
      return currentTime >= startTime && currentTime <= endTime;
    });

    if (!activeMenu) {
      return NextResponse.json({
        message: "No menu available at this time",
        foodItems: [],
        mealType: null,
        closingTime: null,
      });
    }

    const foodItem = activeMenu.items
      .filter((items) => items.foodItem.isAvailable)
      .map((item) => item.foodItem);

    return NextResponse.json({
      mealtype: activeMenu.mealType,
      closingTime: activeMenu.endTime,
      foodItem,
    });
  } catch (e) {
    console.error("Error fetching current menu:", e);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

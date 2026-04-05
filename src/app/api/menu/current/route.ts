import { query } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use company from JWT, not query param; require company_id
    const companyId = user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: "No company associated with your account" },
        { status: 400 }
      );
    }

    // Get current day and time
    const now = new Date();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5);

    // Get current menu based on day and time
    const menus = await query<{
      menu_id: number;
      day_of_week: string;
      meal_type: string;
      start_time: string;
      end_time: string;
      food_id: number;
      food_name: string;
      food_description: string | null;
      food_price: number;
      food_image_url: string | null;
      food_is_available: boolean;
    }>(`
      SELECT 
        m.id as menu_id,
        m.day_of_week,
        m.meal_type,
        m.start_time::text,
        m.end_time::text,
        f.id as food_id,
        f.name as food_name,
        f.description as food_description,
        f.price as food_price,
        f.image_url as food_image_url,
        f.is_available as food_is_available
      FROM menus m
      LEFT JOIN menu_items mi ON m.id = mi.menu_id
      LEFT JOIN food_items f ON mi.food_item_id = f.id
      WHERE m.company_id = $1
        AND m.day_of_week = $2
        AND m.start_time <= $3::time
        AND m.end_time >= $3::time
      ORDER BY m.meal_type, f.name
    `, [companyId, currentDay, currentTime]);

    // Group items by menu
    const menuMap = new Map<number, {
      id: number;
      day_of_week: string;
      meal_type: string;
      start_time: string;
      end_time: string;
      items: { id: number; name: string; description: string | null; price: number; image_url: string | null; is_available: boolean }[];
    }>();

    for (const row of menus) {
      if (!menuMap.has(row.menu_id)) {
        menuMap.set(row.menu_id, {
          id: row.menu_id,
          day_of_week: row.day_of_week,
          meal_type: row.meal_type,
          start_time: row.start_time,
          end_time: row.end_time,
          items: [],
        });
      }

      if (row.food_id) {
        menuMap.get(row.menu_id)!.items.push({
          id: row.food_id,
          name: row.food_name,
          description: row.food_description,
          price: row.food_price,
          image_url: row.food_image_url,
          is_available: row.food_is_available,
        });
      }
    }

    const result = Array.from(menuMap.values());

    // If no current menu, return all menus for today
    if (result.length === 0) {
      const allMenus = await query<{
        menu_id: number;
        day_of_week: string;
        meal_type: string;
        start_time: string;
        end_time: string;
        food_id: number;
        food_name: string;
        food_description: string | null;
        food_price: number;
        food_image_url: string | null;
        food_is_available: boolean;
      }>(`
        SELECT 
          m.id as menu_id,
          m.day_of_week,
          m.meal_type,
          m.start_time::text,
          m.end_time::text,
          f.id as food_id,
          f.name as food_name,
          f.description as food_description,
          f.price as food_price,
          f.image_url as food_image_url,
          f.is_available as food_is_available
        FROM menus m
        LEFT JOIN menu_items mi ON m.id = mi.menu_id
        LEFT JOIN food_items f ON mi.food_item_id = f.id
        WHERE m.company_id = $1 AND m.day_of_week = $2
        ORDER BY m.start_time, f.name
      `, [companyId, currentDay]);

      for (const row of allMenus) {
        if (!menuMap.has(row.menu_id)) {
          menuMap.set(row.menu_id, {
            id: row.menu_id,
            day_of_week: row.day_of_week,
            meal_type: row.meal_type,
            start_time: row.start_time,
            end_time: row.end_time,
            items: [],
          });
        }

        if (row.food_id) {
          menuMap.get(row.menu_id)!.items.push({
            id: row.food_id,
            name: row.food_name,
            description: row.food_description,
            price: row.food_price,
            image_url: row.food_image_url,
            is_available: row.food_is_available,
          });
        }
      }

      return NextResponse.json({
        currentTime,
        currentDay,
        menus: Array.from(menuMap.values()),
        message: "Showing all menus for today (outside active meal times)",
      });
    }

    return NextResponse.json({
      currentTime,
      currentDay,
      menus: result,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error fetching current menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}

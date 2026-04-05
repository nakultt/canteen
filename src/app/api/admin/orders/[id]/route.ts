import { queryOne } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { eventBus } from "@/lib/events";
import { NextResponse } from "next/server";

// UPDATE order status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (user.role === "USER") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    // Verify the order belongs to admin's company (unless DEV)
    if (user.role === "ADMIN" && user.companyId) {
      const orderUser = await queryOne<{ company_id: number | null }>(
        `SELECT u.company_id FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
        [id]
      );
      if (orderUser && orderUser.company_id !== user.companyId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const order = await queryOne<{
      id: number;
      status: string;
      user_id: number;
    }>(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING id, status, user_id`,
      [status, id]
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    eventBus.emit({
      type: "order:updated",
      data: { orderId: order.id, status: order.status, userId: order.user_id },
      companyId: user.companyId,
    });

    return NextResponse.json({
      order: { id: order.id, status: order.status },
      message: "Order status updated successfully",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

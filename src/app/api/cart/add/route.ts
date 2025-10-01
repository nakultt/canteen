import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma  = new PrismaClient()

export async function POST(req:NextRequest) {
  try{
    const { userId, foodItemId, quantity =1} = await req.json()

    if (!userId || !foodItemId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let cart = await prisma.cart.findUnique({
      where: {userId}
    })

    if(!cart){
      cart = await prisma.cart.create({
        data:{
          userId
        }
      })
    }

    const existingCartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_foodItemId: {
          cartId: cart.id,
          foodItemId,
        },
      },
    });

    let cartItem
    if(existingCartItem) {
      cartItem = await prisma.cartItem.update({
        where: {id: existingCartItem.id},
        data: {quantity: existingCartItem.quantity+quantity},
        include: {foodItem: true}
      })
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          foodItemId,
          quantity
        },
        include: {foodItem: true}
      })
    }

    return NextResponse.json({ 
      message: 'Item added to cart',
      cartItem 
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}
  
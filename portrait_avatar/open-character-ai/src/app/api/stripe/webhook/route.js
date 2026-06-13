import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`[WEBHOOK_ERROR] Signature verification failed:`, err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Extract metadata
      const userId = session.metadata?.userId;
      const creditsToAdd = parseInt(session.metadata?.credits || "0", 10);

      if (userId && creditsToAdd > 0) {
        // Securely update the user's credit balance in the database
        await prisma.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: creditsToAdd,
            },
          },
        });
        
        console.log(`[WEBHOOK_SUCCESS] Successfully added ${creditsToAdd} credits to user ${userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_FATAL_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

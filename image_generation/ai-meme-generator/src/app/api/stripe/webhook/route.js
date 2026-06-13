import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { BillingService } from "@/lib/services/billing";

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  try {
    const result = await BillingService.handleWebhook(body, signature);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }
}

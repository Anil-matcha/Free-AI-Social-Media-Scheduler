import { NextResponse } from "next/server";
import { BillingService } from "@/lib/services/billing";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const result = await BillingService.handleWebhook(body, signature);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return new NextResponse("Webhook Error", { status: 400 });
  }
}

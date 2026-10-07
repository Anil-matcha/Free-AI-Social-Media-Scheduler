import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { BillingService } from "../../../../lib/services/billing";

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature");

  if (!signature) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    const result = await BillingService.handleWebhook(body, signature);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return new NextResponse(error.message || "Internal Error", { status: 400 });
  }
}

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { BillingService } from "@/lib/services/billing";

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const result = await BillingService.handleWebhook(body, signature);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[BILLING_WEBHOOK_ERROR]", error);
    return new NextResponse(error.message || "Webhook Error", { status: 400 });
  }
}

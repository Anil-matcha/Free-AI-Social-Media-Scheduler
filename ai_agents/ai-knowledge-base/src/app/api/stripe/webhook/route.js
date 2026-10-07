import { NextResponse } from "next/server";
import { BillingService } from "../../../../lib/services/billing";

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  try {
    const result = await BillingService.handleWebhook(body, signature);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

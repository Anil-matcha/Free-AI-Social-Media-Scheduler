import Stripe from "stripe";
import config from "./config";

const apiKey = config.stripe.secretKey && config.stripe.secretKey.trim() !== ""
  ? config.stripe.secretKey
  : "sk_test_placeholder_key_for_build_purposes";

export const stripe = new Stripe(apiKey, {
  apiVersion: "2023-10-16",
});

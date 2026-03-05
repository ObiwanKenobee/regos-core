export const SUBSCRIPTION_TIERS = {
  steward: {
    name: "Steward",
    price_id: "price_1T7XUhPKmViom0HbIGgryX1i",
    product_id: "prod_U5iwgL1KJ7kQqN",
    price: 0,
    features: [
      "Public RCI dashboards",
      "Community participation",
      "Basic notifications",
      "Read-only methodology access",
    ],
    max_members: 1,
    max_api_keys: 0,
    api_rate_limit: 0,
  },
  architect: {
    name: "Architect",
    price_id: "price_1T7XUyPKmViom0HbxKgeFVeq",
    product_id: "prod_U5iw4oSPGOvudO",
    price: 149,
    features: [
      "Advanced RCI analytics",
      "Policy simulation engine",
      "Team workspaces (up to 10)",
      "API access (1,000 req/day)",
      "Bond lifecycle management",
      "Impact token portfolio",
    ],
    max_members: 10,
    max_api_keys: 5,
    api_rate_limit: 1000,
  },
  sovereign: {
    name: "Sovereign",
    price_id: "price_1T7XVDPKmViom0HbKbEmWuoM",
    product_id: "prod_U5ix5aLtQNychW",
    price: 499,
    features: [
      "Full sovereign suite",
      "Unlimited team members",
      "Unlimited API access",
      "Bond issuance & lifecycle",
      "Multi-sig verification",
      "Dedicated support",
      "Custom data integrations",
      "White-label dashboards",
    ],
    max_members: -1,
    max_api_keys: -1,
    api_rate_limit: -1,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export function getTierByProductId(productId: string): SubscriptionTier | null {
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (tier.product_id === productId) return key as SubscriptionTier;
  }
  return null;
}

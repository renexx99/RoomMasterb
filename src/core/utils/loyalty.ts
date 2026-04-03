// src/core/utils/loyalty.ts

import { LoyaltyConfig, LoyaltyTier } from '@/core/types/database';

// --- Default Configuration (used when hotel has no custom config) ---
export const DEFAULT_LOYALTY_CONFIG: Omit<LoyaltyConfig, 'id' | 'hotel_id' | 'created_at' | 'updated_at'> = {
  points_per_night: 10,
  points_per_spend_unit: 1,
  spend_unit_amount: 100000, // Rp 100,000
  completion_bonus: 50,
  tier_bronze: 0,
  tier_silver: 500,
  tier_gold: 2000,
  tier_platinum: 5000,
  tier_diamond: 10000,
};

export type LoyaltyConfigValues = typeof DEFAULT_LOYALTY_CONFIG;

// --- Points Calculation ---

export interface StayPointsBreakdown {
  nightsPoints: number;
  spendPoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export function calculatePointsForStay(
  nights: number,
  totalSpend: number,
  config: LoyaltyConfigValues = DEFAULT_LOYALTY_CONFIG
): StayPointsBreakdown {
  const nightsPoints = nights * config.points_per_night;
  const spendPoints = Math.floor(totalSpend / config.spend_unit_amount) * config.points_per_spend_unit;
  const bonusPoints = config.completion_bonus;
  return {
    nightsPoints,
    spendPoints,
    bonusPoints,
    totalPoints: nightsPoints + spendPoints + bonusPoints,
  };
}

// --- Tier Logic (all values lowercase to match DB enum guest_tier) ---

export function getTierForPoints(
  points: number,
  config: LoyaltyConfigValues = DEFAULT_LOYALTY_CONFIG
): LoyaltyTier {
  if (points >= config.tier_diamond) return 'diamond';
  if (points >= config.tier_platinum) return 'platinum';
  if (points >= config.tier_gold) return 'gold';
  if (points >= config.tier_silver) return 'silver';
  return 'bronze';
}

export interface TierProgress {
  currentTier: LoyaltyTier;
  currentPoints: number;
  nextTier: LoyaltyTier | null;
  nextTierThreshold: number | null;
  pointsToNextTier: number | null;
  progressPercent: number; // 0-100
}

export function getTierProgress(
  points: number,
  config: LoyaltyConfigValues = DEFAULT_LOYALTY_CONFIG
): TierProgress {
  const currentTier = getTierForPoints(points, config);
  
  const tiers: { tier: LoyaltyTier; threshold: number }[] = [
    { tier: 'bronze', threshold: config.tier_bronze },
    { tier: 'silver', threshold: config.tier_silver },
    { tier: 'gold', threshold: config.tier_gold },
    { tier: 'platinum', threshold: config.tier_platinum },
    { tier: 'diamond', threshold: config.tier_diamond },
  ];

  const currentIndex = tiers.findIndex(t => t.tier === currentTier);
  const isMaxTier = currentIndex === tiers.length - 1;

  if (isMaxTier) {
    return {
      currentTier,
      currentPoints: points,
      nextTier: null,
      nextTierThreshold: null,
      pointsToNextTier: null,
      progressPercent: 100,
    };
  }

  const currentThreshold = tiers[currentIndex].threshold;
  const nextTierInfo = tiers[currentIndex + 1];
  const range = nextTierInfo.threshold - currentThreshold;
  const progress = points - currentThreshold;
  const progressPercent = Math.min(Math.round((progress / range) * 100), 100);

  return {
    currentTier,
    currentPoints: points,
    nextTier: nextTierInfo.tier,
    nextTierThreshold: nextTierInfo.threshold,
    pointsToNextTier: nextTierInfo.threshold - points,
    progressPercent,
  };
}

// --- Display Helpers ---
// These take the raw DB value (lowercase) and return display info

export function getTierColor(tier: string): string {
  switch (tier?.toLowerCase()) {
    case 'diamond': return 'violet';
    case 'platinum': return 'cyan';
    case 'gold': return 'yellow';
    case 'silver': return 'gray';
    default: return 'orange'; // bronze
  }
}

/** Capitalize tier name for UI display */
export function getTierLabel(tier: string): string {
  if (!tier) return 'Bronze';
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

export function getTierBenefits(tier: string): string[] {
  switch (tier?.toLowerCase()) {
    case 'diamond':
      return ['20% Room Discount', 'All Privileges', 'Dedicated Concierge', 'Free Suite Upgrade', 'Free Breakfast'];
    case 'platinum':
      return ['15% Room Discount', 'Suite Upgrade Priority', 'Free Breakfast', 'Late Checkout'];
    case 'gold':
      return ['10% Room Discount', 'Room Upgrade Priority', 'Late Checkout (2PM)'];
    case 'silver':
      return ['5% Room Discount', 'Early Check-in', 'Welcome Amenity'];
    case 'bronze':
    default:
      return ['Welcome Drink', 'Base Rate'];
  }
}

export function formatPoints(points: number): string {
  return points.toLocaleString('en-US');
}

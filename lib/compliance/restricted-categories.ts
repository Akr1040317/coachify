/**
 * Restricted Business Categories for Stripe Marketplace Compliance
 * 
 * As a marketplace platform, we are responsible for ensuring coaches
 * are not operating in restricted business categories or selling restricted products.
 * 
 * Reference: https://stripe.com/docs/connect/restricted-businesses
 */

export const RESTRICTED_CATEGORIES = [
  // Financial services
  "financial_services",
  "investment_advice",
  "cryptocurrency_trading",
  "forex_trading",
  
  // Adult content
  "adult_content",
  "adult_entertainment",
  
  // Gambling
  "gambling",
  "lottery",
  "betting",
  
  // Regulated products
  "tobacco",
  "e_cigarettes",
  "alcohol",
  "pharmaceuticals",
  "prescription_drugs",
  
  // Weapons
  "weapons",
  "firearms",
  "ammunition",
  
  // Illegal activities
  "illegal_activities",
  "counterfeit_goods",
  "stolen_goods",
  
  // High-risk services
  "pyramid_schemes",
  "multi_level_marketing",
  "get_rich_quick_schemes",
] as const;

export type RestrictedCategory = typeof RESTRICTED_CATEGORIES[number];

/**
 * Keywords that might indicate restricted business activity
 */
export const RESTRICTED_KEYWORDS = [
  // Financial
  "investment", "trading", "forex", "crypto", "bitcoin", "stock market",
  "financial advice", "investment advice", "trading signals",
  
  // Adult
  "adult", "explicit", "xxx", "porn", "escort",
  
  // Gambling
  "bet", "gamble", "casino", "lottery", "poker", "sports betting",
  
  // Regulated
  "cigarette", "tobacco", "vape", "alcohol", "pharmaceutical", "prescription",
  
  // Weapons
  "weapon", "firearm", "gun", "ammunition", "knife",
  
  // Illegal
  "illegal", "counterfeit", "stolen", "pirated",
  
  // High-risk
  "pyramid", "mlm", "multi level", "get rich quick", "make money fast",
] as const;

export interface ComplianceCheckResult {
  isCompliant: boolean;
  restrictedCategories: RestrictedCategory[];
  flaggedKeywords: string[];
  warnings: string[];
  requiresReview: boolean;
}

/**
 * Check if coach data indicates any restricted business categories
 */
export function checkCoachCompliance(coachData: {
  bio?: string;
  headline?: string;
  coachingPhilosophy?: string;
  specialtiesBySport?: Record<string, string[]>;
  credentials?: string[];
}): ComplianceCheckResult {
  const restrictedCategories: RestrictedCategory[] = [];
  const flaggedKeywords: string[] = [];
  const warnings: string[] = [];
  
  // Combine all text fields for keyword checking
  const textToCheck = [
    coachData.bio || "",
    coachData.headline || "",
    coachData.coachingPhilosophy || "",
    ...(coachData.credentials || []),
    ...Object.values(coachData.specialtiesBySport || {}).flat(),
  ].join(" ").toLowerCase();
  
  // Check for restricted keywords
  for (const keyword of RESTRICTED_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      flaggedKeywords.push(keyword);
      
      // Map keywords to categories
      if (keyword.includes("investment") || keyword.includes("trading") || keyword.includes("forex") || keyword.includes("crypto")) {
        if (!restrictedCategories.includes("financial_services")) {
          restrictedCategories.push("financial_services");
        }
      }
      if (keyword.includes("adult") || keyword.includes("explicit") || keyword.includes("xxx")) {
        if (!restrictedCategories.includes("adult_content")) {
          restrictedCategories.push("adult_content");
        }
      }
      if (keyword.includes("bet") || keyword.includes("gamble") || keyword.includes("casino")) {
        if (!restrictedCategories.includes("gambling")) {
          restrictedCategories.push("gambling");
        }
      }
      if (keyword.includes("tobacco") || keyword.includes("cigarette") || keyword.includes("vape")) {
        if (!restrictedCategories.includes("tobacco")) {
          restrictedCategories.push("tobacco");
        }
      }
      if (keyword.includes("weapon") || keyword.includes("firearm") || keyword.includes("gun")) {
        if (!restrictedCategories.includes("weapons")) {
          restrictedCategories.push("weapons");
        }
      }
    }
  }
  
  // Check for specific patterns that require review
  if (textToCheck.includes("make money") || textToCheck.includes("earn money") || textToCheck.includes("passive income")) {
    warnings.push("Content mentions money-making opportunities - review for MLM/pyramid schemes");
  }
  
  // Sports coaching is generally compliant, but flag if bio/headline is suspiciously vague
  if (!coachData.bio || coachData.bio.length < 20) {
    warnings.push("Bio is very short - ensure coach is providing legitimate sports coaching services");
  }
  
  const isCompliant = restrictedCategories.length === 0 && flaggedKeywords.length === 0;
  const requiresReview = restrictedCategories.length > 0 || flaggedKeywords.length > 0 || warnings.length > 0;
  
  return {
    isCompliant,
    restrictedCategories,
    flaggedKeywords,
    warnings,
    requiresReview,
  };
}

/**
 * Get human-readable description of restricted category
 */
export function getCategoryDescription(category: RestrictedCategory): string {
  const descriptions: Record<RestrictedCategory, string> = {
    financial_services: "Financial services or investment advice",
    investment_advice: "Investment or trading advice",
    cryptocurrency_trading: "Cryptocurrency trading services",
    forex_trading: "Forex trading services",
    adult_content: "Adult content or entertainment",
    adult_entertainment: "Adult entertainment services",
    gambling: "Gambling or betting services",
    lottery: "Lottery services",
    betting: "Sports betting or gambling",
    tobacco: "Tobacco products",
    e_cigarettes: "E-cigarettes or vaping products",
    alcohol: "Alcohol sales",
    pharmaceuticals: "Pharmaceutical products",
    prescription_drugs: "Prescription drugs",
    weapons: "Weapons or firearms",
    firearms: "Firearms",
    ammunition: "Ammunition",
    illegal_activities: "Illegal activities",
    counterfeit_goods: "Counterfeit goods",
    stolen_goods: "Stolen goods",
    pyramid_schemes: "Pyramid schemes",
    multi_level_marketing: "Multi-level marketing",
    get_rich_quick_schemes: "Get-rich-quick schemes",
  };
  
  return descriptions[category] || category;
}


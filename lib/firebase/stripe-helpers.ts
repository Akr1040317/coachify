import { getCoachData } from "./firestore";

export interface StripeStatus {
  hasAccount: boolean;
  status: "not_setup" | "pending" | "active" | "restricted";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  missingRequirements?: string[];
}

export interface RequirementsStatus {
  currentlyDue: string[];
  eventuallyDue: string[];
  pastDue: string[];
  pendingVerification?: {
    type: string;
    status: string;
  }[];
}

/**
 * Check Stripe Connect account status for a coach
 */
export async function checkStripeConnectStatus(coachId: string): Promise<StripeStatus> {
  try {
    const coach = await getCoachData(coachId);
    
    if (!coach || !coach.stripeConnectAccountId) {
      return {
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    // Fetch account status from API
    const response = await fetch(`/api/coaches/stripe-connect/onboarding?coachId=${coachId}`);
    if (!response.ok) {
      return {
        hasAccount: true,
        status: "pending",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    const data = await response.json();
    
    if (data.status === "active") {
      return {
        hasAccount: true,
        status: "active",
        chargesEnabled: data.chargesEnabled || false,
        payoutsEnabled: data.payoutsEnabled || false,
        detailsSubmitted: data.detailsSubmitted || false,
      };
    }

    return {
      hasAccount: true,
      status: data.status === "pending" ? "pending" : "restricted",
      chargesEnabled: data.chargesEnabled || false,
      payoutsEnabled: data.payoutsEnabled || false,
      detailsSubmitted: data.detailsSubmitted || false,
    };
  } catch (error) {
    console.error("Error checking Stripe Connect status:", error);
    return {
      hasAccount: false,
      status: "not_setup",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }
}

/**
 * Check if coach can receive payments (account is fully set up)
 */
export async function canCoachReceivePayments(coachId: string): Promise<boolean> {
  const status = await checkStripeConnectStatus(coachId);
  return status.status === "active" && status.chargesEnabled && status.payoutsEnabled;
}

/**
 * Get detailed account requirements status
 */
export async function getStripeAccountRequirements(coachId: string): Promise<RequirementsStatus> {
  try {
    const coach = await getCoachData(coachId);
    if (!coach || !coach.stripeConnectAccountId) {
      return {
        currentlyDue: [],
        eventuallyDue: [],
        pastDue: [],
      };
    }

    // This would ideally call Stripe API to get requirements
    // For now, return basic structure
    return {
      currentlyDue: [],
      eventuallyDue: [],
      pastDue: [],
    };
  } catch (error) {
    console.error("Error getting account requirements:", error);
    return {
      currentlyDue: [],
      eventuallyDue: [],
      pastDue: [],
    };
  }
}

/**
 * Check if Stripe setup is complete
 */
export async function isStripeSetupComplete(coachId: string): Promise<boolean> {
  return await canCoachReceivePayments(coachId);
}


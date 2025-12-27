/**
 * Risk Monitoring for Marketplace Liability
 * 
 * As a marketplace platform, we need to monitor for high-risk coaches
 * and transactions to prevent chargebacks, disputes, and compliance issues.
 */

import { CoachData, PurchaseData, DisputeData, getPurchases, getDisputes } from "@/lib/firebase/firestore";
import { Timestamp, where } from "firebase/firestore";

export interface RiskScore {
  coachId: string;
  overallScore: number; // 0-100, higher = more risky
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  type: "chargeback_rate" | "dispute_rate" | "refund_rate" | "compliance" | "low_ratings" | "recent_activity";
  severity: "low" | "medium" | "high" | "critical";
  score: number; // 0-100
  description: string;
  details?: any;
}

/**
 * Calculate risk score for a coach
 */
export async function calculateCoachRiskScore(coachId: string, coachData: CoachData): Promise<RiskScore> {
  const factors: RiskFactor[] = [];
  let totalScore = 0;
  
  // Get purchase and dispute data
  const purchases = await getPurchases([where("coachId", "==", coachId)]);
  const disputes = await getDisputes([where("coachId", "==", coachId)]);
  const refunds = purchases.filter(p => p.status === "refunded");
  
  // Factor 1: Chargeback/Dispute Rate
  if (purchases.length > 0) {
    const disputeRate = (disputes.length / purchases.length) * 100;
    let severity: RiskFactor["severity"] = "low";
    let score = 0;
    
    if (disputeRate > 5) {
      severity = "critical";
      score = 100;
    } else if (disputeRate > 2) {
      severity = "high";
      score = 75;
    } else if (disputeRate > 1) {
      severity = "medium";
      score = 50;
    } else if (disputeRate > 0) {
      severity = "low";
      score = 25;
    }
    
    if (disputeRate > 0) {
      factors.push({
        type: "dispute_rate",
        severity,
        score,
        description: `${disputeRate.toFixed(1)}% dispute rate (${disputes.length} disputes / ${purchases.length} purchases)`,
        details: { disputeRate, disputeCount: disputes.length, purchaseCount: purchases.length },
      });
      totalScore += score * 0.4; // 40% weight
    }
  }
  
  // Factor 2: Refund Rate
  if (purchases.length > 0) {
    const refundRate = (refunds.length / purchases.length) * 100;
    let severity: RiskFactor["severity"] = "low";
    let score = 0;
    
    if (refundRate > 10) {
      severity = "critical";
      score = 100;
    } else if (refundRate > 5) {
      severity = "high";
      score = 75;
    } else if (refundRate > 2) {
      severity = "medium";
      score = 50;
    } else if (refundRate > 0) {
      severity = "low";
      score = 25;
    }
    
    if (refundRate > 0) {
      factors.push({
        type: "refund_rate",
        severity,
        score,
        description: `${refundRate.toFixed(1)}% refund rate (${refunds.length} refunds / ${purchases.length} purchases)`,
        details: { refundRate, refundCount: refunds.length, purchaseCount: purchases.length },
      });
      totalScore += score * 0.2; // 20% weight
    }
  }
  
  // Factor 3: Compliance Status
  if (coachData.complianceStatus === "flagged" || coachData.complianceStatus === "rejected") {
    factors.push({
      type: "compliance",
      severity: "high",
      score: 80,
      description: `Compliance status: ${coachData.complianceStatus}`,
      details: { complianceStatus: coachData.complianceStatus, notes: coachData.complianceNotes },
    });
    totalScore += 80 * 0.2; // 20% weight
  }
  
  // Factor 4: Low Ratings
  if (coachData.ratingCount && coachData.ratingCount >= 5) {
    const avgRating = coachData.ratingAvg || 0;
    if (avgRating < 3.0) {
      factors.push({
        type: "low_ratings",
        severity: "medium",
        score: 60,
        description: `Low average rating: ${avgRating.toFixed(1)}/5.0 (${coachData.ratingCount} reviews)`,
        details: { avgRating, ratingCount: coachData.ratingCount },
      });
      totalScore += 60 * 0.1; // 10% weight
    }
  }
  
  // Factor 5: Recent Activity (new coaches with no history are higher risk)
  if (coachData.createdAt) {
    const daysSinceCreation = (Date.now() - coachData.createdAt.toMillis()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30 && purchases.length === 0) {
      factors.push({
        type: "recent_activity",
        severity: "low",
        score: 30,
        description: "New coach with no purchase history yet",
        details: { daysSinceCreation, purchaseCount: purchases.length },
      });
      totalScore += 30 * 0.1; // 10% weight
    }
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (factors.some(f => f.type === "dispute_rate" && f.severity === "critical")) {
    recommendations.push("⚠️ CRITICAL: High dispute rate detected. Consider suspending coach until issues are resolved.");
  }
  if (factors.some(f => f.type === "refund_rate" && f.severity === "high")) {
    recommendations.push("High refund rate. Review coach's service quality and customer satisfaction.");
  }
  if (factors.some(f => f.type === "compliance")) {
    recommendations.push("Compliance issues detected. Review coach's profile and business practices.");
  }
  if (totalScore > 70) {
    recommendations.push("Overall risk score is high. Monitor this coach closely and consider additional verification.");
  }
  if (disputes.some(d => d.status === "needs_response" || d.status === "warning_needs_response")) {
    recommendations.push("Active disputes require response. Ensure evidence is submitted to Stripe before deadlines.");
  }
  
  return {
    coachId,
    overallScore: Math.min(100, Math.round(totalScore)),
    factors,
    recommendations,
  };
}

/**
 * Get high-risk coaches (score > 50)
 */
export async function getHighRiskCoaches(coaches: (CoachData & { id: string })[]): Promise<(RiskScore & { coach: CoachData & { id: string } })[]> {
  const riskScores = await Promise.all(
    coaches.map(async (coach) => {
      const score = await calculateCoachRiskScore(coach.userId, coach);
      return { ...score, coach };
    })
  );
  
  return riskScores
    .filter(rs => rs.overallScore > 50)
    .sort((a, b) => b.overallScore - a.overallScore);
}




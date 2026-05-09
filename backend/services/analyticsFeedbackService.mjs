import { prisma } from '../prismaClient.mjs';

/**
 * Phase 4: Feedback & Learning Loop Service
 * Updates decision weights based on real-world outcomes.
 */
export class AnalyticsFeedbackService {
  /**
   * Record a user's response to a recommendation and update the rule's weight.
   */
  static async recordFeedback(tenantId, recommendationId, ruleType, actionTaken, outcomeScore = 0) {
    try {
      // 1. Log the feedback
      await prisma.analyticsFeedback.create({
        data: {
          tenantId,
          recommendationId,
          actionTaken,
          outcomeScore
        }
      });

      // 2. Update Rule Weight (Simple Reinforcement Learning)
      // If action was taken and outcome was positive, increase weight.
      // If action was ignored/failed, decrease weight slightly.
      const rule = await prisma.recommendationRule.upsert({
        where: { ruleType },
        update: {},
        create: { ruleType, weight: 1.0 }
      });

      let newWeight = rule.weight;
      if (actionTaken && outcomeScore > 0) {
        newWeight += 0.05; // Reinforce success
        await prisma.recommendationRule.update({
          where: { ruleType },
          data: { 
            weight: Math.min(newWeight, 5.0), 
            successCount: { increment: 1 } 
          }
        });
      } else if (!actionTaken) {
        newWeight -= 0.01; // Decay ignored rules
        await prisma.recommendationRule.update({
          where: { ruleType },
          data: { 
            weight: Math.max(newWeight, 0.1), 
            failureCount: { increment: 1 } 
          }
        });
      }

      return { success: true, newWeight };
    } catch (error) {
      console.error('[Feedback Service] Error:', error.message);
      return { success: false };
    }
  }

  /**
   * Get dynamic weights for the recommender engine.
   */
  static async getRuleWeights() {
    const rules = await prisma.recommendationRule.findMany();
    const weights = {};
    rules.forEach(r => { weights[r.ruleType] = r.weight; });
    return weights;
  }
}

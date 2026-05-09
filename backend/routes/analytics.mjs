import express from 'express';
import { authMiddleware } from '../authMiddleware.mjs';
import { AnalyticsService } from '../services/analyticsService.mjs';
import { AnalyticsRecommenderService } from '../services/analyticsRecommenderService.mjs';
import { AnalyticsFeedbackService } from '../services/analyticsFeedbackService.mjs';

const router = express.Router();

/**
 * @route POST /api/analytics/feedback
 * @desc Submit feedback for a recommendation to improve the learning engine
 */
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const { recommendationId, ruleType, actionTaken, outcomeScore } = req.body;
    const result = await AnalyticsFeedbackService.recordFeedback(
      req.user.id,
      recommendationId,
      ruleType,
      actionTaken,
      outcomeScore
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Feedback submission failed' });
  }
});

/**
 * @route GET /api/analytics/insights
 * @desc Get high-level summary, learning stats, and actionable recommendations
 */
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const insights = await AnalyticsRecommenderService.getInsights(req.user.id);
    res.json(insights);
  } catch (error) {
    console.error('[Insights API] Error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

/**
 * @route GET /api/analytics/sales
 * @desc Get sales forecast for the next 30 days
 */
router.get('/sales', authMiddleware, async (req, res) => {
  try {
    const forecast = await AnalyticsService.forecastSales(req.user.id);
    res.json(forecast);
  } catch (error) {
    res.status(500).json({ error: 'Sales forecast failed' });
  }
});

/**
 * @route GET /api/analytics/stock
 * @desc Get inventory stockout predictions
 */
router.get('/stock', authMiddleware, async (req, res) => {
  try {
    const predictions = await AnalyticsService.predictStock(req.user.id);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: 'Stock prediction failed' });
  }
});

/**
 * @route GET /api/analytics/customers
 * @desc Get inactive and high-debt customer analysis
 */
router.get('/customers', authMiddleware, async (req, res) => {
  try {
    const analysis = await AnalyticsService.analyzeCustomers(req.user.id);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Customer analysis failed' });
  }
});

export default router;

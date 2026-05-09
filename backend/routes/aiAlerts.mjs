import express from 'express';
import { prisma } from '../prismaClient.mjs';
import { authMiddleware } from '../authMiddleware.mjs';

const router = express.Router();

/**
 * @route GET /api/alerts
 * @desc Get all unread alerts for the authenticated tenant
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.id;
    const alerts = await prisma.aIAlert.findMany({
      where: {
        tenantId,
        isRead: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        type: true,
        message: true,
        priority: true,
        createdAt: true
      }
    });

    res.json(alerts);
  } catch (error) {
    console.error('[Alerts API] Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

/**
 * @route PATCH /api/alerts/:id/read
 * @desc Mark an alert as read
 */
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.id;

    const alert = await prisma.aIAlert.findUnique({
      where: { id: parseInt(id) }
    });

    if (!alert || alert.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await prisma.aIAlert.update({
      where: { id: parseInt(id) },
      data: { isRead: true }
    });

    res.json({ message: 'Alert marked as read' });
  } catch (error) {
    console.error('[Alerts API] Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default router;

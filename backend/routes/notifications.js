const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, scheduled_time, is_enabled, created_at, updated_at
       FROM notifications 
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create a new notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, title, message, scheduledTime, isEnabled = true } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, title, and message are required'
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, scheduled_time, is_enabled) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, scheduledTime, isEnabled]
    );

    const notificationId = result.insertId;

    // Get the created notification
    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, scheduled_time, is_enabled, created_at, updated_at
       FROM notifications 
       WHERE id = ?`,
      [notificationId]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification: notifications[0]
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update a notification
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const { type, title, message, scheduledTime, isEnabled } = req.body;

    // Check if notification exists and belongs to user
    const [existingNotifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (existingNotifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (message !== undefined) {
      updates.push('message = ?');
      values.push(message);
    }
    if (scheduledTime !== undefined) {
      updates.push('scheduled_time = ?');
      values.push(scheduledTime);
    }
    if (isEnabled !== undefined) {
      updates.push('is_enabled = ?');
      values.push(isEnabled);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(notificationId, userId);

    await pool.execute(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    // Get the updated notification
    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, scheduled_time, is_enabled, created_at, updated_at
       FROM notifications 
       WHERE id = ?`,
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification updated successfully',
      notification: notifications[0]
    });

  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Check if notification exists and belongs to user
    const [existingNotifications] = await pool.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (existingNotifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Delete the notification
    await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle notification enabled/disabled
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    // Check if notification exists and belongs to user
    const [existingNotifications] = await pool.execute(
      'SELECT id, is_enabled FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (existingNotifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const currentStatus = existingNotifications[0].is_enabled;
    const newStatus = !currentStatus;

    await pool.execute(
      'UPDATE notifications SET is_enabled = ? WHERE id = ? AND user_id = ?',
      [newStatus, notificationId, userId]
    );

    res.json({
      success: true,
      message: `Notification ${newStatus ? 'enabled' : 'disabled'} successfully`,
      isEnabled: newStatus
    });

  } catch (error) {
    console.error('Toggle notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get notifications by type
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, scheduled_time, is_enabled, created_at, updated_at
       FROM notifications 
       WHERE user_id = ? AND type = ?
       ORDER BY created_at DESC`,
      [userId, type]
    );

    res.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create default sleep notifications for a user
router.post('/setup-sleep', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bedtime, wakeTime } = req.body;

    if (!bedtime || !wakeTime) {
      return res.status(400).json({
        success: false,
        message: 'Bedtime and wake time are required'
      });
    }

    // Delete existing sleep notifications
    await pool.execute(
      'DELETE FROM notifications WHERE user_id = ? AND type IN (?, ?)',
      [userId, 'bedtime', 'wakeup']
    );

    // Create bedtime notification
    const [bedtimeResult] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, scheduled_time, is_enabled) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, 'bedtime', '🌙 Bedtime Reminder', 'Time to wind down and prepare for sleep!', bedtime, true]
    );

    // Create wake up notification
    const [wakeupResult] = await pool.execute(
      `INSERT INTO notifications (user_id, type, title, message, scheduled_time, is_enabled) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, 'wakeup', '☀️ Wake Up Time', 'Good morning! Time to start your day!', wakeTime, true]
    );

    res.json({
      success: true,
      message: 'Sleep notifications setup successfully',
      notifications: [
        { id: bedtimeResult.insertId, type: 'bedtime', scheduled_time: bedtime },
        { id: wakeupResult.insertId, type: 'wakeup', scheduled_time: wakeTime }
      ]
    });

  } catch (error) {
    console.error('Setup sleep notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

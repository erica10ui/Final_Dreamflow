const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user preferences
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [preferences] = await pool.execute(
      `SELECT sleep_type, sos_relief_preferences, mentor_preferences, created_at, updated_at
       FROM user_preferences 
       WHERE user_id = ?`,
      [userId]
    );

    if (preferences.length === 0) {
      // Return default preferences if none exist
      return res.json({
        success: true,
        preferences: {
          sleepType: null,
          sosReliefPreferences: {},
          mentorPreferences: {}
        }
      });
    }

    const prefs = preferences[0];
    res.json({
      success: true,
      preferences: {
        sleepType: prefs.sleep_type,
        sosReliefPreferences: prefs.sos_relief_preferences ? JSON.parse(prefs.sos_relief_preferences) : {},
        mentorPreferences: prefs.mentor_preferences ? JSON.parse(prefs.mentor_preferences) : {}
      }
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user preferences
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sleepType, sosReliefPreferences, mentorPreferences } = req.body;

    // Check if preferences exist
    const [existingPrefs] = await pool.execute(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existingPrefs.length === 0) {
      // Create new preferences
      await pool.execute(
        `INSERT INTO user_preferences (user_id, sleep_type, sos_relief_preferences, mentor_preferences) 
         VALUES (?, ?, ?, ?)`,
        [
          userId, 
          sleepType, 
          JSON.stringify(sosReliefPreferences || {}), 
          JSON.stringify(mentorPreferences || {})
        ]
      );
    } else {
      // Update existing preferences
      const updates = [];
      const values = [];

      if (sleepType !== undefined) {
        updates.push('sleep_type = ?');
        values.push(sleepType);
      }
      if (sosReliefPreferences !== undefined) {
        updates.push('sos_relief_preferences = ?');
        values.push(JSON.stringify(sosReliefPreferences));
      }
      if (mentorPreferences !== undefined) {
        updates.push('mentor_preferences = ?');
        values.push(JSON.stringify(mentorPreferences));
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      values.push(userId);

      await pool.execute(
        `UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    // Get updated preferences
    const [updatedPrefs] = await pool.execute(
      `SELECT sleep_type, sos_relief_preferences, mentor_preferences, created_at, updated_at
       FROM user_preferences 
       WHERE user_id = ?`,
      [userId]
    );

    const prefs = updatedPrefs[0];
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: {
        sleepType: prefs.sleep_type,
        sosReliefPreferences: prefs.sos_relief_preferences ? JSON.parse(prefs.sos_relief_preferences) : {},
        mentorPreferences: prefs.mentor_preferences ? JSON.parse(prefs.mentor_preferences) : {}
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update sleep type specifically
router.put('/sleep-type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sleepType } = req.body;

    if (!sleepType) {
      return res.status(400).json({
        success: false,
        message: 'Sleep type is required'
      });
    }

    // Check if preferences exist
    const [existingPrefs] = await pool.execute(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existingPrefs.length === 0) {
      // Create new preferences with sleep type
      await pool.execute(
        `INSERT INTO user_preferences (user_id, sleep_type, sos_relief_preferences, mentor_preferences) 
         VALUES (?, ?, '{}', '{}')`,
        [userId, sleepType]
      );
    } else {
      // Update sleep type
      await pool.execute(
        'UPDATE user_preferences SET sleep_type = ? WHERE user_id = ?',
        [sleepType, userId]
      );
    }

    res.json({
      success: true,
      message: 'Sleep type updated successfully',
      sleepType
    });

  } catch (error) {
    console.error('Update sleep type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update SOS relief preferences
router.put('/sos-relief', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sosReliefPreferences } = req.body;

    if (!sosReliefPreferences || typeof sosReliefPreferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'SOS relief preferences must be an object'
      });
    }

    // Check if preferences exist
    const [existingPrefs] = await pool.execute(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existingPrefs.length === 0) {
      // Create new preferences with SOS relief preferences
      await pool.execute(
        `INSERT INTO user_preferences (user_id, sleep_type, sos_relief_preferences, mentor_preferences) 
         VALUES (?, NULL, ?, '{}')`,
        [userId, JSON.stringify(sosReliefPreferences)]
      );
    } else {
      // Update SOS relief preferences
      await pool.execute(
        'UPDATE user_preferences SET sos_relief_preferences = ? WHERE user_id = ?',
        [JSON.stringify(sosReliefPreferences), userId]
      );
    }

    res.json({
      success: true,
      message: 'SOS relief preferences updated successfully',
      sosReliefPreferences
    });

  } catch (error) {
    console.error('Update SOS relief preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update mentor preferences
router.put('/mentor', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mentorPreferences } = req.body;

    if (!mentorPreferences || typeof mentorPreferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Mentor preferences must be an object'
      });
    }

    // Check if preferences exist
    const [existingPrefs] = await pool.execute(
      'SELECT id FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    if (existingPrefs.length === 0) {
      // Create new preferences with mentor preferences
      await pool.execute(
        `INSERT INTO user_preferences (user_id, sleep_type, sos_relief_preferences, mentor_preferences) 
         VALUES (?, NULL, '{}', ?)`,
        [userId, JSON.stringify(mentorPreferences)]
      );
    } else {
      // Update mentor preferences
      await pool.execute(
        'UPDATE user_preferences SET mentor_preferences = ? WHERE user_id = ?',
        [JSON.stringify(mentorPreferences), userId]
      );
    }

    res.json({
      success: true,
      message: 'Mentor preferences updated successfully',
      mentorPreferences
    });

  } catch (error) {
    console.error('Update mentor preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reset preferences to default
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'DELETE FROM user_preferences WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Preferences reset to default successfully'
    });

  } catch (error) {
    console.error('Reset preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

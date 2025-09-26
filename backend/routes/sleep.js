const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateSleepSession } = require('../middleware/validation');

const router = express.Router();

// Get all sleep sessions for a user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    let whereConditions = ['user_id = ?'];
    let queryParams = [userId];

    if (startDate) {
      whereConditions.push('DATE(start_time) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(start_time) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    const [sessions] = await pool.execute(
      `SELECT id, start_time, end_time, duration, quality, notes, created_at, updated_at
       FROM sleep_sessions 
       WHERE ${whereClause}
       ORDER BY start_time DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM sleep_sessions WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSessions: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get sleep sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a specific sleep session
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    const [sessions] = await pool.execute(
      `SELECT id, start_time, end_time, duration, quality, notes, created_at, updated_at
       FROM sleep_sessions 
       WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sleep session not found'
      });
    }

    res.json({
      success: true,
      session: sessions[0]
    });

  } catch (error) {
    console.error('Get sleep session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start a new sleep session
router.post('/sessions/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startTime } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO sleep_sessions (user_id, start_time) VALUES (?, ?)',
      [userId, startTime || new Date()]
    );

    const sessionId = result.insertId;

    // Get the created session
    const [sessions] = await pool.execute(
      `SELECT id, start_time, end_time, duration, quality, notes, created_at, updated_at
       FROM sleep_sessions 
       WHERE id = ?`,
      [sessionId]
    );

    res.status(201).json({
      success: true,
      message: 'Sleep session started',
      session: sessions[0]
    });

  } catch (error) {
    console.error('Start sleep session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// End a sleep session
router.put('/sessions/:id/end', authenticateToken, validateSleepSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const { endTime, quality, notes } = req.body;

    // Check if session exists and belongs to user
    const [existingSessions] = await pool.execute(
      'SELECT start_time FROM sleep_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (existingSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sleep session not found'
      });
    }

    const startTime = new Date(existingSessions[0].start_time);
    const endTimeDate = new Date(endTime || new Date());
    const duration = (endTimeDate - startTime) / (1000 * 60 * 60); // hours

    // Update the session
    await pool.execute(
      `UPDATE sleep_sessions 
       SET end_time = ?, duration = ?, quality = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [endTime || new Date(), duration, quality, notes, sessionId, userId]
    );

    // Get the updated session
    const [sessions] = await pool.execute(
      `SELECT id, start_time, end_time, duration, quality, notes, created_at, updated_at
       FROM sleep_sessions 
       WHERE id = ?`,
      [sessionId]
    );

    res.json({
      success: true,
      message: 'Sleep session ended',
      session: sessions[0]
    });

  } catch (error) {
    console.error('End sleep session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update a sleep session
router.put('/sessions/:id', authenticateToken, validateSleepSession, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const { startTime, endTime, quality, notes } = req.body;

    // Check if session exists and belongs to user
    const [existingSessions] = await pool.execute(
      'SELECT id FROM sleep_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (existingSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sleep session not found'
      });
    }

    // Calculate duration if both start and end times are provided
    let duration = null;
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      duration = (end - start) / (1000 * 60 * 60); // hours
    }

    // Update the session
    await pool.execute(
      `UPDATE sleep_sessions 
       SET start_time = ?, end_time = ?, duration = ?, quality = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [startTime, endTime, duration, quality, notes, sessionId, userId]
    );

    // Get the updated session
    const [sessions] = await pool.execute(
      `SELECT id, start_time, end_time, duration, quality, notes, created_at, updated_at
       FROM sleep_sessions 
       WHERE id = ?`,
      [sessionId]
    );

    res.json({
      success: true,
      message: 'Sleep session updated successfully',
      session: sessions[0]
    });

  } catch (error) {
    console.error('Update sleep session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a sleep session
router.delete('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // Check if session exists and belongs to user
    const [existingSessions] = await pool.execute(
      'SELECT id FROM sleep_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (existingSessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sleep session not found'
      });
    }

    // Delete the session
    await pool.execute(
      'DELETE FROM sleep_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    res.json({
      success: true,
      message: 'Sleep session deleted successfully'
    });

  } catch (error) {
    console.error('Delete sleep session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sleep statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;

    // Get user's sleep goal
    const [users] = await pool.execute(
      'SELECT sleep_goal FROM users WHERE id = ?',
      [userId]
    );

    const sleepGoal = users[0]?.sleep_goal || 8;

    // Get sessions from the specified number of days
    const [sessions] = await pool.execute(
      `SELECT start_time, end_time, duration, quality
       FROM sleep_sessions 
       WHERE user_id = ? AND start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY start_time DESC`,
      [userId, parseInt(days)]
    );

    // Calculate statistics
    const totalSessions = sessions.length;
    const totalSleep = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSleep = totalSessions > 0 ? totalSleep / totalSessions : 0;

    // Calculate sleep streak
    let sleepStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasSleep = sessions.some(session => {
        const sessionDate = new Date(session.start_time);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate.getTime() === checkDate.getTime() && (session.duration || 0) >= sleepGoal;
      });

      if (hasSleep) {
        sleepStreak++;
      } else {
        break;
      }
    }

    // Goal achievement rate
    const goalAchievement = sessions.filter(session => (session.duration || 0) >= sleepGoal).length;
    const goalAchievementRate = totalSessions > 0 ? (goalAchievement / totalSessions) * 100 : 0;

    // Quality distribution
    const qualityStats = sessions.reduce((acc, session) => {
      const quality = session.quality || 'Unknown';
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {});

    // Weekly averages
    const weeklyAverages = [];
    for (let week = 0; week < Math.ceil(days / 7); week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (week + 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() - week * 7);

      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.start_time);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });

      const weekTotal = weekSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
      const weekAverage = weekSessions.length > 0 ? weekTotal / weekSessions.length : 0;

      weeklyAverages.push({
        week: week + 1,
        average: Math.round(weekAverage * 10) / 10,
        sessions: weekSessions.length
      });
    }

    res.json({
      success: true,
      stats: {
        totalSessions,
        averageSleep: Math.round(averageSleep * 10) / 10,
        totalSleep: Math.round(totalSleep * 10) / 10,
        sleepStreak,
        goalAchievement: Math.round(goalAchievementRate),
        sleepGoal,
        qualityDistribution: qualityStats,
        weeklyAverages: weeklyAverages.reverse()
      }
    });

  } catch (error) {
    console.error('Get sleep stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Save quiz responses
router.post('/quiz', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionNumber, response } = req.body;

    if (!questionNumber || !response) {
      return res.status(400).json({
        success: false,
        message: 'Question number and response are required'
      });
    }

    // Insert or update quiz response
    await pool.execute(
      `INSERT INTO sleep_quiz_responses (user_id, question_number, response) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE response = ?`,
      [userId, questionNumber, response, response]
    );

    res.json({
      success: true,
      message: 'Quiz response saved successfully'
    });

  } catch (error) {
    console.error('Save quiz response error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get quiz responses
router.get('/quiz', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [responses] = await pool.execute(
      'SELECT question_number, response, created_at FROM sleep_quiz_responses WHERE user_id = ? ORDER BY question_number',
      [userId]
    );

    res.json({
      success: true,
      responses
    });

  } catch (error) {
    console.error('Get quiz responses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

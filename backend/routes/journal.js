const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateJournalEntry } = require('../middleware/validation');

const router = express.Router();

// Get all journal entries for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sort = 'desc' } = req.query;

    const offset = (page - 1) * limit;
    const sortOrder = sort === 'asc' ? 'ASC' : 'DESC';

    const [entries] = await pool.execute(
      `SELECT id, title, description, mood, sleep_quality, tags, dream_date, 
              created_at, updated_at 
       FROM journal_entries 
       WHERE user_id = ? 
       ORDER BY dream_date ${sortOrder}, created_at ${sortOrder}
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), offset]
    );

    // Get total count for pagination
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ?',
      [userId]
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEntries: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get a specific journal entry
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;

    const [entries] = await pool.execute(
      `SELECT id, title, description, mood, sleep_quality, tags, dream_date, 
              created_at, updated_at 
       FROM journal_entries 
       WHERE id = ? AND user_id = ?`,
      [entryId, userId]
    );

    if (entries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      entry: entries[0]
    });

  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create a new journal entry
router.post('/', authenticateToken, validateJournalEntry, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, mood, sleepQuality, tags, dreamDate } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO journal_entries (user_id, title, description, mood, sleep_quality, tags, dream_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title, description, mood, sleepQuality, JSON.stringify(tags || []), dreamDate]
    );

    const entryId = result.insertId;

    // Get the created entry
    const [entries] = await pool.execute(
      `SELECT id, title, description, mood, sleep_quality, tags, dream_date, 
              created_at, updated_at 
       FROM journal_entries 
       WHERE id = ?`,
      [entryId]
    );

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      entry: entries[0]
    });

  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update a journal entry
router.put('/:id', authenticateToken, validateJournalEntry, async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;
    const { title, description, mood, sleepQuality, tags, dreamDate } = req.body;

    // Check if entry exists and belongs to user
    const [existingEntries] = await pool.execute(
      'SELECT id FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (existingEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Update the entry
    await pool.execute(
      `UPDATE journal_entries 
       SET title = ?, description = ?, mood = ?, sleep_quality = ?, tags = ?, dream_date = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, mood, sleepQuality, JSON.stringify(tags || []), dreamDate, entryId, userId]
    );

    // Get the updated entry
    const [entries] = await pool.execute(
      `SELECT id, title, description, mood, sleep_quality, tags, dream_date, 
              created_at, updated_at 
       FROM journal_entries 
       WHERE id = ?`,
      [entryId]
    );

    res.json({
      success: true,
      message: 'Journal entry updated successfully',
      entry: entries[0]
    });

  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete a journal entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const entryId = req.params.id;

    // Check if entry exists and belongs to user
    const [existingEntries] = await pool.execute(
      'SELECT id FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    if (existingEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    // Delete the entry
    await pool.execute(
      'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search journal entries
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, mood, sleepQuality, startDate, endDate, tags, page = 1, limit = 10 } = req.query;

    let whereConditions = ['user_id = ?'];
    let queryParams = [userId];

    // Text search in title and description
    if (q) {
      whereConditions.push('(title LIKE ? OR description LIKE ?)');
      const searchTerm = `%${q}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Filter by mood
    if (mood) {
      whereConditions.push('mood = ?');
      queryParams.push(mood);
    }

    // Filter by sleep quality
    if (sleepQuality) {
      whereConditions.push('sleep_quality = ?');
      queryParams.push(sleepQuality);
    }

    // Filter by date range
    if (startDate) {
      whereConditions.push('dream_date >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('dream_date <= ?');
      queryParams.push(endDate);
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      whereConditions.push('JSON_OVERLAPS(tags, ?)');
      queryParams.push(JSON.stringify(tagArray));
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    const [entries] = await pool.execute(
      `SELECT id, title, description, mood, sleep_quality, tags, dream_date, 
              created_at, updated_at 
       FROM journal_entries 
       WHERE ${whereClause}
       ORDER BY dream_date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), offset]
    );

    // Get total count for pagination
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM journal_entries WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalEntries: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Search journal entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get journal statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get basic stats
    const [totalEntries] = await pool.execute(
      'SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ?',
      [userId]
    );

    // Get entries from last 30 days
    const [recentEntries] = await pool.execute(
      `SELECT COUNT(*) as total FROM journal_entries 
       WHERE user_id = ? AND dream_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [userId]
    );

    // Get most common mood
    const [moodStats] = await pool.execute(
      `SELECT mood, COUNT(*) as count 
       FROM journal_entries 
       WHERE user_id = ? AND mood IS NOT NULL 
       GROUP BY mood 
       ORDER BY count DESC 
       LIMIT 1`,
      [userId]
    );

    // Get most common sleep quality
    const [sleepQualityStats] = await pool.execute(
      `SELECT sleep_quality, COUNT(*) as count 
       FROM journal_entries 
       WHERE user_id = ? AND sleep_quality IS NOT NULL 
       GROUP BY sleep_quality 
       ORDER BY count DESC 
       LIMIT 1`,
      [userId]
    );

    // Get most common tags
    const [tagStats] = await pool.execute(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(tags, '$[0]')) as tag, COUNT(*) as count
       FROM journal_entries 
       WHERE user_id = ? AND JSON_LENGTH(tags) > 0
       GROUP BY JSON_UNQUOTE(JSON_EXTRACT(tags, '$[0]'))
       ORDER BY count DESC
       LIMIT 5`,
      [userId]
    );

    // Calculate dream recall rate (entries per day in last 30 days)
    const recallRate = recentEntries[0].total / 30 * 100;

    res.json({
      success: true,
      stats: {
        totalEntries: totalEntries[0].total,
        recentEntries: recentEntries[0].total,
        recallRate: Math.round(recallRate),
        mostCommonMood: moodStats[0]?.mood || null,
        mostCommonSleepQuality: sleepQualityStats[0]?.sleep_quality || null,
        topTags: tagStats.map(tag => ({ tag: tag.tag, count: tag.count }))
      }
    });

  } catch (error) {
    console.error('Get journal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;

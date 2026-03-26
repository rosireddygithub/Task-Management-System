const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// GET /api/analytics
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ creator: req.user.id });

    const totalTasks = tasks.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;
    
    let totalEstimated = 0;
    let totalActual = 0;

    const priorityDist = { Low: 0, Medium: 0, High: 0 };
    const statusDist = { Todo: 0, "In Progress": 0, Done: 0 };

    const now = new Date();

    tasks.forEach(task => {
      if (task.status === 'Done') {
        completedTasks++;
      } else {
        pendingTasks++;
        if (task.dueDate && new Date(task.dueDate) < now) {
          overdueTasks++;
        }
      }
      if (priorityDist[task.priority] !== undefined) priorityDist[task.priority]++;
      if (statusDist[task.status] !== undefined) statusDist[task.status]++;
      totalEstimated += (task.estimatedTime || 0);
      totalActual += (task.actualTime || 0);
    });

    const completionPercentage = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0;
    const averageCompletionTime = completedTasks > 0 ? (totalActual / completedTasks).toFixed(2) : 0;
    
    // Timeline Data: Group by Due Date using existing tasks array to prevent aggregation crashes
    const timelineDataObj = {};
    tasks.forEach(task => {
      if (task.dueDate && task.status !== 'Done') {
        const dateStr = task.dueDate.toISOString().split('T')[0];
        if(!timelineDataObj[dateStr]) timelineDataObj[dateStr] = { count: 0, tasks: [] };
        timelineDataObj[dateStr].count++;
        timelineDataObj[dateStr].tasks.push(task.title);
      }
    });

    const timelineData = Object.keys(timelineDataObj).sort().map(date => ({
      _id: date,
      count: timelineDataObj[date].count,
      tasks: timelineDataObj[date].tasks
    }));

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionPercentage,
      priorityDist,
      statusDist,
      completedOverTime: timelineData,
      totalEstimated,
      totalActual,
      averageCompletionTime,
      healthRatio: { overdue: overdueTasks, completed: completedTasks }
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;

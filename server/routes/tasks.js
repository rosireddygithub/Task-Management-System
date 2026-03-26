const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// GET /api/tasks (all tasks for logged in user)
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ creator: req.user.id }).sort({ dueDate: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// POST /api/tasks (create task)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, estimatedTime, progress } = req.body;
    const newTask = new Task({
      title,
      description,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate,
      estimatedTime: estimatedTime || 0,
      progress: progress || 0,
      creator: req.user.id
    });
    
    if (newTask.status === 'Done') {
      newTask.completedAt = new Date();
    }
    
    const task = await newTask.save();
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/tasks/:id (update whole task)
router.put('/:id', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.creator.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const { status } = req.body;
    
    // If marking as done
    if (status === 'Done' && task.status !== 'Done') {
      req.body.completedAt = new Date();
    } else if (status !== 'Done' && task.status === 'Done') {
      req.body.completedAt = null; // unset
    }

    task = await Task.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PATCH /api/tasks/:id/status (quick update just status)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.creator.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    const { status } = req.body;
    let completedAt = task.completedAt;

    if (status === 'Done' && task.status !== 'Done') {
      completedAt = new Date();
    } else if (status !== 'Done' && task.status === 'Done') {
      completedAt = null;
    }

    task.status = status;
    task.completedAt = completedAt;
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.creator.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Task removed' });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;

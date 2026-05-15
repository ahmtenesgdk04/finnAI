const coachService = require('../services/coachService');

const getLevel = async (req, res, next) => {
  try {
    const level = await coachService.getLevel(req.user.id);
    res.json({ success: true, ...level });
  } catch (err) {
    next(err);
  }
};

const getLesson = async (req, res, next) => {
  try {
    const lesson = await coachService.generateLesson(req.user.id, req.body);
    res.json({ success: true, ...lesson });
  } catch (err) {
    next(err);
  }
};

const submitQuizResult = async (req, res, next) => {
  try {
    const { lessonId, correct } = req.body;
    const result = await coachService.submitQuizResult(req.user.id, { lessonId, correct });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

const askCoach = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Soru zorunludur' });
    const result = await coachService.askCoach(req.user.id, question);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getLevel, getLesson, submitQuizResult, askCoach };

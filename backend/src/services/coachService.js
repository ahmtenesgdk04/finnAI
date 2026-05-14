const coachModel = require('../models/coachModel');
const expenseModel = require('../models/expenseModel');
const aiService = require('./aiService');
const { formatMonth } = require('../utils/helpers');

const getLevel = async (userId) => {
  const progress = await coachModel.getProgress(userId);
  return {
    xp: progress.xp,
    level: progress.level,
    badges: progress.badges,
    xpForNext: progress.level * 200,
  };
};

const generateLesson = async (userId, { topic, triggerModule, userLevel }) => {
  const level = userLevel || (await coachModel.getProgress(userId)).level;

  const currentMonth = formatMonth();
  const recentEntries = await expenseModel.findByUserId(userId, 10);
  const recentCategories = [...new Set(recentEntries.map((e) => e.category))];

  const lessonTopic = topic || triggerModule || (recentCategories[0]
    ? `${recentCategories[0]} harcamalarını optimize etme`
    : 'bütçe yönetimi');

  const lesson = await aiService.generateLesson(lessonTopic, level, { recentCategories });
  return { ...lesson, id: `lesson_${Date.now()}` };
};

const submitQuizResult = async (userId, { lessonId, correct }) => {
  const xpEarned = correct ? 50 : 10;
  const updated = await coachModel.addXP(userId, xpEarned);

  if (correct && updated.level > 1 && updated.xp % 200 < 50) {
    await coachModel.addBadge(userId, `Seviye ${updated.level} Ustası`);
  }

  return { xpEarned, ...updated };
};

const askCoach = async (userId, question) => {
  const progress = await coachModel.getProgress(userId);
  const answer = await aiService.answerFinancialQuestion(question, { level: progress.level });
  return { answer };
};

module.exports = { getLevel, generateLesson, submitQuizResult, askCoach };

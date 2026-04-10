import './EmotionModule.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return { emoji: '🌙', text: '夜深了，还在加班？' };
  if (hour < 9) return { emoji: '☀️', text: '早餐时间到啦' };
  if ( hour < 12) return { emoji: '🌞', text: '午餐时间～老婆饿了吗' };
  if (hour < 14) return { emoji: '☀️', text: '下午茶时光' };
  if (hour < 18) return { emoji: '🌆', text: '傍晚啦，晚餐准备好了吗' };
  if (hour < 22) return { emoji: '🌙', text: '晚上好，大厨' };
  return { emoji: '🌙', text: '夜深了，该休息啦' };
}

function getAchievementText(completed: number, total: number) {
  if (completed === 0) return '';
  if (completed === total && total > 0) return '🎉 太棒了！全部完成！老婆爱死你啦！';

  const texts = [
    `💪 今天为老婆做了 ${completed} 道菜！`,
    `❤️ 老婆一定会很开心的！`,
    `🔥 继续加油！厨房高手！`,
    `🏆 大厨风范，满分！`,
    `✨ 做得很棒！老婆的最爱～`,
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

function getLazyResponse() {
  const texts = [
    '好耶！躺平～ 😴',
    '休息一下也好 😊',
    '明天再战～ 💤',
    '大厨也需要休息嘛 🤗',
    '偶尔偷懒也是情调～ 😏',
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

// 任务状态对应的情绪文案
function getTaskEmotionText(status: 'pending' | 'cooking' | 'completed', dishName?: string) {
  if (status === 'pending') {
    const pendingTexts = [
      `💕 老婆在等你做【${dishName}】～`,
      `🔥 赶紧开始吧，老婆饿了！`,
      `⚡ 【${dishName}】等待被完成！`,
      `🎯 老婆最想吃的就是这个！`,
    ];
    return pendingTexts[Math.floor(Math.random() * pendingTexts.length)];
  }

  if (status === 'cooking') {
    const cookingTexts = [
      `🍳 正在制作中...老婆在流口水了`,
      `🔥 加油！香味要出来啦！`,
      `✨ 快完成啦，老婆等着吃呢～`,
      `🍽️ 美味正在烹饪中...`,
    ];
    return cookingTexts[Math.floor(Math.random() * cookingTexts.length)];
  }

  return '';
}

// 完成后的反馈文案
function getCompletionText() {
  const texts = [
    '🎉 完成啦！老婆一定超开心！',
    '❤️ 爱心料理完成！',
    '✨ 太棒了！厨房达人！',
    '🏆 又完成一道！老婆的爱人～',
    '🍽️ 美味送达！老婆有福啦～',
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

export { getGreeting, getAchievementText, getLazyResponse, getTaskEmotionText, getCompletionText };

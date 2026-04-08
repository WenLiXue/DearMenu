import './EmotionModule.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 9) return { emoji: '☀️', text: '早餐准备好了吗' };
  if (hour < 12) return { emoji: '🌞', text: '午餐时间到啦' };
  if (hour < 18) return { emoji: '🌆', text: '下午好，大厨' };
  return { emoji: '🌙', text: '她在等你做晚餐哦' };
}

function getAchievementText(completed: number, total: number) {
  if (completed === 0) return '';
  if (completed === total && total > 0) return '太棒了！全部完成 🎉';
  const texts = [
    '今天为她做了一顿 💪',
    '她看到一定会很开心',
    '厉害，又完成一道！',
    '厨房高手 🏆',
    '做得很棒！继续加油',
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

function getLazyResponse() {
  const texts = [
    '好耶！躺平～ 😴',
    '休息一下也好 😊',
    '明天再战～ 💤',
    '大厨也需要休息嘛 🤗',
  ];
  return texts[Math.floor(Math.random() * texts.length)];
}

export { getGreeting, getAchievementText, getLazyResponse };

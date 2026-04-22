import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Toast } from 'antd-mobile';
import { useHusbandStore, HusbandTask } from '../../stores/husbandStore';
import './Husband.css';

interface OrderGroup {
  orderId: string;
  items: HusbandTask[];
  completedCount: number;
  pendingCount: number;
  cookingCount: number;
  total: number;
  progress: number;
  orderStatus: 'cooking' | 'pending' | 'completed';
  createdAt: string;
}

// 等级配置
const CHEF_LEVELS = [
  { name: '青铜厨师', min: 0, icon: '🥉' },
  { name: '白银厨师', min: 5, icon: '🥈' },
  { name: '黄金厨师', min: 15, icon: '🥇' },
  { name: '钻石厨师', min: 30, icon: '💎' },
  { name: '传奇大厨', min: 50, icon: '👑' },
];

function getChefLevel(completedCount: number) {
  let level = CHEF_LEVELS[0];
  for (const l of CHEF_LEVELS) {
    if (completedCount >= l.min) level = l;
  }
  return level;
}

function groupTasksByOrder(tasks: HusbandTask[]): OrderGroup[] {
  const orders = new Map<string, OrderGroup>();

  tasks.forEach(task => {
    if (!orders.has(task.order_id)) {
      orders.set(task.order_id, {
        orderId: task.order_id,
        items: [],
        completedCount: 0,
        pendingCount: 0,
        cookingCount: 0,
        total: 0,
        progress: 0,
        orderStatus: 'pending',
        createdAt: task.created_at || new Date().toISOString(),
      });
    }

    const order = orders.get(task.order_id)!;
    order.items.push(task);

    if (task.status === 'completed') order.completedCount++;
    if (task.status === 'pending') order.pendingCount++;
    if (task.status === 'cooking') order.cookingCount++;
  });

  return Array.from(orders.values()).map(order => ({
    ...order,
    total: order.items.length,
    progress: order.total > 0 ? Math.round((order.completedCount / order.total) * 100) : 0,
    orderStatus: order.cookingCount > 0 ? 'cooking'
      : order.pendingCount > 0 ? 'pending'
      : 'completed',
  }));
}

function getCurrentTask(tasks: HusbandTask[]): { task: HusbandTask | null; source: string; isCooking: boolean } {
  // 1. 找正在做的订单（优先）- 显示正在制作的任务
  const cookingTask = tasks.find(t => t.status === 'cooking');
  if (cookingTask) {
    return { task: cookingTask, source: 'cooking_now', isCooking: true };
  }

  // 2. 找第一个有 pending 任务的订单
  const orderGroups = groupTasksByOrder(tasks);
  const sortedOrders = orderGroups.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const firstOrderWithPending = sortedOrders.find(o => o.pendingCount > 0);
  if (firstOrderWithPending) {
    const pendingTask = tasks.find(
      t => t.order_id === firstOrderWithPending.orderId && t.status === 'pending'
    );
    return { task: pendingTask || null, source: 'first_pending_order', isCooking: false };
  }

  return { task: null, source: 'all_completed', isCooking: false };
}

function formatTime(isoString: string | undefined): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
}

export default function Husband() {
  const navigate = useNavigate();
  const { tasks, fetchTasks, forceRefreshTasks, startCooking, completeTask, randomCook, cookFavorite, beLazy } = useHusbandStore();
  const [showLazyResponse, setShowLazyResponse] = useState(false);
  const [lazyText, setLazyText] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [diceRotation, setDiceRotation] = useState(0);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      forceRefreshTasks();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const orderGroups = useMemo(() => groupTasksByOrder(tasks), [tasks]);
  const { task: currentTask, source: taskSource, isCooking } = useMemo(() => getCurrentTask(tasks), [tasks]);

  const activeOrderId = currentTask?.order_id || tasks.find(t => t.status === 'cooking')?.order_id;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingCount = totalCount - completedCount;
  const isAllDone = progress === 100 && totalCount > 0;

  const chefLevel = getChefLevel(completedCount);

  const handleStart = async (id: string) => {
    await startCooking(id);
    await forceRefreshTasks();
  };

  const handleComplete = async (id: string) => {
    try {
      await completeTask(id);
      await forceRefreshTasks();
      Toast.show({
        content: '🎉 完成啦！老婆会超开心的！',
        icon: 'success',
        duration: 2000
      });
    } catch (e) {
      Toast.show({ content: '操作失败，请重试', icon: 'fail' });
    }
  };

  const handleRandom = () => {
    setDiceRotation(prev => prev + 360);
    setTimeout(async () => {
      await randomCook();
      await forceRefreshTasks();
    }, 300);
  };

  const handleFavorite = async () => {
    await cookFavorite();
    await forceRefreshTasks();
  };

  const handleLazy = () => {
    Dialog.confirm({
      content: '确定要偷懒吗？老婆会收到通知哦～',
      confirmText: '就是不想做',
      cancelText: '算了再做',
      onConfirm: () => {
        beLazy();
        const responses = [
          '好吧好吧...再等会儿...',
          '让我再躺五分钟...',
          '肚子好饿...先吃点零食？',
          '今天好累啊...明天再说？'
        ];
        setLazyText(responses[Math.floor(Math.random() * responses.length)]);
        setShowLazyResponse(true);
        setTimeout(() => setShowLazyResponse(false), 3000);
      },
    });
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'same_order_continue': return '继续上单';
      case 'first_pending_order': return '新订单开始';
      default: return '全部完成';
    }
  };

  return (
    <div className="husband-page">
      <header className="husband-header">
        <div className="header-left">
          <span className="header-avatar">👨‍🍳</span>
          <div className="header-title-group">
            <span className="header-title">大厨</span>
            <span className="header-level" title={chefLevel.name}>{chefLevel.icon}</span>
          </div>
        </div>
        <div className="header-center">
          <span className="header-greeting">
            {isAllDone ? '🎉 今日完成' : currentTask ? '🔥 制作中' : totalCount > 0 ? '⏳ 待制作' : '✨ 休息中'}
          </span>
        </div>
        <div className="header-right">
          <button className="header-exit-btn" onClick={() => {
            Dialog.confirm({
              content: '确定要退出登录吗？',
              confirmText: '退出',
              cancelText: '取消',
              onConfirm: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              },
            });
          }}>
            🚪
          </button>
        </div>
      </header>

      <main className="husband-main">
        {totalCount > 0 && (
          <section className="global-progress-section">
            <div className="global-progress-header">
              <div className="global-progress-left">
                <span className="global-progress-label">今日任务进度</span>
                <span className="global-level-badge">{chefLevel.icon} {chefLevel.name}</span>
              </div>
              <span className="global-progress-count">{completedCount}/{totalCount}</span>
            </div>
            <div className="global-progress-bar">
              <div
                className="global-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>
        )}

        {currentTask ? (
          <section className="current-task-section">
            <div className="current-task-label">
              <span className="current-task-badge">{getSourceLabel(taskSource)}</span>
            </div>
            <div className="current-task-card">
              <div className="current-task-image">
                {currentTask.dish?.image_url ? (
                  <img src={currentTask.dish.image_url} alt={currentTask.dish?.name} />
                ) : (
                  <div className="current-task-image-placeholder">🍽️</div>
                )}
              </div>
              <div className="current-task-info">
                <h2 className="current-task-name">{currentTask.dish?.name || '未知菜品'}</h2>
                {currentTask.dish?.tags?.length > 0 && (
                  <div className="current-task-tags">
                    {currentTask.dish.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="current-task-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="current-task-order">订单: {currentTask.order_id.slice(0, 8)}...</p>
              </div>
              <div className="current-task-actions">
                {isCooking ? (
                  <button
                    className="complete-btn"
                    onClick={() => handleComplete(currentTask.id)}
                  >
                    完成 ✓
                  </button>
                ) : (
                  <button
                    className="start-cooking-btn"
                    onClick={() => handleStart(currentTask.id)}
                  >
                    开始 🍳
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : tasks.length === 0 ? (
          <section className="empty-section">
            <div className="empty-icon">🍽️</div>
            <h2 className="empty-title">今天没有任务啦</h2>
            <p className="empty-desc">老婆还没下单哦～</p>
            <button className="empty-btn" onClick={() => { handleRandom(); }}>
              🎲 随机做一道
            </button>
          </section>
        ) : isAllDone ? (
          <section className="all-done-section">
            <div className="all-done-confetti">🎊🎉🎊</div>
            <div className="all-done-icon">🏆</div>
            <h2 className="all-done-title">今日任务全部完成！</h2>
            <p className="all-done-desc">大厨辛苦了～ {chefLevel.icon}</p>
          </section>
        ) : (
          <section className="all-done-section">
            <div className="all-done-icon">🔥</div>
            <h2 className="all-done-title">加油大厨，还有 {remainingCount} 道菜待处理</h2>
            <p className="all-done-desc">继续努力，老婆在等着呢～</p>
          </section>
        )}

        {orderGroups.length > 0 && (
          <section className="orders-section">
            <h3 className="orders-title">📋 今日订单</h3>
            <div className="orders-list">
              {orderGroups.map(order => (
                <div
                  key={order.orderId}
                  className={`order-card ${activeOrderId === order.orderId ? 'active' : ''} ${order.orderStatus}`}
                >
                  <div
                    className="order-header"
                    onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                  >
                    <div className="order-header-left">
                      <span className="order-status-icon">
                        {order.orderStatus === 'cooking' && '🔥'}
                        {order.orderStatus === 'pending' && '⏳'}
                        {order.orderStatus === 'completed' && '✅'}
                      </span>
                      <span className="order-status-text">
                        {order.orderStatus === 'cooking' && '制作中'}
                        {order.orderStatus === 'pending' && '等待中'}
                        {order.orderStatus === 'completed' && '已完成'}
                      </span>
                    </div>
                    <div className="order-header-right">
                      <span className="order-time">{formatTime(order.createdAt)}</span>
                      <span className="order-expand-icon">{expandedOrder === order.orderId ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  <div className="order-progress">
                    <div className="order-progress-bar">
                      <div
                        className="order-progress-fill"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                    <span className="order-progress-text">
                      {order.completedCount}/{order.total}
                    </span>
                  </div>

                  {expandedOrder === order.orderId && (
                    <div className="order-dishes">
                      {order.items.map(item => (
                        <div
                          key={item.id}
                          className={`order-dish-item ${item.status}`}
                        >
                          <div className="order-dish-info">
                            <span className="order-dish-name">{item.dish?.name || '未知菜品'}</span>
                            {item.status === 'completed' && (
                              <span className="order-dish-time">{formatTime(item.completed_at)}</span>
                            )}
                          </div>
                          <div className="order-dish-status">
                            {item.status === 'pending' && <span className="status-badge pending">待做</span>}
                            {item.status === 'cooking' && <span className="status-badge cooking">🔪 制作中</span>}
                            {item.status === 'completed' && <span className="status-badge completed">✓ 已完成</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {totalCount > 0 && (
          <section className="action-section">
            <button className="action-btn dice" onClick={handleRandom}>
              <span className="action-icon" style={{ transform: `rotate(${diceRotation}deg)`, transition: 'transform 0.3s ease' }}>🎲</span>
              <span className="action-text">随机</span>
            </button>
            <button className="action-btn favorite" onClick={handleFavorite}>
              <span className="action-icon">❤️</span>
              <span className="action-text">她爱吃</span>
            </button>
            <button className="action-btn lazy" onClick={handleLazy}>
              <span className="action-icon">💤</span>
              <span className="action-text">偷懒</span>
            </button>
          </section>
        )}
      </main>

      {showLazyResponse && (
        <div className="lazy-toast">
          <span className="lazy-toast-icon">💤</span>
          <span className="lazy-toast-text">{lazyText}</span>
        </div>
      )}
    </div>
  );
}
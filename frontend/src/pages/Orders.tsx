import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Toast } from 'antd-mobile';
import { useOrderStore } from '../stores/orderStore';
import type { Order, OrderStatus } from '../types';
import './Orders.css';

const POLLING_INTERVAL = 10000; // 10秒轮询

const statusConfig: Record<OrderStatus, { label: string; icon: string }> = {
  pending: { label: '待制作', icon: '🔴' },
  cooking: { label: '制作中', icon: '🟡' },
  completed: { label: '已完成', icon: '🟢' },
  cancelled: { label: '已取消', icon: '⚪' },
};

// 根据订单项计算订单整体状态
function getOrderDisplayStatus(order: Order): OrderStatus {
  if (!order.items || order.items.length === 0) {
    return order.status;
  }
  const hasCooking = order.items.some(item => item.status === 'cooking');
  const hasPending = order.items.some(item => item.status === 'pending');
  const hasCompleted = order.items.some(item => item.status === 'completed');

  if (hasCooking) return 'cooking';
  if (hasPending) return 'pending';
  if (hasCompleted && order.items.every(item => item.status === 'completed' || item.status === 'cancelled')) {
    const nonCancelledItems = order.items.filter(item => item.status !== 'cancelled');
    if (nonCancelledItems.length > 0 && nonCancelledItems.every(item => item.status === 'completed')) {
      return 'completed';
    }
  }
  if (order.items.some(item => item.status === 'cancelled')) return 'cancelled';
  return order.status;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export default function Orders() {
  const navigate = useNavigate();
  const { orders, fetchOrders, cancelOrder, isLoading } = useOrderStore();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
      setLastUpdate(new Date());
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // 统计数据
  const cookingCount = orders.filter(o => getOrderDisplayStatus(o) === 'cooking').length;
  const pendingCount = orders.filter(o => getOrderDisplayStatus(o) === 'pending').length;
  const completedCount = orders.filter(o => getOrderDisplayStatus(o) === 'completed').length;

  const getOrderName = (order: Order) => {
    if (!order.dishes || order.dishes.length === 0) return '未知菜品';
    if (order.dishes.length === 1) return order.dishes[0].name;
    if (order.dishes.length === 2) return `${order.dishes[0].name}、${order.dishes[1].name}`;
    return `${order.dishes[0].name}等${order.dishes.length}道菜`;
  };

  const handleCancel = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    Dialog.confirm({
      title: '💔 取消订单',
      content: `确定要取消 "${getOrderName(order)}" 吗？`,
      confirmText: '就是不要了',
      cancelText: '返回',
      onConfirm: async () => {
        try {
          await cancelOrder(order.id);
          Toast.show({ content: '订单已取消', icon: 'success' });
        } catch {
          Toast.show({ content: '取消失败啦', icon: 'fail' });
        }
      },
    });
  };

  const handleViewDetail = (order: Order) => {
    const displayStatus = getOrderDisplayStatus(order);
    const config = statusConfig[displayStatus] || statusConfig.pending;

    const buildDishList = () => {
      if (order.items && order.items.length > 0) {
        return order.items.map(item => {
          const itemConfig = statusConfig[item.status as OrderStatus] || statusConfig.pending;
          const dishName = item.dish?.name || '未知菜品';
          return { name: dishName, icon: itemConfig.icon, status: itemConfig.label };
        });
      }
      if (order.dishes && order.dishes.length > 0) {
        return order.dishes.map(d => ({ name: d.name, icon: '🍽️', status: '' }));
      }
      return [];
    };

    const dishes = buildDishList();

    Dialog.confirm({
      title: '📋 订单详情',
      content: (
        <div className="order-detail-content">
          <div className="order-detail-status">
            {config.icon} <strong>{config.label}</strong>
          </div>
          <div className="order-detail-dishes">
            {dishes.map((dish, i) => (
              <div key={i} className="order-detail-dish">
                <span>{dish.icon}</span>
                <span className="order-item-name">{dish.name}</span>
                {dish.status && (
                  <span style={{ fontSize: '11px', color: '#999' }}>{dish.status}</span>
                )}
              </div>
            ))}
          </div>
          <div className="order-detail-time">⏰ {formatTime(order.created_at)}</div>
          {order.notes && (
            <div style={{ fontSize: '13px', color: '#888', fontStyle: 'italic' }}>
              备注: {order.notes}
            </div>
          )}
        </div>
      ),
      confirmText: displayStatus === 'pending' ? '取消订单' : '关闭',
      cancelText: '返回',
      onConfirm: () => {
        if (displayStatus === 'pending') {
          Dialog.confirm({
            title: '💔 取消订单',
            content: `确定要取消 "${getOrderName(order)}" 吗？`,
            confirmText: '就是不要了',
            cancelText: '返回',
            onConfirm: async () => {
              try {
                await cancelOrder(order.id);
                Toast.show({ content: '订单已取消', icon: 'success' });
              } catch {
                Toast.show({ content: '取消失败啦', icon: 'fail' });
              }
            },
          });
        }
      },
    });
  };

  return (
    <div className="orders-page">
      {/* 顶部导航栏 */}
      <header className="orders-header">
        <div className="orders-title">📦 我的订单</div>
        <div className={`orders-sync-badge ${orders.length > 0 ? 'active' : ''}`}>
          {orders.length > 0 && <span className="sync-dot" />}
          <span>自动同步</span>
        </div>
      </header>

      {/* 统计概览 */}
      <div className="orders-stats">
        <div className="stat-card cooking">
          <span className="stat-icon">🟡</span>
          <div className="stat-info">
            <span className="stat-value">{cookingCount}</span>
            <span className="stat-label">制作中</span>
          </div>
        </div>
        <div className="stat-card pending">
          <span className="stat-icon">🔴</span>
          <div className="stat-info">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">待制作</span>
          </div>
        </div>
        <div className="stat-card completed">
          <span className="stat-icon">🟢</span>
          <div className="stat-info">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">已完成</span>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <main className="orders-main">
        {isLoading ? (
          <div className="orders-loading">
            <span className="loading-icon">🔮</span>
            <p>马上就好啦~</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <p className="empty-title">还没有订单呢</p>
            <p>去菜单页点餐吧~</p>
            <button onClick={() => navigate('/dishes')}>去点餐</button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const displayStatus = getOrderDisplayStatus(order);
              const config = statusConfig[displayStatus] || statusConfig.pending;
              return (
                <div
                  key={order.id}
                  className={`order-card ${displayStatus}`}
                  onClick={() => handleViewDetail(order)}
                >
                  <div className="order-card-header">
                    <div className="order-card-title">
                      <span className="order-status-icon">{config.icon}</span>
                      <span className="order-dish-name">{getOrderName(order)}</span>
                    </div>
                    <span className={`order-status-tag ${displayStatus}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* 菜品项列表 */}
                  {order.items && order.items.length > 0 && (
                    <div className="order-items">
                      {order.items.slice(0, 3).map((item, idx) => {
                        const itemConfig = statusConfig[item.status as OrderStatus] || statusConfig.pending;
                        return (
                          <div key={idx} className="order-item">
                            <span className="order-item-icon">{itemConfig.icon}</span>
                            <span className="order-item-name">{item.dish?.name || '未知'}</span>
                            <span className={`order-item-status ${item.status}`}>
                              {itemConfig.label}
                            </span>
                          </div>
                        );
                      })}
                      {order.items.length > 3 && (
                        <div style={{ fontSize: '11px', color: '#AAA', textAlign: 'center' }}>
                          还有 {order.items.length - 3} 道菜...
                        </div>
                      )}
                    </div>
                  )}

                  <div className="order-card-footer">
                    <span className="order-time">⏰ {formatTime(order.created_at)}</span>
                    {displayStatus === 'pending' && (
                      <button
                        className="order-cancel-btn"
                        onClick={(e) => handleCancel(order, e)}
                      >
                        取消
                      </button>
                    )}
                    {order.notes && (
                      <span className="order-notes">"{order.notes}"</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

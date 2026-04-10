import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Empty, Dialog, Toast } from 'antd-mobile';
import { useOrderStore } from '../stores/orderStore';
import type { Order, OrderStatus, OrderItem } from '../types';
import './Orders.css';

const POLLING_INTERVAL = 10000; // 10秒轮询一次

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: '待制作', color: 'danger', icon: '🔴' },
  cooking: { label: '制作中', color: 'warning', icon: '🟡' },
  completed: { label: '已完成', color: 'success', icon: '🟢' },
  cancelled: { label: '已取消', color: 'default', icon: '⚪' },
};

const itemStatusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: '待制作', color: 'danger', icon: '🔴' },
  cooking: { label: '制作中', color: 'warning', icon: '🟡' },
  completed: { label: '已完成', color: 'success', icon: '🟢' },
  cancelled: { label: '已取消', color: 'default', icon: '⚪' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

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
    // 所有非取消项都完成了
    const nonCancelledItems = order.items.filter(item => item.status !== 'cancelled');
    if (nonCancelledItems.length > 0 && nonCancelledItems.every(item => item.status === 'completed')) {
      return 'completed';
    }
  }
  if (order.items.some(item => item.status === 'cancelled')) return 'cancelled';
  return order.status;
}

export default function Orders() {
  const navigate = useNavigate();
  const { orders, fetchOrders, cancelOrder, isLoading } = useOrderStore();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchOrders();
    // 启动轮询
    const interval = setInterval(() => {
      fetchOrders();
      setLastUpdate(new Date());
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleCancel = (order: Order) => {
    Dialog.confirm({
      content: '确定要取消这个订单吗？',
      confirmText: '取消订单',
      cancelText: '返回',
      onConfirm: async () => {
        try {
          await cancelOrder(order.id);
          Toast.show({ content: '订单已取消', icon: 'success' });
        } catch {
          Toast.show({ content: '取消失败', icon: 'fail' });
        }
      },
    });
  };

  const getOrderCardClass = (status: OrderStatus) => {
    return `order-card order-card-${status}`;
  };

  const getOrderName = (order: Order) => {
    if (!order.dishes || order.dishes.length === 0) return '未知菜品';
    if (order.dishes.length === 1) return order.dishes[0].name;
    if (order.dishes.length === 2) return `${order.dishes[0].name}、${order.dishes[1].name}`;
    return `${order.dishes[0].name}等${order.dishes.length}道菜`;
  };

  const handleViewDetail = (order: Order) => {
    const displayStatus = getOrderDisplayStatus(order);
    const config = statusConfig[displayStatus] || statusConfig.pending;

    // 构建菜品详情列表
    const buildDishList = () => {
      if (order.items && order.items.length > 0) {
        return order.items.map(item => {
          const itemConfig = itemStatusConfig[item.status] || itemStatusConfig.pending;
          const dishName = item.dish?.name || '未知菜品';
          return `• ${dishName} ${itemConfig.icon} ${itemConfig.label}`;
        }).join('\n');
      }
      if (order.dishes && order.dishes.length > 0) {
        return order.dishes.map(d => `• ${d.name}`).join('\n');
      }
      return '无';
    };

    Dialog.confirm({
      title: '订单详情',
      content: (
        <div style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>状态：</strong>{config.icon} {config.label}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>菜品：</strong>
          </div>
          <div style={{ paddingLeft: '12px', whiteSpace: 'pre-line' }}>
            {buildDishList()}
          </div>
          <div style={{ marginTop: '8px' }}>
            <strong>时间：</strong>{formatTime(order.created_at)}
          </div>
          {order.notes && (
            <div style={{ marginTop: '8px' }}>
              <strong>备注：</strong>{order.notes}
            </div>
          )}
        </div>
      ),
      confirmText: displayStatus === 'pending' ? '取消订单' : '关闭',
      cancelText: '返回',
      onConfirm: () => {
        if (displayStatus === 'pending') {
          handleCancel(order);
        }
      },
    });
  };

  return (
    <div className="page-container">
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        我的点餐
      </NavBar>

      {/* 同步状态栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--bg-card)',
        fontSize: '12px',
        color: '#999',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <span>🔄 自动同步订单状态</span>
        <span>
          {orders.filter(o => getOrderDisplayStatus(o) === 'cooking').length > 0 && (
            <span style={{ color: '#FF6B6B', marginRight: '8px' }}>
              🟡 {orders.filter(o => getOrderDisplayStatus(o) === 'cooking').length} 订单制作中
            </span>
          )}
          {orders.filter(o => getOrderDisplayStatus(o) === 'pending').length > 0 && (
            <span style={{ color: '#FF6B6B' }}>
              🔴 {orders.filter(o => getOrderDisplayStatus(o) === 'pending').length} 订单待制作
            </span>
          )}
        </span>
      </div>

      <div className="orders-list">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <span style={{ fontSize: '24px' }}>🔮</span>
            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Empty
              image={
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
              }
              description={
                <div>
                  <p style={{ color: '#666', margin: '0 0 4px', fontSize: '14px' }}>还没有点餐记录</p>
                  <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>去菜单页点餐吧~</p>
                </div>
              }
            />
          </div>
        ) : (
          orders.map((order) => {
            const displayStatus = getOrderDisplayStatus(order);
            const config = statusConfig[displayStatus] || statusConfig.pending;
            return (
              <Card
                key={order.id}
                className={getOrderCardClass(displayStatus)}
                onClick={() => handleViewDetail(order)}
              >
                <div className="order-card-inner">
                  <div className="order-info">
                    <div className="order-header">
                      <span className="order-icon">{config.icon}</span>
                      <span className="order-dish-name">{getOrderName(order)}</span>
                      <Tag color={config.color} className="order-status-tag">{config.label}</Tag>
                    </div>
                    {order.notes && (
                      <div className="order-notes">备注: {order.notes}</div>
                    )}
                    <div className="order-time">{formatTime(order.created_at)}</div>
                  </div>
                  {displayStatus === 'pending' && (
                    <div className="order-actions">
                      <span
                        className="order-cancel-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(order);
                        }}
                      >
                        取消
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

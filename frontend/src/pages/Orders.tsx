import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Tag, Empty, Dialog, Toast } from 'antd-mobile';
import { useOrderStore } from '../stores/orderStore';
import type { Order, OrderStatus } from '../types';
import './Orders.css';

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: '待制作', color: 'danger', icon: '🔴' },
  cooking: { label: '制作中', color: 'warning', icon: '🟡' },
  completed: { label: '已完成', color: 'success', icon: '🟢' },
  cancelled: { label: '已取消', color: 'default', icon: '⚪' },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export default function Orders() {
  const navigate = useNavigate();
  const { orders, fetchOrders, cancelOrder, isLoading } = useOrderStore();

  useEffect(() => {
    fetchOrders();
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

  return (
    <div className="page-container">
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        我的点餐
      </NavBar>

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
            const config = statusConfig[order.status] || statusConfig.pending;
            return (
              <Card
                key={order.id}
                className={getOrderCardClass(order.status)}
              >
                <div className="order-card-inner">
                  <div className="order-info">
                    <div className="order-header">
                      <span className="order-icon">{config.icon}</span>
                      <span className="order-dish-name">{order.dish?.name || order.dish_name || '未知菜品'}</span>
                      <Tag color={config.color} className="order-status-tag">{config.label}</Tag>
                    </div>
                    {order.notes && (
                      <div className="order-notes">备注: {order.notes}</div>
                    )}
                    <div className="order-time">{formatTime(order.created_at)}</div>
                  </div>
                  {order.status === 'pending' && (
                    <div className="order-actions">
                      <span
                        className="order-cancel-btn"
                        onClick={() => handleCancel(order)}
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

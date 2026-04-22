import { useEffect } from 'react';
import { Table, Spin } from 'antd';
import { useAdminStore } from '../../stores/adminStore';
import { formatDateTime } from '../../utils/formatTime';

export default function FavoriteManage() {
  const { favorites, favoriteLoading, fetchFavorites, updateFavoriteRecommend } = useAdminStore();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRecommendChange = async (id: string, checked: boolean) => {
    try {
      await updateFavoriteRecommend(id, checked);
    } catch {
      // handle error
    }
  };

  const columns = [
    { title: '菜名', dataIndex: 'dish_name', key: 'dishName' },
    { title: '评分', dataIndex: 'dish_rating', key: 'dishRating' },
    { title: '收藏时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => formatDateTime(t) },
  ];

  if (favoriteLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-table-header">
        <span className="admin-table-title">收藏列表</span>
        <span style={{ color: '#666', fontSize: 14 }}>管理她喜欢的菜品，支持推荐到首页展示</span>
      </div>

      <Table
        columns={columns}
        dataSource={favorites}
        rowKey="id"
        pagination={{
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
}

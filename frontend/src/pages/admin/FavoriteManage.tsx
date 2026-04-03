import { useEffect } from 'react';
import { Table, Tag, Switch, Spin, Image } from 'antd';
import { useAdminStore } from '../../stores/adminStore';
import type { FavoriteListItem } from '../../api/admin';

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
    {
      title: '图片',
      dataIndex: ['dish', 'image'],
      key: 'image',
      render: (image: string) => image ? (
        <Image src={image} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
      ) : (
        <div style={{ width: 48, height: 48, background: '#f0f0f0', borderRadius: 4 }} />
      ),
    },
    { title: '菜名', dataIndex: ['dish', 'name'], key: 'dishName' },
    {
      title: '分类',
      dataIndex: ['dish', 'category', 'name'],
      key: 'category',
    },
    {
      title: '标签',
      dataIndex: ['dish', 'tags'],
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map((tag: string) => (
            <Tag key={tag} className="admin-tag">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '推荐到首页',
      dataIndex: 'is_recommended',
      key: 'is_recommended',
      render: (recommended: boolean, record: FavoriteListItem) => (
        <Switch
          checked={recommended}
          onChange={(checked) => handleRecommendChange(record.id, checked)}
        />
      ),
    },
    { title: '收藏时间', dataIndex: 'created_at', key: 'created_at' },
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

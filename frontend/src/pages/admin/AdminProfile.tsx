import { Card, Descriptions, Tag, Spin } from 'antd';
import { useAdminStore } from '../../stores/adminStore';

export default function AdminProfile() {
  const { stats } = useAdminStore();

  return (
    <div style={{ padding: 16 }}>
      <Card title="管理员信息" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="角色">
            <Tag color="purple">管理员</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="管理后台">DearMenu 系统</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="数据概览">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="菜品总数">{stats?.total_dishes ?? 0}</Descriptions.Item>
          <Descriptions.Item label="分类总数">{stats?.total_categories ?? 0}</Descriptions.Item>
          <Descriptions.Item label="收藏总数">{stats?.total_favorites ?? 0}</Descriptions.Item>
          <Descriptions.Item label="历史订单">{stats?.total_history ?? 0}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

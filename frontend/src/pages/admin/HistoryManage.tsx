import { useEffect } from 'react';
import { Table, Tag, Switch, Spin, Image } from 'antd';
import { useAdminStore } from '../../stores/adminStore';
import type { HistoryListItem } from '../../api/admin';

export default function HistoryManage() {
  const {
    history, historyTotal, historyLoading, historyParams,
    fetchHistory, updateHistoryCompleted
  } = useAdminStore();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePageChange = (page: number, pageSize: number) => {
    useAdminStore.setState({ historyParams: { page, page_size: pageSize } });
  };

  const handleCompletedChange = async (id: string, checked: boolean) => {
    try {
      await updateHistoryCompleted(id, checked);
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
      title: '状态',
      dataIndex: 'is_completed',
      key: 'is_completed',
      render: (completed: boolean) => (
        <Tag color={completed ? 'green' : 'orange'}>
          {completed ? '已完成' : '待完成'}
        </Tag>
      ),
    },
    {
      title: '是否完成',
      dataIndex: 'is_completed',
      key: 'switch',
      render: (completed: boolean, record: HistoryListItem) => (
        <Switch
          checked={completed}
          onChange={(checked) => handleCompletedChange(record.id, checked)}
        />
      ),
    },
    { title: '点餐时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (time: string) => time || '-',
    },
  ];

  if (historyLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-table-header">
        <span className="admin-table-title">历史记录</span>
        <span style={{ color: '#666', fontSize: 14 }}>查看历史点餐记录，标记完成状态</span>
      </div>

      <Table
        columns={columns}
        dataSource={history}
        rowKey="id"
        loading={historyLoading}
        pagination={{
          current: historyParams.page,
          pageSize: historyParams.page_size,
          total: historyTotal,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
}

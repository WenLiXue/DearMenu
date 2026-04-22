import { useEffect } from 'react';
import { Table, Tag, Spin } from 'antd';
import { useAdminStore } from '../../stores/adminStore';
import { formatDateTime } from '../../utils/formatTime';

export default function HistoryManage() {
  const {
    history, historyTotal, historyLoading, historyParams,
    fetchHistory, updateHistoryCompleted
  } = useAdminStore();

  useEffect(() => {
    fetchHistory(historyParams);
  }, [fetchHistory, historyParams]);

  const handlePageChange = (page: number, pageSize: number) => {
    useAdminStore.setState({ historyParams: { ...historyParams, page, page_size: pageSize } });
  };

  const handleCompletedChange = async (id: string, checked: boolean) => {
    try {
      await updateHistoryCompleted(id, checked);
    } catch {
      // handle error
    }
  };

  const columns = [
    { title: '菜品', dataIndex: 'dish_names', key: 'dish_names', ellipsis: true },
    { title: '数量', dataIndex: 'dish_count', key: 'dish_count', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          cooking: 'blue',
          completed: 'green',
          rejected: 'red',
          cancelled: 'default'
        };
        const textMap: Record<string, string> = {
          pending: '待处理',
          cooking: '制作中',
          completed: '已完成',
          rejected: '已拒绝',
          cancelled: '已取消'
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      }
    },
    { title: '点餐时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => formatDateTime(t) },
    { title: '完成时间', dataIndex: 'completed_at', key: 'completed_at', render: (t: string) => formatDateTime(t) },
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

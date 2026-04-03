import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';
import type { CategoryListItem } from '../../api/admin';

const EMOJI_OPTIONS = ['🍜', '🍔', '🍕', '🍰', '🍹', '🥗', '🍳', '🥘', '🍲', '🥩', '🦐', '🥬'];

export default function CategoryManage() {
  const {
    categories, categoryLoading,
    fetchCategories,
    createCategory, updateCategory, deleteCategory
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openModal = (category?: CategoryListItem) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue({
        name: category.name,
        icon: category.icon,
        sort_order: category.sort_order,
      });
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingCategory) {
        await updateCategory(editingCategory.id, values);
        message.success('更新成功');
      } else {
        await createCategory(values);
        message.success('创建成功');
      }
      closeModal();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon: string) => <span style={{ fontSize: 20 }}>{icon || '📁'}</span>,
    },
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order' },
    { title: '菜品数量', dataIndex: 'dish_count', key: 'dish_count' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CategoryListItem) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该分类吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-card">
      <div className="admin-table-header">
        <span className="admin-table-title">分类列表</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增分类
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="id"
        loading={categoryLoading}
        pagination={false}
      />

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
          </Form.Item>

          <Form.Item name="icon" label="图标">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJI_OPTIONS.map(emoji => (
                <Form.Item key={emoji} noStyle>
                  <Button
                    style={{ fontSize: 20, padding: '4px 8px' }}
                    onClick={() => form.setFieldValue('icon', emoji)}
                  >
                    {emoji}
                  </Button>
                </Form.Item>
              ))}
            </div>
          </Form.Item>

          <Form.Item name="sort_order" label="排序">
            <Input type="number" placeholder="数值越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

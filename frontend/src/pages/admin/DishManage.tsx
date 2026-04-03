import { useEffect, useState } from 'react';
import {
  Table, Button, Input, Select, Space, Modal, Form,
  Upload, Tag, Popconfirm, message, Image
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { useAdminStore } from '../../stores/adminStore';
import type { DishListItem, DishFormData } from '../../api/admin';

const { TextArea } = Input;

export default function DishManage() {
  const {
    dishes, dishTotal, dishLoading, dishParams,
    categories, fetchDishes, fetchCategories,
    createDish, updateDish, deleteDish
  } = useAdminStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState<DishListItem | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchDishes();
  }, [fetchDishes, dishParams, categoryFilter, searchText]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    useAdminStore.setState({ dishParams: { ...dishParams, page: 1, search: value } });
  };

  const handleCategoryChange = (value: string | undefined) => {
    setCategoryFilter(value);
    useAdminStore.setState({ dishParams: { ...dishParams, page: 1, category_id: value } });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    useAdminStore.setState({ dishParams: { ...dishParams, page, page_size: pageSize } });
  };

  const openModal = (dish?: DishListItem) => {
    if (dish) {
      setEditingDish(dish);
      form.setFieldsValue({
        name: dish.name,
        category_id: dish.category_id,
        tags: dish.tags,
        is_recommended: dish.is_recommended,
        description: dish.description,
      });
    } else {
      setEditingDish(null);
      form.resetFields();
    }
    setImageFile(undefined);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingDish(null);
    form.resetFields();
    setImageFile(undefined);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: DishFormData = {
        name: values.name,
        category_id: values.category_id,
        tags: values.tags || [],
        is_recommended: values.is_recommended,
        description: values.description,
        image: imageFile,
      };

      if (editingDish) {
        await updateDish(editingDish.id, data);
        message.success('更新成功');
      } else {
        await createDish(data);
        message.success('创建成功');
      }
      closeModal();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDish(id);
      message.success('删除成功');
    } catch {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      render: (image: string) => image ? (
        <Image src={image} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
      ) : (
        <div style={{ width: 48, height: 48, background: '#f0f0f0', borderRadius: 4 }} />
      ),
    },
    { title: '菜名', dataIndex: 'name', key: 'name' },
    {
      title: '分类',
      dataIndex: ['category', 'name'],
      key: 'category',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => (
            <Tag key={tag} className="admin-tag">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '推荐',
      dataIndex: 'is_recommended',
      key: 'is_recommended',
      render: (recommended: boolean) => (
        <Tag color={recommended ? 'blue' : 'default'}>
          {recommended ? '是' : '否'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: DishListItem) => (
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
            description="删除后无法恢复，确定要删除吗？"
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
        <span className="admin-table-title">菜品列表</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          新增菜品
        </Button>
      </div>

      <div className="admin-search-bar">
        <Input.Search
          placeholder="搜索菜品名称"
          allowClear
          onSearch={handleSearch}
          style={{ width: 280 }}
        />
        <Select
          placeholder="选择分类"
          allowClear
          style={{ width: 160 }}
          onChange={handleCategoryChange}
          options={categories.map(c => ({ label: c.name, value: c.id }))}
        />
      </div>

      <Table
        columns={columns}
        dataSource={dishes}
        rowKey="id"
        loading={dishLoading}
        pagination={{
          current: dishParams.page,
          pageSize: dishParams.page_size,
          total: dishTotal,
          onChange: handlePageChange,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title={editingDish ? '编辑菜品' : '新增菜品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={closeModal}
        okText="确认"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="菜名"
            rules={[{ required: true, message: '请输入菜名' }]}
          >
            <Input placeholder="请输入菜名" />
          </Form.Item>

          <Form.Item name="image" label="图片">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              showUploadList={false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="category_id" label="分类">
            <Select
              placeholder="选择分类"
              allowClear
              options={categories.map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>

          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="输入标签后回车确认"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="is_recommended" label="推荐" valuePropName="checked">
            <Select
              placeholder="是否推荐"
              options={[
                { label: '是', value: true },
                { label: '否', value: false },
              ]}
            />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

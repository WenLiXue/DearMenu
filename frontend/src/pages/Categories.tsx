import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, List, Input, Empty, Dialog, Toast } from 'antd-mobile';
import { useCategoryStore } from '../stores/categoryStore';

export default function Categories() {
  const navigate = useNavigate();
  const { categories, fetchCategories, addCategory, updateCategory, removeCategory, isLoading } = useCategoryStore();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; icon?: string } | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) {
      Toast.show({ content: '请输入分类名称', icon: 'fail' });
      return;
    }
    try {
      await addCategory(name, icon);
      Toast.show({ content: '添加成功', icon: 'success' });
      setShowAddDialog(false);
      setName('');
      setIcon('');
    } catch {
      Toast.show({ content: '添加失败', icon: 'fail' });
    }
  };

  const handleEdit = async () => {
    if (!editingCategory || !name.trim()) {
      Toast.show({ content: '请输入分类名称', icon: 'fail' });
      return;
    }
    try {
      await updateCategory(editingCategory.id, name, icon);
      Toast.show({ content: '更新成功', icon: 'success' });
      setEditingCategory(null);
      setName('');
      setIcon('');
    } catch {
      Toast.show({ content: '更新失败', icon: 'fail' });
    }
  };

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确定要删除这个分类吗？',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await removeCategory(id);
          Toast.show({ content: '删除成功', icon: 'success' });
        } catch {
          Toast.show({ content: '删除失败', icon: 'fail' });
        }
      },
    });
  };

  const openEditDialog = (category: { id: string; name: string; icon?: string }) => {
    setEditingCategory(category);
    setName(category.name);
    setIcon(category.icon || '');
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        style={{ background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)', color: '#FFF' }}
      >
        分类管理
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Button
          block
          color="primary"
          size="large"
          style={{
            background: 'linear-gradient(135deg, #4ECDC4 0%, #6EE7DF 100%)',
            border: 'none',
            borderRadius: '12px',
            marginBottom: '16px'
          }}
          onClick={() => setShowAddDialog(true)}
        >
          添加分类
        </Button>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : categories.length === 0 ? (
          <Empty description="暂无分类" />
        ) : (
          categories.map((category) => (
            <Card
              key={category.id}
              style={{ borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{category.icon || '📂'}</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#2C3E50' }}>{category.name}</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="small" onClick={() => openEditDialog(category)}>编辑</Button>
                  <Button size="small" color="danger" onClick={() => handleDelete(category.id)}>删除</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        visible={showAddDialog}
        header="添加分类"
        content={
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#2C3E50', fontSize: '14px' }}>名称</span>
              <Input
                placeholder="请输入分类名称"
                value={name}
                onChange={setName}
                style={{ marginTop: '8px', background: '#f5f5f5', borderRadius: '8px', padding: '8px' }}
              />
            </div>
            <div>
              <span style={{ color: '#2C3E50', fontSize: '14px' }}>图标</span>
              <Input
                placeholder="请输入图标 emoji（可选）"
                value={icon}
                onChange={setIcon}
                style={{ marginTop: '8px', background: '#f5f5f5', borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </div>
        }
        closeOnAction
        actions={[
          { text: '取消', key: 'cancel', onClick: () => { setShowAddDialog(false); setName(''); setIcon(''); } },
          { text: '确认', key: 'confirm', onClick: handleAdd },
        ]}
      />

      <Dialog
        visible={!!editingCategory}
        header="编辑分类"
        content={
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#2C3E50', fontSize: '14px' }}>名称</span>
              <Input
                placeholder="请输入分类名称"
                value={name}
                onChange={setName}
                style={{ marginTop: '8px', background: '#f5f5f5', borderRadius: '8px', padding: '8px' }}
              />
            </div>
            <div>
              <span style={{ color: '#2C3E50', fontSize: '14px' }}>图标</span>
              <Input
                placeholder="请输入图标 emoji（可选）"
                value={icon}
                onChange={setIcon}
                style={{ marginTop: '8px', background: '#f5f5f5', borderRadius: '8px', padding: '8px' }}
              />
            </div>
          </div>
        }
        closeOnAction
        actions={[
          { text: '取消', key: 'cancel', onClick: () => { setEditingCategory(null); setName(''); setIcon(''); } },
          { text: '确认', key: 'confirm', onClick: handleEdit },
        ]}
      />
    </div>
  );
}

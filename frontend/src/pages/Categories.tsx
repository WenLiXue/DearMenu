import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, Input, Empty, Dialog, Toast } from 'antd-mobile';
import { useCategoryStore } from '../stores/categoryStore';
import './Categories.css';

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
    <div className="categories-page">
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        className="categories-navbar"
      >
        分类管理
      </NavBar>

      <div className="categories-content">
        <Button
          block
          color="primary"
          size="large"
          className="categories-add-btn"
          onClick={() => setShowAddDialog(true)}
        >
          添加分类
        </Button>

        {isLoading ? (
          <div className="categories-loading">加载中...</div>
        ) : categories.length === 0 ? (
          <Empty description="暂无分类" />
        ) : (
          categories.map((category) => (
            <Card
              key={category.id}
              className="categories-card"
            >
              <div className="categories-card-body">
                <div className="categories-card-left">
                  <span className="categories-card-icon">{category.icon || '📂'}</span>
                  <div>
                    <h3 className="categories-card-title">{category.name}</h3>
                  </div>
                </div>
                <div className="categories-card-actions">
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
          <div className="categories-dialog-form">
            <div className="categories-dialog-field">
              <span className="categories-dialog-label">名称</span>
              <Input
                placeholder="请输入分类名称"
                value={name}
                onChange={setName}
                className="categories-dialog-input"
              />
            </div>
            <div className="categories-dialog-field">
              <span className="categories-dialog-label">图标</span>
              <Input
                placeholder="请输入图标 emoji（可选）"
                value={icon}
                onChange={setIcon}
                className="categories-dialog-input"
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
          <div className="categories-dialog-form">
            <div className="categories-dialog-field">
              <span className="categories-dialog-label">名称</span>
              <Input
                placeholder="请输入分类名称"
                value={name}
                onChange={setName}
                className="categories-dialog-input"
              />
            </div>
            <div className="categories-dialog-field">
              <span className="categories-dialog-label">图标</span>
              <Input
                placeholder="请输入图标 emoji（可选）"
                value={icon}
                onChange={setIcon}
                className="categories-dialog-input"
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

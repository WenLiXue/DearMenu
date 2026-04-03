import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, Button, Input, Toast } from 'antd-mobile';
import { useCategoryStore } from '../stores/categoryStore';
import { useDishStore } from '../stores/dishStore';

export default function DishForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { categories, fetchCategories } = useCategoryStore();
  const { dishes, addDish, updateDish, isLoading } = useDishStore();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [tags, setTags] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const dish = dishes.find((d) => d.id === id);
      if (dish) {
        setName(dish.name);
        setCategoryId(dish.category_id);
        setTags(dish.tags?.join(', ') || '');
      }
    }
  }, [id, dishes, isEdit]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ content: '请输入菜品名称', icon: 'fail' });
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    if (categoryId) {
      formData.append('category_id', categoryId);
    }
    if (tags.trim()) {
      formData.append('tags', tags);
    }

    try {
      if (isEdit && id) {
        await updateDish(id, formData);
        Toast.show({ content: '更新成功', icon: 'success' });
      } else {
        await addDish(formData);
        Toast.show({ content: '添加成功', icon: 'success' });
      }
      navigate('/dishes');
    } catch {
      Toast.show({ content: isEdit ? '更新失败' : '添加失败', icon: 'fail' });
    }
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <NavBar
        back="返回"
        onBack={() => navigate('/dishes')}
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        {isEdit ? '编辑菜品' : '添加菜品'}
      </NavBar>

      <div style={{ padding: '16px' }}>
        <Card style={{ borderRadius: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: 500 }}>菜品名称</span>
              <Input
                placeholder="请输入菜品名称"
                value={name}
                onChange={setName}
                style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: 500 }}>标签（用逗号分隔）</span>
              <Input
                placeholder="例如：辣, 下饭, 川菜"
                value={tags}
                onChange={setTags}
                style={{ background: '#f5f5f5', borderRadius: '8px', padding: '12px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ display: 'block', marginBottom: '8px', color: '#2C3E50', fontWeight: 500 }}>分类</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    size="small"
                    color={categoryId === category.id ? 'primary' : 'default'}
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Button
          block
          color="primary"
          size="large"
          loading={isLoading}
          style={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
            border: 'none',
            borderRadius: '12px'
          }}
          onClick={handleSubmit}
        >
          {isEdit ? '保存修改' : '添加菜品'}
        </Button>
      </div>
    </div>
  );
}

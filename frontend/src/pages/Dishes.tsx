import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, Tag, Empty, Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useCategoryStore } from '../stores/categoryStore';
import type { Dish } from '../types';
import './Dishes.css';

export default function Dishes() {
  const navigate = useNavigate();
  const { dishes, fetchDishes, removeDish, addFavorite, removeFavorite, favorites, fetchFavorites, isLoading } = useDishStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const tagsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchDishes(selectedCategory || undefined);
  }, [selectedCategory]);

  const isFavorited = (dishId: string) => favorites.some((f) => f.dish_id === dishId);

  const handleToggleFavorite = async (dish: Dish) => {
    try {
      if (isFavorited(dish.id)) {
        await removeFavorite(dish.id);
        Toast.show({ content: '取消收藏啦', icon: 'success' });
      } else {
        await addFavorite(dish.id);
        Toast.show({ content: '收藏成功~', icon: 'success' });
      }
      fetchFavorites();
    } catch {
      Toast.show({ content: '哎呀，失败了', icon: 'fail' });
    }
  };

  const handleDelete = (id: string) => {
    Dialog.confirm({
      content: '确定要删除这个菜品吗？',
      confirmText: '删除',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await removeDish(id);
          Toast.show({ content: '删除成功', icon: 'success' });
        } catch {
          Toast.show({ content: '删除失败啦', icon: 'fail' });
        }
      },
    });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="page-container">
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        right={
          <span onClick={() => navigate('/dish-form')} style={{ color: '#FFF', cursor: 'pointer' }}>
            添加
          </span>
        }
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        你的小菜单
      </NavBar>

      <div className="category-scroll" ref={tagsScrollRef}>
        <div className="category-tags">
          <div
            onClick={() => handleCategoryChange(null)}
            className={`category-tag ${selectedCategory === null ? 'tag-active' : ''}`}
          >
            🌟 全部
          </div>
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`category-tag ${selectedCategory === category.id ? 'tag-active' : ''}`}
            >
              {category.icon} {category.name}
            </div>
          ))}
        </div>
      </div>

      <div className="dish-list">
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <span style={{ fontSize: '24px' }}>🔮</span>
            <p style={{ margin: '8px 0 0', fontSize: '13px' }}>马上就好啦~</p>
          </div>
        ) : dishes.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <Empty
              image={
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎀</div>
              }
              description={
                <div>
                  <p style={{ color: '#666', margin: '0 0 4px', fontSize: '14px' }}>还没有菜品呢</p>
                  <p style={{ color: '#999', margin: 0, fontSize: '12px' }}>添加一个吧~</p>
                </div>
              }
            />
          </div>
        ) : (
          dishes.map((dish) => (
            <Card key={dish.id} className="dish-card">
              <div className="dish-card-inner">
                <div className="dish-info">
                  <h3 style={{ margin: '0 0 4px', color: '#333', fontSize: '15px', fontWeight: 600 }}>{dish.name}</h3>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} style={{ color: star <= dish.rating ? '#FFE66D' : '#ddd', fontSize: '12px' }}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {dish.category && (
                      <Tag color="success" size="small">{dish.category.icon} {dish.category.name}</Tag>
                    )}
                    {dish.tags && dish.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} color="warning" size="small">{tag}</Tag>
                    ))}
                  </div>
                </div>
                <div className="dish-actions">
                  <Button
                    size="small"
                    color={isFavorited(dish.id) ? 'primary' : 'default'}
                    onClick={() => handleToggleFavorite(dish)}
                    className="action-btn"
                  >
                    {isFavorited(dish.id) ? '❤️' : '🤍'}
                  </Button>
                  <Button size="small" onClick={() => navigate(`/dish-form/${dish.id}`)} className="action-btn">✏️</Button>
                  <Button size="small" color="danger" onClick={() => handleDelete(dish.id)} className="action-btn">🗑️</Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

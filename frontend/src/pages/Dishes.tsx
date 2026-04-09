import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Button, Tag, Empty, Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useOrderStore } from '../stores/orderStore';
import { createBatchOrders } from '../api';
import type { Dish } from '../types';
import './Dishes.css';

export default function Dishes() {
  const navigate = useNavigate();
  const { dishes, fetchDishes, removeDish, addFavorite, removeFavorite, favorites, fetchFavorites, isLoading, dishTotal, dishPage, dishPageSize, fetchDishes: reloadDishes } = useDishStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { createOrder } = useOrderStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const tagsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchDishes(selectedCategory || undefined, 1, dishPageSize);
  }, [selectedCategory]);

  const handlePageChange = (page: number) => {
    fetchDishes(selectedCategory || undefined, page, dishPageSize);
  };

  const isFavorited = (dishId: string) => favorites.some((f) => (f.dish_id || f.id) === dishId);

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

  const handleOrder = (dish: Dish) => {
    Dialog.confirm({
      content: `确定要点 "${dish.name}" 吗？`,
      confirmText: '点餐',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await createOrder({ dish_id: dish.id });
          Toast.show({ content: '点餐成功！', icon: 'success' });
        } catch {
          Toast.show({ content: '点餐失败啦', icon: 'fail' });
        }
      },
    });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedDishes([]);
  };

  const toggleDishSelection = (dishId: string) => {
    setSelectedDishes(prev =>
      prev.includes(dishId)
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleBatchOrder = () => {
    if (selectedDishes.length === 0) return;
    const dishNames = selectedDishes.map(id => dishes.find(d => d.id === id)?.name).join('、');
    Dialog.confirm({
      content: `确定要点 "${dishNames}" ${selectedDishes.length}道菜吗？`,
      confirmText: '点餐',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          // 批量点餐：一次性发送所有菜品
          await createBatchOrders(selectedDishes);
          Toast.show({ content: `已点${selectedDishes.length}道菜！`, icon: 'success' });
          setSelectedDishes([]);
        } catch {
          Toast.show({ content: '点餐失败啦', icon: 'fail' });
        }
      },
    });
  };

  return (
    <div className="page-container">
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        right={
          <span onClick={() => navigate('/dish-form', { state: { hideTabBar: true } })} style={{ color: '#FFF', cursor: 'pointer' }}>
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
                <div
                  onClick={() => toggleDishSelection(dish.id)}
                  style={{ marginRight: '8px', fontSize: '20px', cursor: 'pointer', opacity: selectedDishes.includes(dish.id) ? 1 : 0.3 }}
                >
                  {selectedDishes.includes(dish.id) ? '✅' : '⬜'}
                </div>
                <div className="dish-info" style={{ flex: 1 }}>
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
                      <Tag color="success">{dish.category.icon} {dish.category.name}</Tag>
                    )}
                    {dish.tags && dish.tags.slice(0, 2).map((tag) => (
                      <Tag key={tag} color="warning">{tag}</Tag>
                    ))}
                  </div>
                </div>
                <div className="dish-actions">
                  <Button size="small" color="primary" onClick={() => handleOrder(dish)} className="action-btn action-btn-primary">点餐</Button>
                  <Button
                    size="small"
                    onClick={() => handleToggleFavorite(dish)}
                    className={isFavorited(dish.id) ? 'action-btn-favorited' : 'action-btn'}
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

      {selectedDishes.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
          color: '#FFF',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}>
          <span>已选 {selectedDishes.length} 道菜</span>
          <Button size="small" onClick={handleBatchOrder} style={{ background: '#FFF', color: '#FF6B6B', border: 'none' }}>点餐</Button>
        </div>
      )}

      {dishTotal > dishPageSize && (
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          <Button
            size="small"
            disabled={dishPage <= 1}
            onClick={() => handlePageChange(dishPage - 1)}
          >
            上一页
          </Button>
          <span style={{ color: '#666', fontSize: '13px' }}>
            第 {dishPage} / {Math.ceil(dishTotal / dishPageSize)} 页
          </span>
          <Button
            size="small"
            disabled={dishPage >= Math.ceil(dishTotal / dishPageSize)}
            onClick={() => handlePageChange(dishPage + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}

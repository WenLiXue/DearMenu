import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useOrderStore } from '../stores/orderStore';
import { createBatchOrders } from '../api';
import type { Dish } from '../types';
import './Dishes.css';

export default function Dishes() {
  const navigate = useNavigate();
  const { dishes, fetchDishes, addFavorite, removeFavorite, favorites, fetchFavorites, isLoading } = useDishStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { createOrder } = useOrderStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchDishes(selectedCategory || undefined, 1, 20);
    setSelectedDishes([]);
  }, [selectedCategory]);

  const isFavorited = (dishId: string) => favorites.some((f) => (f.dish_id || f.id) === dishId);

  const handleToggleFavorite = async (dish: Dish, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleDishClick = (dish: Dish) => {
    Dialog.confirm({
      title: `🍽️ ${dish.name}`,
      content: (
        <div className="dish-detail-content">
          <div className="dish-detail-rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={i < dish.rating ? 'star-filled' : 'star-empty'}>★</span>
            ))}
          </div>
          {dish.tags && dish.tags.length > 0 && (
            <div className="dish-detail-tags">
              {dish.tags.map(tag => (
                <span key={tag} className="dish-detail-tag">{tag}</span>
              ))}
            </div>
          )}
          {dish.category && (
            <div className="dish-detail-category">{dish.category.icon} {dish.category.name}</div>
          )}
        </div>
      ),
      confirmText: '🍽️ 点这道',
      cancelText: '取消',
      onConfirm: async () => {
        try {
          await createOrder({ dish_id: dish.id });
          Toast.show({ content: '下单成功！老公收到啦~', icon: 'success' });
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

  const toggleDishSelection = (dishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      title: '🎉 批量点餐',
      content: `确定要点 "${dishNames}" 共 ${selectedDishes.length} 道菜吗？`,
      confirmText: '就是这些了',
      cancelText: '再选选',
      onConfirm: async () => {
        try {
          await createBatchOrders(selectedDishes);
          Toast.show({ content: `已点 ${selectedDishes.length} 道菜！`, icon: 'success' });
          setSelectedDishes([]);
        } catch {
          Toast.show({ content: '点餐失败啦', icon: 'fail' });
        }
      },
    });
  };

  return (
    <div className="dishes-page">
      {/* 顶部操作栏 */}
      <header className="dishes-header">
        <div className="dishes-title">📋 菜单</div>
        <button className="dishes-add-btn" onClick={() => navigate('/dish-form', { state: { hideTabBar: true } })}>
          + 添加菜品
        </button>
      </header>

      {/* 分类Tab */}
      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => handleCategoryChange(null)}
        >
          🌟 全部
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* 菜品网格 */}
      <main className="dishes-main">
        {isLoading ? (
          <div className="dishes-loading">
            <span className="loading-icon">🔮</span>
            <p>马上就好啦~</p>
          </div>
        ) : dishes.length === 0 ? (
          <div className="dishes-empty">
            <div className="empty-icon">🎀</div>
            <p>还没有菜品呢</p>
            <button onClick={() => navigate('/dish-form', { state: { hideTabBar: true } })}>
              添加第一道菜
            </button>
          </div>
        ) : (
          <div className="dish-grid">
            {dishes.map((dish) => (
              <div
                key={dish.id}
                className={`dish-card ${selectedDishes.includes(dish.id) ? 'selected' : ''}`}
                onClick={() => handleDishClick(dish)}
              >
                {/* 选中标记 */}
                <div
                  className="dish-check"
                  onClick={(e) => toggleDishSelection(dish.id, e)}
                >
                  {selectedDishes.includes(dish.id) ? '✓' : ''}
                </div>

                {/* 收藏按钮 */}
                <button
                  className={`dish-favorite ${isFavorited(dish.id) ? 'favorited' : ''}`}
                  onClick={(e) => handleToggleFavorite(dish, e)}
                >
                  {isFavorited(dish.id) ? '❤️' : '🤍'}
                </button>

                {/* 菜品图标 */}
                <div className="dish-icon">🍽️</div>

                {/* 菜品信息 */}
                <div className="dish-name">{dish.name}</div>

                {/* 评分 */}
                <div className="dish-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < dish.rating ? 'star-filled' : 'star-empty'}>★</span>
                  ))}
                </div>

                {/* 标签 */}
                {dish.tags && dish.tags.length > 0 && (
                  <div className="dish-tags">
                    {dish.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="dish-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 批量选择底部栏 */}
      {selectedDishes.length > 0 && (
        <div className="batch-order-bar">
          <span className="batch-count">已选 {selectedDishes.length} 道菜</span>
          <button className="batch-btn" onClick={handleBatchOrder}>
            🍽️ 点餐
          </button>
        </div>
      )}
    </div>
  );
}

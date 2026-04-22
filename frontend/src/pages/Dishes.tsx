import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useCategoryStore } from '../stores/categoryStore';
import { createBatchOrders, createOrder } from '../api';
import type { Dish } from '../types';
import './Dishes.css';

export default function Dishes() {
  const navigate = useNavigate();
  const { dishes, fetchDishes, addFavorite, removeFavorite, favorites, fetchFavorites, isLoading } = useDishStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [candidateDishes, setCandidateDishes] = useState<Dish[]>([]); // 候选池
  const [detailDish, setDetailDish] = useState<Dish | null>(null); // 详情弹窗

  useEffect(() => {
    fetchCategories();
    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchDishes(selectedCategory || undefined, 1, 20);
  }, [selectedCategory]);

  const isFavorited = (dishId: string) => favorites.some((f) => (f.dish_id || f.id) === dishId);

  const isInCandidate = (dishId: string) => candidateDishes.some(d => d.id === dishId);

  // 切换候选状态（点击卡片主区域）
  const toggleCandidate = (dish: Dish) => {
    setCandidateDishes(prev =>
      prev.some(d => d.id === dish.id)
        ? prev.filter(d => d.id !== dish.id)
        : [...prev, dish]
    );
  };

  // 移除单个候选
  const removeFromCandidate = (dishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCandidateDishes(prev => prev.filter(d => d.id !== dishId));
  };

  // 切换收藏
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

  // 长按打开详情
  const handleLongPress = (dish: Dish) => {
    setDetailDish(dish);
  };

  // 打开详情弹窗（通过按钮）
  const handleOpenDetail = (dish: Dish, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailDish(dish);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setDetailDish(null);
  };

  // 详情弹窗中"加入候选"
  const handleAddFromDetail = () => {
    if (detailDish && !isInCandidate(detailDish.id)) {
      setCandidateDishes(prev => [...prev, detailDish]);
      Toast.show({ content: `已加入候选：${detailDish.name}`, icon: 'success' });
    }
    setDetailDish(null);
  };

  // 详情弹窗中"点这道"
  const handleOrderFromDetail = async () => {
    if (!detailDish) return;
    try {
      await createOrder({ dish_id: detailDish.id });
      Toast.show({ content: '下单成功！老公收到啦~', icon: 'success' });
      setDetailDish(null);
    } catch {
      Toast.show({ content: '点餐失败啦', icon: 'fail' });
    }
  };

  // 批量点餐
  const handleBatchOrder = () => {
    if (candidateDishes.length === 0) return;
    const dishNames = candidateDishes.map(d => d.name).join('、');
    Dialog.confirm({
      title: '🎉 确认点餐',
      content: `确定要点 "${dishNames}" 共 ${candidateDishes.length} 道菜吗？`,
      confirmText: '就是这些了',
      cancelText: '再选选',
      onConfirm: async () => {
        try {
          const dishIds = candidateDishes.map(d => d.id);
          await createBatchOrders(dishIds);
          Toast.show({ content: `已点 ${candidateDishes.length} 道菜！`, icon: 'success' });
          setCandidateDishes([]);
        } catch {
          Toast.show({ content: '点餐失败啦', icon: 'fail' });
        }
      },
    });
  };

  // 推荐菜品（取前4个高评分）
  const recommendedDishes = [...dishes].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);

  return (
    <div className="dishes-page">
      {/* 顶部操作栏 */}
      <header className="dishes-header">
        <div className="dishes-title">📋 菜单</div>
        <button className="dishes-add-btn" onClick={() => navigate('/dish-form', { state: { hideTabBar: true } })}>
          + 添加菜品
        </button>
      </header>

      {/* 推荐候选区（横滑） */}
      {recommendedDishes.length > 0 && (
        <div className="recommend-strip">
          <div className="recommend-strip-label">👑 推荐</div>
          <div className="recommend-strip-scroll">
            {recommendedDishes.map(dish => (
              <div
                key={dish.id}
                className={`recommend-chip ${isInCandidate(dish.id) ? 'selected' : ''}`}
                onClick={() => toggleCandidate(dish)}
              >
                {dish.name}
                {isInCandidate(dish.id) && <span className="check-icon">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分类Tab */}
      <div className="category-tabs">
        <button
          className={`category-tab ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          🌟 全部
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
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
                className={`dish-card ${isInCandidate(dish.id) ? 'selected' : ''}`}
                onClick={() => toggleCandidate(dish)}
                onContextMenu={(e) => { e.preventDefault(); handleLongPress(dish); }}
                onTouchStart={() => {}}
              >
                {/* 选中标记 */}
                {isInCandidate(dish.id) && (
                  <div className="dish-check">✓</div>
                )}

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

                {/* 收藏按钮 */}
                <div
                  className={`dish-footer ${isInCandidate(dish.id) ? 'with-selection' : ''}`}>
                  <button
                    className={`dish-favorite ${isFavorited(dish.id) ? 'favorited' : ''}`}
                    onClick={(e) => handleToggleFavorite(dish, e)}
                  >
                    {isFavorited(dish.id) ? '❤️' : '🤍'}
                  </button>
                  <button
                    className="dish-detail-btn"
                    onClick={(e) => handleOpenDetail(dish, e)}
                  >
                    ⋯
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 候选池（悬浮底部） */}
      {candidateDishes.length > 0 && (
        <div className="candidate-pool">
          <div className="candidate-header">
            <span className="candidate-label">今晚候选</span>
            <span className="candidate-count">{candidateDishes.length}道</span>
          </div>
          <div className="candidate-dishes">
            {candidateDishes.map(dish => (
              <div key={dish.id} className="candidate-chip">
                <span>{dish.name}</span>
                <button
                  className="candidate-remove"
                  onClick={(e) => removeFromCandidate(dish.id, e)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="candidate-order-btn" onClick={handleBatchOrder}>
            就吃这些 🍽️
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      {detailDish && (
        <Dialog
          visible={true}
          title={`🍽️ ${detailDish.name}`}
          onClose={handleCloseDetail}
          footer={[
            { text: '取消', onClick: handleCloseDetail },
            { text: '加入候选', onClick: handleAddFromDetail },
            { text: '点这道', onClick: handleOrderFromDetail },
          ]}
        >
          <div className="dish-detail-content">
            <div className="dish-detail-icon">{detailDish.rating >= 4 ? '😍' : detailDish.rating >= 3 ? '😊' : '😐'}</div>
            <div className="dish-detail-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < detailDish.rating ? 'star-filled' : 'star-empty'}>★</span>
              ))}
            </div>
            {detailDish.tags && detailDish.tags.length > 0 && (
              <div className="dish-detail-tags">
                {detailDish.tags.map(tag => (
                  <span key={tag} className="dish-detail-tag">{tag}</span>
                ))}
              </div>
            )}
            {detailDish.category && (
              <div className="dish-detail-category">{detailDish.category.icon} {detailDish.category.name}</div>
            )}
            <div className="dish-detail-actions">
              <button
                className={`detail-favorite-btn ${isFavorited(detailDish.id) ? 'favorited' : ''}`}
                onClick={(e) => { handleToggleFavorite(detailDish, e); }}
              >
                {isFavorited(detailDish.id) ? '❤️ 已收藏' : '🤍 收藏'}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

import { useEffect } from 'react';
import { Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useNavigate } from 'react-router-dom';
import './Favorites.css';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, fetchFavorites, removeFavorite, isLoading, favoriteTotal, favoritePage, favoritePageSize } = useDishStore();

  useEffect(() => {
    fetchFavorites(1, favoritePageSize);
  }, []);

  const handlePageChange = (page: number) => {
    fetchFavorites(page, favoritePageSize);
  };

  const handleRemove = async (dishId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    Dialog.confirm({
      title: '💔 取消收藏',
      content: '确定要取消收藏这道菜吗？',
      confirmText: '就是不要了',
      cancelText: '再想想',
      onConfirm: async () => {
        try {
          await removeFavorite(dishId);
          Toast.show({ content: '已取消收藏', icon: 'success' });
          fetchFavorites(1, favoritePageSize);
        } catch {
          Toast.show({ content: '取消失败啦', icon: 'fail' });
        }
      },
    });
  };

  const totalPages = Math.ceil(favoriteTotal / favoritePageSize);

  return (
    <div className="favorites-page">
      {/* 顶部导航栏 */}
      <header className="favorites-header">
        <div className="favorites-title">❤️ 我的收藏</div>
        <div className="favorites-count">{favoriteTotal} 道收藏</div>
      </header>

      {/* 收藏列表 */}
      <main className="favorites-main">
        {isLoading ? (
          <div className="favorites-loading">
            <span className="loading-icon">🔮</span>
            <p>马上就好啦~</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="favorites-empty">
            <div className="empty-icon">❤️</div>
            <p className="empty-title">还没有收藏呢</p>
            <p>去菜单页收藏喜欢的菜品吧~</p>
            <button onClick={() => navigate('/dishes')}>去逛菜单</button>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="favorite-card"
                onClick={() => navigate('/dishes')}
              >
                <div className="favorite-card-header">
                  <div className="favorite-card-info">
                    <span className="favorite-icon">🍽️</span>
                    <div>
                      <div className="favorite-name">{favorite.name || `菜品 #${favorite.id}`}</div>
                      <div className="favorite-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < favorite.rating ? 'star-filled' : 'star-empty'}>★</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    className="favorite-remove-btn"
                    onClick={(e) => handleRemove(favorite.id, e)}
                  >
                    取消
                  </button>
                </div>

                <div className="favorite-tags">
                  {favorite.tags && favorite.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="favorite-tag">{tag}</span>
                  ))}
                </div>

                {favorite.category && (
                  <div className="favorite-card-footer">
                    <span className="favorite-category">{favorite.category.icon} {favorite.category.name}</span>
                    <span className="favorite-action-text">点击查看详情 ›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {favoriteTotal > favoritePageSize && (
          <div className="favorites-pagination">
            <button
              className="pagination-btn"
              disabled={favoritePage <= 1}
              onClick={() => handlePageChange(favoritePage - 1)}
            >
              ‹ 上一页
            </button>
            <span className="pagination-info">
              {favoritePage} / {totalPages}
            </span>
            <button
              className="pagination-btn"
              disabled={favoritePage >= totalPages}
              onClick={() => handlePageChange(favoritePage + 1)}
            >
              下一页 ›
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

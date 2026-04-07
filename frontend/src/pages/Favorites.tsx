import { useEffect } from 'react';
import { NavBar, Card, Tag, Empty, Button, Dialog, Toast } from 'antd-mobile';
import { useDishStore } from '../stores/dishStore';
import { useNavigate } from 'react-router-dom';

export default function Favorites() {
  const navigate = useNavigate();
  const { favorites, fetchFavorites, removeFavorite, isLoading, favoriteTotal, favoritePage, favoritePageSize } = useDishStore();

  useEffect(() => {
    fetchFavorites(1, favoritePageSize);
  }, []);

  const handlePageChange = (page: number) => {
    fetchFavorites(page, favoritePageSize);
  };

  const handleRemove = async (dishId: string) => {
    Dialog.confirm({
      content: '确定要取消收藏吗？',
      confirmText: '取消收藏',
      cancelText: '再想想',
      onConfirm: async () => {
        try {
          await removeFavorite(dishId);
          Toast.show({ content: '已取消收藏', icon: 'success' });
          fetchFavorites();
        } catch {
          Toast.show({ content: '取消失败', icon: 'fail' });
        }
      },
    });
  };

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <NavBar
        back="返回"
        onBack={() => navigate('/home')}
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)', color: '#FFF' }}
      >
        我的收藏
      </NavBar>

      <div style={{ padding: '16px' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : favorites.length === 0 ? (
          <Empty description="暂无收藏" />
        ) : (
          favorites.map((favorite) => (
            <Card
              key={favorite.id}
              style={{ borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', color: '#2C3E50' }}>{favorite.name || `菜品 #${favorite.id}`}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} style={{ color: star <= favorite.rating ? '#FFE66D' : '#ddd', fontSize: '14px' }}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {favorite.tags && favorite.tags.slice(0, 2).map((tag) => (
                        <Tag key={tag} color="warning">{tag}</Tag>
                      ))}
                    </div>
                  </div>
                  <Button size="small" color="danger" onClick={() => handleRemove(favorite.id)}>
                    取消收藏
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {favoriteTotal > favoritePageSize && (
        <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
          <Button
            size="small"
            disabled={favoritePage <= 1}
            onClick={() => handlePageChange(favoritePage - 1)}
          >
            上一页
          </Button>
          <span style={{ color: '#666', fontSize: '13px' }}>
            第 {favoritePage} / {Math.ceil(favoriteTotal / favoritePageSize)} 页
          </span>
          <Button
            size="small"
            disabled={favoritePage >= Math.ceil(favoriteTotal / favoritePageSize)}
            onClick={() => handlePageChange(favoritePage + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}

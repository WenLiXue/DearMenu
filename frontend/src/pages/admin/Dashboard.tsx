import { useEffect } from 'react';
import { Table, Spin, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { formatDateTime } from '../../utils/formatTime';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    stats,
    statsLoading,
    fetchStats,
    enhancedStats,
    weeklyStats,
    monthlyStats,
    topDishes,
    categoryStats,
    statsTab,
    setStatsTab,
    fetchEnhancedStats,
    fetchWeeklyStats,
    fetchMonthlyStats,
    fetchTopDishes,
    fetchCategoryStats,
  } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchEnhancedStats();
    fetchWeeklyStats();
    fetchMonthlyStats();
    fetchTopDishes();
    fetchCategoryStats();
  }, []);

  const goToDishes = () => navigate('/admin/dishes');
  const goToCategories = () => navigate('/admin/categories');
  const goToFavorites = () => navigate('/admin/favorites');
  const goToHistory = () => navigate('/admin/history');

  const historyColumns = [
    { title: '菜品', dataIndex: 'dish_names', key: 'dish_names', ellipsis: true },
    { title: '数量', dataIndex: 'dish_count', key: 'dish_count', width: 60 },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: (t: string) => formatDateTime(t) },
  ];

  // 渲染今日统计
  const renderTodayStats = () => (
    <div>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{enhancedStats?.today_orders ?? 0}</div>
          <div className="admin-stat-label">今日点餐</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{enhancedStats?.today_completed ?? 0}</div>
          <div className="admin-stat-label">今日完成</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{enhancedStats?.today_recommendations ?? 0}</div>
          <div className="admin-stat-label">今日推荐</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{enhancedStats?.week_total ?? 0}</div>
          <div className="admin-stat-label">本周点餐</div>
        </div>
      </div>

      {/* 本周趋势 */}
      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-table-header">
          <span className="admin-table-title">本周趋势</span>
        </div>
        <div style={{ padding: '12px' }}>
          {enhancedStats?.weekly_trend && enhancedStats.weekly_trend.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px' }}>
              {enhancedStats.weekly_trend.map((item, index) => {
                const maxCount = Math.max(...enhancedStats.weekly_trend.map(t => t.count), 1);
                const height = Math.max((item.count / maxCount) * 100, 4);
                const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
                const dayIndex = new Date(item.date).getDay() || 7;
                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>{item.count}</div>
                    <div
                      style={{
                        width: '32px',
                        height: `${height}px`,
                        backgroundColor: '#FF6B6B',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s',
                      }}
                    />
                    <div style={{ fontSize: '11px', color: '#999' }}>{dayNames[index]}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
              暂无趋势数据
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染本周统计
  const renderWeeklyStats = () => (
    <div>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{weeklyStats?.total_orders ?? 0}</div>
          <div className="admin-stat-label">本周点餐</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{weeklyStats?.total_completed ?? 0}</div>
          <div className="admin-stat-label">本周完成</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{weeklyStats?.completion_rate ?? 0}%</div>
          <div className="admin-stat-label">完成率</div>
        </div>
      </div>

      {/* 每日明细 */}
      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-table-header">
          <span className="admin-table-title">每日明细</span>
        </div>
        <Table
          dataSource={weeklyStats?.daily_stats?.map((item, index) => ({ ...item, key: index })) ?? []}
          columns={[
            { title: '日期', dataIndex: 'date', key: 'date', render: (date: string) => date },
            { title: '点餐次数', dataIndex: 'orders', key: 'orders' },
            { title: '完成次数', dataIndex: 'completed', key: 'completed' },
          ]}
          rowKey="date"
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );

  // 渲染本月统计
  const renderMonthlyStats = () => (
    <div>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{monthlyStats?.total_orders ?? 0}</div>
          <div className="admin-stat-label">本月点餐</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{monthlyStats?.total_completed ?? 0}</div>
          <div className="admin-stat-label">本月完成</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{monthlyStats?.completion_rate ?? 0}%</div>
          <div className="admin-stat-label">完成率</div>
        </div>
      </div>

      {/* 热门分类 */}
      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-table-header">
          <span className="admin-table-title">热门分类 Top5</span>
        </div>
        <Table
          dataSource={monthlyStats?.top_categories?.map((item, index) => ({ ...item, key: index })) ?? []}
          columns={[
            { title: '排名', key: 'rank', render: (_: unknown, _record: unknown, index: number) => index + 1 },
            { title: '分类', dataIndex: 'name', key: 'name' },
            { title: '点餐次数', dataIndex: 'count', key: 'count' },
          ]}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </div>

      {/* 热门菜品 */}
      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-table-header">
          <span className="admin-table-title">热门菜品 Top5</span>
        </div>
        <Table
          dataSource={monthlyStats?.top_dishes?.map((item, index) => ({ ...item, key: index })) ?? []}
          columns={[
            { title: '排名', key: 'rank', render: (_: unknown, _record: unknown, index: number) => index + 1 },
            { title: '菜品', dataIndex: 'name', key: 'name' },
            { title: '点餐次数', dataIndex: 'count', key: 'count' },
          ]}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );

  // 渲染热门菜品
  const renderTopDishes = () => (
    <div className="admin-card" style={{ marginTop: '16px' }}>
      <div className="admin-table-header">
        <span className="admin-table-title">热门菜品</span>
      </div>
      <Table
        dataSource={topDishes.map((item, index) => ({ ...item, key: item.id }))}
        columns={[
          { title: '排名', key: 'rank', render: (_: unknown, _record: unknown, index: number) => index + 1 },
          { title: '菜品', dataIndex: 'name', key: 'name' },
          { title: '分类', dataIndex: 'category_name', key: 'category_name', render: (cat: string | null) => cat || '-' },
          { title: '点餐次数', dataIndex: 'count', key: 'count' },
          { title: '评分', dataIndex: 'rating', key: 'rating', render: (r: number) => '⭐'.repeat(r) },
        ]}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </div>
  );

  // 渲染分类分析
  const renderCategoryStats = () => (
    <div className="admin-card" style={{ marginTop: '16px' }}>
      <div className="admin-table-header">
        <span className="admin-table-title">分类分析</span>
      </div>
      <Table
        dataSource={categoryStats.map((item) => ({ ...item, key: item.id }))}
        columns={[
          { title: '分类', key: 'name', render: (_: unknown, record: typeof categoryStats[0]) => `${record.icon} ${record.name}` },
          { title: '菜品数', dataIndex: 'dish_count', key: 'dish_count' },
          { title: '点餐次数', dataIndex: 'order_count', key: 'order_count' },
          { title: '收藏数', dataIndex: 'favorite_count', key: 'favorite_count' },
        ]}
        rowKey="id"
        pagination={false}
        size="small"
      />
    </div>
  );

  if (statsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {/* 基础统计 */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card" onClick={goToDishes} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-value">{stats?.total_dishes ?? 0}</div>
          <div className="admin-stat-label">菜品总数</div>
        </div>
        <div className="admin-stat-card" onClick={goToCategories} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-value">{stats?.total_categories ?? 0}</div>
          <div className="admin-stat-label">分类总数</div>
        </div>
        <div className="admin-stat-card" onClick={goToFavorites} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-value">{stats?.total_favorites ?? 0}</div>
          <div className="admin-stat-label">收藏总数</div>
        </div>
        <div className="admin-stat-card" onClick={goToHistory} style={{ cursor: 'pointer' }}>
          <div className="admin-stat-value">{stats?.total_history ?? 0}</div>
          <div className="admin-stat-label">历史记录</div>
        </div>
      </div>

      {/* 统计Tab切换 */}
      <div style={{ marginTop: '16px' }}>
        <Tabs
          activeKey={statsTab}
          onChange={(key) => setStatsTab(key as 'today' | 'weekly' | 'monthly')}
          items={[
            { key: 'today', label: '今日', children: renderTodayStats() },
            { key: 'weekly', label: '本周', children: renderWeeklyStats() },
            { key: 'monthly', label: '本月', children: renderMonthlyStats() },
          ]}
        />
      </div>

      {/* 热门菜品 */}
      {renderTopDishes()}

      {/* 分类分析 */}
      {renderCategoryStats()}

      {/* 最近点餐记录 */}
      <div className="admin-card" style={{ marginTop: '16px' }}>
        <div className="admin-table-header">
          <span className="admin-table-title">最近点餐记录</span>
        </div>
        <Table
          columns={historyColumns}
          dataSource={stats?.recent_history ?? []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );
}

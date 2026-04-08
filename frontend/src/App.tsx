import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import { DeviceProvider } from './contexts/DeviceContext';
import WifeLayout from './components/WifeLayout';
import HusbandLayout from './components/HusbandLayout';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Categories from './pages/Categories';
import Dishes from './pages/Dishes';
import DishForm from './pages/DishForm';
import Favorites from './pages/Favorites';
import History from './pages/History';
import RandomPick from './pages/RandomPick';
import Husband from './pages/HusbandPage/Husband';
import HusbandTasks from './pages/HusbandPage/HusbandTasks';
import HusbandHistory from './pages/HusbandPage/HusbandHistory';
import Dashboard from './pages/admin/Dashboard';
import DishManage from './pages/admin/DishManage';
import CategoryManage from './pages/admin/CategoryManage';
import FavoriteManage from './pages/admin/FavoriteManage';
import HistoryManage from './pages/admin/HistoryManage';
import Settings from './pages/admin/Settings';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <ConfigProvider>
      <DeviceProvider>
        <BrowserRouter>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 老婆端路由 - WifeLayout */}
            <Route
              element={
                <AuthGuard allowedRoles={['wife']}>
                  <WifeLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/dishes" element={<Dishes />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/profile" element={<Profile />} />
              {/* 二级页面（通过 location.state?.hideTabBar 隐藏 TabBar） */}
              <Route path="/categories" element={<Categories />} />
              <Route path="/dish-form/:id?" element={<DishForm />} />
              <Route path="/history" element={<History />} />
              <Route path="/random" element={<RandomPick />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:userId" element={<Chat />} />
            </Route>

            {/* 老公端路由 - HusbandLayout */}
            <Route
              element={
                <AuthGuard allowedRoles={['husband']}>
                  <HusbandLayout />
                </AuthGuard>
              }
            >
              <Route path="/husband" element={<Husband />} />
              <Route path="/husband/tasks" element={<HusbandTasks />} />
              <Route path="/husband/history" element={<HusbandHistory />} />
            </Route>

            {/* 管理端路由 */}
            <Route
              element={
                <AuthGuard allowedRoles={['admin']}>
                  <AdminLayout />
                </AuthGuard>
              }
            >
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/dishes" element={<DishManage />} />
              <Route path="/admin/categories" element={<CategoryManage />} />
              <Route path="/admin/favorites" element={<FavoriteManage />} />
              <Route path="/admin/history" element={<HistoryManage />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DeviceProvider>
    </ConfigProvider>
  );
}

export default App;

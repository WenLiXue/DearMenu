import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import { DeviceProvider } from './contexts/DeviceContext';
import Layout from './components/Layout';
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

            {/* 老婆端路由 */}
            <Route
              path="/"
              element={
                <AuthGuard allowedRoles={['wife']}>
                  <Layout />
                </AuthGuard>
              }
            >
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/dishes" element={<Dishes />} />
              <Route path="/dish-form" element={<DishForm />} />
              <Route path="/dish-form/:id" element={<DishForm />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/history" element={<History />} />
              <Route path="/random" element={<RandomPick />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:userId" element={<Chat />} />
            </Route>

            {/* 老公端路由 */}
            <Route
              path="/husband"
              element={
                <AuthGuard allowedRoles={['husband']}>
                  <Husband />
                </AuthGuard>
              }
            />
            <Route
              path="/husband/history"
              element={
                <AuthGuard allowedRoles={['husband']}>
                  <HusbandHistory />
                </AuthGuard>
              }
            />

            {/* 管理端路由 */}
            <Route
              path="/admin"
              element={
                <AuthGuard allowedRoles={['admin']}>
                  <AdminLayout />
                </AuthGuard>
              }
            >
              <Route index element={<Dashboard />} />
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

import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import Topbar from './Topbar';

const MainLayout = () => (
  <div className="min-h-screen flex w-full bg-background">
    <AppSidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar />
      <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default MainLayout;

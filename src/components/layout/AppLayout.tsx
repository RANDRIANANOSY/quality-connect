import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 px-4 md:px-8 py-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

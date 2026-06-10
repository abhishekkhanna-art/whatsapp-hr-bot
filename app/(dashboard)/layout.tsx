import Link from "next/link";
import { MessageCircle, Settings, LayoutDashboard } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-whatsapp-teal flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="hidden md:block font-semibold text-gray-800">Priya HR Bot</span>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:block text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:block text-sm font-medium">Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="hidden md:block text-xs text-gray-400">Vahan Internal</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import "./dashboard.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="dashboard-layout">
      {/* Background ambient glows specific to dashboard */}
      <div className="ambient-glow-1" style={{ top: '-20%', left: '0%', opacity: 0.1 }}></div>
      <div className="ambient-glow-2" style={{ top: '60%', right: '-10%', opacity: 0.05 }}></div>
      
      <Sidebar />
      <div className="main-wrapper">
        <Topbar userName={session.user?.name || 'User'} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';
import { Smartphone, LayoutDashboard, FileText } from 'lucide-react';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isReceipts = location.pathname.startsWith('/rechnungen');

  return (
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold">Beleg Manager</div>
              <div className="text-xs text-muted-foreground">KI Rechnungen</div>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link to="/">
                  <SidebarMenuButton isActive={isDashboard}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/rechnungen">
                  <SidebarMenuButton isActive={isReceipts}>
                    <FileText />
                    <span>Rechnungen</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="border-b">
          <div className="container mx-auto px-4 h-14 flex items-center gap-3">
            <SidebarTrigger />
            <div className="text-sm text-muted-foreground">{isDashboard ? 'Dashboard' : 'Rechnungen'}</div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;



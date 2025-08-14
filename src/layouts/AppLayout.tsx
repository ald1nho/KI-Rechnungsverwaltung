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
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Smartphone, LayoutDashboard, FileText, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
  const isReceipts = location.pathname.startsWith('/rechnungen');

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Erfolgreich abgemeldet');
    } catch (error) {
      toast.error('Fehler beim Abmelden');
    }
  };

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
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex flex-col gap-2 p-2">
                <div className="text-xs text-muted-foreground">Angemeldet als:</div>
                <div className="text-sm font-medium truncate">{user?.email}</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
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



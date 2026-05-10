
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Brain,
  Calendar,
  Receipt,
  Users,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  Menu,
  Scale,
  Briefcase,
  UserCheck,
  Loader2,
  AlertTriangle
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Invitation } from "@/entities/Invitation";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { user, logout, navigateToLogin, isLoadingAuth, authError } = useAuth();
  const [invitationCount, setInvitationCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      // Fetch pending invitations for the current user's email
      const pendingInvitations = await Invitation.filter({
        invitee_email: user.email,
        status: 'pending'
      });
      setInvitationCount(pendingInvitations.length);
    } catch (error) {
      console.error("Failed to load invitations:", error);
      setInvitationCount(0);
    }
  };

  const handleLogout = async () => {
    logout();
  };

  const handleLoginAgain = () => {
    navigateToLogin();
  };

  // Define navigation items based on user role
  const getNavigationItems = () => {
    if (!user) return { mainNavigation: [], resourceNavigation: [] };

    // Client-specific layout
    if (user?.account_type === 'client') {
      const clientDashboardUrl = createPageUrl("ClientDashboard");
      const clientDocumentsUrl = createPageUrl("ClientDocuments");

      if (location.pathname !== clientDashboardUrl && location.pathname !== clientDocumentsUrl) {
        window.location.href = clientDashboardUrl;
        return { mainNavigation: [], resourceNavigation: [] }; // Prevent rendering old items during redirect
      }
      return {
        mainNavigation: [
          {
            title: "My Dashboard",
            url: clientDashboardUrl,
            icon: LayoutDashboard,
            description: "View your case overview"
          },
          {
            title: "My Documents",
            url: clientDocumentsUrl,
            icon: FileText,
            description: "Access your documents"
          },
        ],
        resourceNavigation: []
      };
    }

    const mainNavigation = [
      {
        title: "Dashboard",
        url: createPageUrl("Dashboard"),
        icon: LayoutDashboard,
        description: "Overview & Analytics"
      },
      {
        title: user?.account_type === 'associate' ? "My Cases" : "Cases",
        url: createPageUrl("Cases"),
        icon: Briefcase,
        description: user?.account_type === 'associate' ? "Assigned Cases" : "Case Management"
      },
      {
        title: "Clients",
        url: createPageUrl("Clients"),
        icon: Users,
        description: "Client Management"
      },
      {
        title: "AI Research",
        url: createPageUrl("Research"),
        icon: Brain,
        description: "Legal Research Hub"
      },
      {
        title: "Calendar",
        url: createPageUrl("Calendar"),
        icon: Calendar,
        description: "Hearings & Tasks"
      },
      {
        title: "Documents",
        url: createPageUrl("Documents"),
        icon: FileText,
        description: "Document Library"
      }
    ];

    // Add billing for non-associates only
    if (user?.account_type !== 'associate') {
      mainNavigation.push({
        title: "Billing",
        url: createPageUrl("Billing"),
        icon: Receipt,
        description: "Invoices & Payments"
      });
    }

    // Add team management and assignments for firm admins only
    if (user?.account_type === 'law_firm_admin') {
      mainNavigation.push({
        title: "Team",
        url: createPageUrl("TeamManagement"),
        icon: UserCheck,
        description: "Manage Associates"
      });
      mainNavigation.push({
        title: "Assignments",
        url: createPageUrl("Assignments"),
        icon: Users,
        description: "Case & Task Allocation"
      });
    }

    const resourceNavigation = [];
    // Library is visible to all users except clients
    if (user?.account_type !== 'client') {
      resourceNavigation.push({
        title: "Library",
        url: createPageUrl("Library"),
        icon: BookOpen,
        description: "Legal Resources"
      });
    }

    return { mainNavigation, resourceNavigation };
  };

  const { mainNavigation, resourceNavigation } = getNavigationItems();

  const getAccountTypeBadge = (accountType) => {
    switch (accountType) {
      case 'independent_advocate':
        return { label: 'Independent', className: 'bg-blue-100 text-blue-800' };
      case 'law_firm_admin':
        return { label: 'Firm Admin', className: 'bg-purple-100 text-purple-800' };
      case 'associate':
        return { label: 'Associate', className: 'bg-green-100 text-green-800' };
      case 'client':
        return { label: 'Client', className: 'bg-teal-100 text-teal-800' };
      default:
        return { label: 'User', className: 'bg-gray-100 text-gray-800' };
    }
  };

  // Loading state for entire layout while user data is being fetched
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">Loading Inkit...</p>
        </div>
      </div>
    );
  }

  // User error state or no user
  if (authError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-slate-800">Access Denied</h3>
          <p className="text-slate-600 mb-6">
            There was an issue loading your profile. Please check your App ID in the .env file and try logging in again.
          </p>
          <Button onClick={handleLoginAgain} className="bg-slate-800 hover:bg-slate-700">
            <LogOut className="w-4 h-4 mr-2" />
            Login Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <style>
        {`
          :root {
            --primary-navy: #1e293b;
            --primary-gold: #f59e0b;
            --light-gold: #fbbf24;
            --accent-blue: #3b82f6;
            --soft-gray: #f8fafc;
            --border-light: #e2e8f0;
          }
          
          .legal-gradient {
            background: linear-gradient(135deg, var(--primary-navy) 0%, #334155 100%);
          }
          
          .gold-accent {
            background: linear-gradient(135deg, var(--primary-gold) 0%, var(--light-gold) 100%);
          }
          
          .legal-shadow {
            box-shadow: 0 4px 20px rgba(30, 41, 59, 0.1);
          }
          
          .sidebar-item:hover {
            background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
          }
        `}
      </style>
      <div className="min-h-screen flex w-full bg-slate-50">
        <Sidebar className="border-r border-slate-200 bg-white legal-shadow">
          <SidebarHeader className="legal-gradient p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gold-accent rounded-xl flex items-center justify-center">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl tracking-tight">Inkit</h2>
                <p className="text-slate-300 text-sm">Legal Management Suite</p>
              </div>
            </div>
            {user && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">{user.firm_name || 'Law Practice'}</p>
                  <Badge className={getAccountTypeBadge(user.account_type).className + ' text-xs'}>
                    {getAccountTypeBadge(user.account_type).label}
                  </Badge>
                </div>
                {(user.account_type === 'associate' || user.account_type === 'client') && user.firm_name && (
                  <p className="text-xs text-slate-300">
                    Managed by: {user.firm_name}
                  </p>
                )}
                {user.specialization && user.specialization.length > 0 && (
                  <p className="text-xs text-slate-300">
                    {user.specialization[0]}
                  </p>
                )}
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                Main Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainNavigation.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`sidebar-item hover:text-amber-600 transition-all duration-300 rounded-xl mb-1 ${location.pathname === item.url
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-l-4 border-amber-500'
                          : 'hover:bg-slate-50'
                          }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <div className="flex-1">
                            <span className="font-semibold text-sm">{item.title}</span>
                            <p className="text-xs text-slate-500 mt-0.5 hidden md:block">{item.description}</p>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {resourceNavigation.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Resources
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {resourceNavigation.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`sidebar-item hover:text-amber-600 transition-all duration-300 rounded-xl mb-1 ${location.pathname === item.url
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-l-4 border-amber-500'
                            : 'hover:bg-slate-50'
                            }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <div className="flex-1">
                              <span className="font-semibold text-sm">{item.title}</span>
                              <p className="text-xs text-slate-500 mt-0.5 hidden md:block">{item.description}</p>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4 bg-slate-50">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg legal-shadow">
                  <Avatar className="w-10 h-10 legal-gradient">
                    <AvatarFallback className="text-white font-semibold">
                      {user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{user.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Link to={createPageUrl("Notifications")} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      <Bell className="w-3 h-3 mr-1" />
                      Notifications
                      {invitationCount > 0 && (
                        <Badge className="ml-2 h-4 w-4 p-0 text-xs bg-red-500">{invitationCount}</Badge>
                      )}
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Settings")}>
                    <Button variant="outline" size="sm" className="px-3">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <Button onClick={() => navigateToLogin()} className="w-full legal-gradient text-white">
                Login to Continue
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 md:hidden legal-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
                <div className="flex items-center gap-2">
                  <Scale className="w-6 h-6 text-amber-600" />
                  <h1 className="text-lg font-bold text-slate-900">Inkit</h1>
                </div>
              </div>
              <Link to={createPageUrl("Notifications")}>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {invitationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                      {invitationCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto bg-slate-50">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

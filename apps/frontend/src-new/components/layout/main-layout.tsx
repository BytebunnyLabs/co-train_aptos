'use client';

import React from 'react';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from '@heroui/react';
import { Button } from '@heroui/react';
import { Avatar } from '@heroui/react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import { Badge } from '@heroui/react';
import { Link } from '@heroui/react';
import { useTheme } from 'next-themes';
import { 
  Brain, 
  Home, 
  Network, 
  Coins, 
  Settings, 
  User, 
  LogOut,
  Sun,
  Moon,
  Palette,
  Bell,
  Wallet,
  Menu,
  X
} from 'lucide-react';
import { useUIStore, useAuthStore, useNotifications } from '@/lib/stores';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { NotificationCenter } from '@/components/ui/notification-center';
import { WalletConnection } from '@/components/wallet/wallet-connection';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    sidebarCollapsed, 
    toggleSidebar,
    currentPage,
    setCurrentPage 
  } = useUIStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { connected: walletConnected, account, disconnect: disconnectWallet } = useWallet();
  const notifications = useNotifications();
  const unreadCount = useUIStore(state => state.unreadCount);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showWalletModal, setShowWalletModal] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: currentPage === 'dashboard' },
    { name: 'Training', href: '/training', icon: Brain, current: currentPage === 'training' },
    { name: 'Hivemind', href: '/hivemind', icon: Network, current: currentPage === 'hivemind' },
    { name: 'Rewards', href: '/rewards', icon: Coins, current: currentPage === 'rewards' },
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleLogout = async () => {
    await logout();
    await disconnectWallet();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <Navbar 
        isBordered 
        isMenuOpen={isMenuOpen} 
        onMenuOpenChange={setIsMenuOpen}
        className="border-divider backdrop-blur-lg bg-background/80"
        maxWidth="full"
      >
        {/* Brand */}
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
        </NavbarContent>

        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold cotrain-gradient-text">CoTrain</span>
            </div>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Brand */}
        <NavbarContent className="hidden sm:flex gap-4" justify="start">
          <NavbarBrand>
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold cotrain-gradient-text">CoTrain</span>
            </div>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden sm:flex gap-6" justify="center">
          {navigation.map((item) => (
            <NavbarItem key={item.name} isActive={item.current}>
              <Link
                color={item.current ? "primary" : "foreground"}
                href={item.href}
                className="flex items-center space-x-2 font-medium"
                onClick={() => setCurrentPage(item.name.toLowerCase())}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>

        {/* Right Side Actions */}
        <NavbarContent as="div" className="items-center" justify="end">
          {/* Theme Switcher */}
          <Dropdown>
            <DropdownTrigger>
              <Button variant="light" isIconOnly size="sm">
                {theme === 'light' ? <Sun className="h-4 w-4" /> : 
                 theme === 'dark' ? <Moon className="h-4 w-4" /> : 
                 <Palette className="h-4 w-4" />}
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Theme selection"
              onAction={(key) => handleThemeChange(key as string)}
            >
              <DropdownItem key="light" startContent={<Sun className="h-4 w-4" />}>
                Light
              </DropdownItem>
              <DropdownItem key="dark" startContent={<Moon className="h-4 w-4" />}>
                Dark
              </DropdownItem>
              <DropdownItem key="cotrain" startContent={<Palette className="h-4 w-4" />}>
                CoTrain
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Notifications */}
          <Button 
            variant="light" 
            isIconOnly 
            size="sm"
            onClick={() => setShowNotifications(true)}
          >
            <Badge content={unreadCount} color="danger" isInvisible={unreadCount === 0}>
              <Bell className="h-4 w-4" />
            </Badge>
          </Button>

          {/* Wallet Connection */}
          {walletConnected && account ? (
            <Button
              variant="flat"
              size="sm"
              startContent={<Wallet className="h-4 w-4" />}
              onClick={() => setShowWalletModal(true)}
              className="hidden sm:flex"
            >
              {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </Button>
          ) : (
            <Button
              color="primary"
              size="sm"
              startContent={<Wallet className="h-4 w-4" />}
              onClick={() => setShowWalletModal(true)}
              className="hidden sm:flex"
            >
              Connect Wallet
            </Button>
          )}

          {/* User Profile */}
          {isAuthenticated && user ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name={user.username}
                  size="sm"
                  src={user.avatar || '/default-avatar.png'}
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" startContent={<User className="h-4 w-4" />}>
                  Profile
                </DropdownItem>
                <DropdownItem key="settings" startContent={<Settings className="h-4 w-4" />}>
                  Settings
                </DropdownItem>
                <DropdownItem 
                  key="logout" 
                  color="danger" 
                  startContent={<LogOut className="h-4 w-4" />}
                  onClick={handleLogout}
                >
                  Log Out
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Button color="primary" size="sm" className="hidden sm:flex">
              Sign In
            </Button>
          )}
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu className="pt-6">
          {navigation.map((item) => (
            <NavbarMenuItem key={item.name}>
              <Link
                color={item.current ? "primary" : "foreground"}
                className="w-full flex items-center space-x-2 py-2"
                href={item.href}
                size="lg"
                onClick={() => {
                  setCurrentPage(item.name.toLowerCase());
                  setIsMenuOpen(false);
                }}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </NavbarMenuItem>
          ))}
          
          <NavbarMenuItem>
            <div className="flex flex-col space-y-2 pt-4 border-t border-divider">
              {!walletConnected ? (
                <Button
                  color="primary"
                  startContent={<Wallet className="h-4 w-4" />}
                  onClick={() => {
                    setShowWalletModal(true);
                    setIsMenuOpen(false);
                  }}
                >
                  Connect Wallet
                </Button>
              ) : (
                <Button
                  variant="flat"
                  startContent={<Wallet className="h-4 w-4" />}
                  onClick={() => {
                    setShowWalletModal(true);
                    setIsMenuOpen(false);
                  }}
                >
                  {account?.address.slice(0, 8)}...{account?.address.slice(-6)}
                </Button>
              )}
              
              {!isAuthenticated && (
                <Button color="primary" variant="flat">
                  Sign In
                </Button>
              )}
            </div>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Modals and Overlays */}
      {showNotifications && (
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showWalletModal && (
        <WalletConnection
          isOpen={showWalletModal}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </div>
  );
}
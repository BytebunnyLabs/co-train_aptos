"use client"

import { useState } from "react"
import { Button } from "@/components/cotrain/ui/button"
import { 
  Menu, 
  X, 
  Github, 
  Twitter, 
  DiscIcon as Discord, 
  TextIcon as Telegram, 
  Cpu, 
  ExternalLink, 
  Wallet, 
  User,
  Bell 
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/ThemeToggle"
import { WalletSelector } from "@/components/WalletSelector"
import { NotificationBell } from "@/components/cotrain/ui/notification-center"
// import { useAuth } from "@/contexts/AuthContext"

interface NavigationProps {
  variant?: 'default' | 'cotrain'
  className?: string
  currentPage?: string
  onPageChange?: (page: string) => void
}

export function Navigation({ 
  variant = 'default', 
  className, 
  currentPage, 
  onPageChange 
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  // 备用认证状态 - 可以根据需要替换为实际的认证逻辑
  const isAuthenticated = false
  const user = null
  // const { isAuthenticated, user } = useAuth()

  // 基础导航项目
  const baseNavItems = [
    { id: "home", label: "Home", href: "/" },
    { id: "training", label: "Training", href: "/training" },
    { id: "terminal", label: "Terminal", href: "/terminal" },
    { id: "history", label: "History", href: "/history" },
    { id: "docs", label: "Docs", href: "/docs" },
    { id: "about", label: "About", href: "/about" },
  ]

  // CoTrain 特定的导航项目
  const cotrainNavItems = [
    ...baseNavItems,
    { id: "dashboard", label: "Dashboard", href: "/dashboard" },
    { id: "rewards", label: "Rewards", href: "/rewards" },
  ]

  const navItems = variant === 'cotrain' ? cotrainNavItems : baseNavItems

  // 认证相关导航
  const authenticatedNavItems = [
    { id: "profile", label: "Profile", href: "/profile", icon: User },
  ]

  // 外部链接
  const externalLinks = variant === 'cotrain' ? [
    { id: "demo", label: "Tech Demo", href: "/demo", icon: Cpu },
    { id: "aptos-demo", label: "Aptos Demo", href: "/AptosWalletAdapterDemo", icon: Cpu },
  ] : [
    {
      icon: Github,
      href: "https://github.com/aptos-labs/aptos-wallet-adapter",
      label: "GitHub",
    },
    {
      icon: ExternalLink,
      href: "https://aptos.dev/",
      label: "Aptos Docs",
    },
  ]

  // 社交链接 (仅CoTrain模式)
  const socialLinks = variant === 'cotrain' ? [
    { icon: Github, href: "https://github.com/cotrain-ai", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com/cotrain_ai", label: "Twitter" },
    { icon: Discord, href: "https://discord.gg/cotrain", label: "Discord" },
    { icon: Telegram, href: "https://t.me/cotrain_ai", label: "Telegram" },
  ] : []

  // 样式变体
  const styles = {
    default: {
      nav: "bg-background border-b border-border sticky top-0 z-50",
      logo: "text-primary text-xl font-bold font-mono hover:text-primary/80 transition-colors flex items-center gap-2",
      navItem: (isActive: boolean) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`,
      mobile: "bg-muted/50",
    },
    cotrain: {
      nav: "bg-black border-b border-gray-800 sticky top-0 z-50",
      logo: "text-green-400 text-xl font-bold font-mono hover:text-green-300 transition-colors",
      navItem: (isActive: boolean) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-gray-900 text-green-400"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`,
      mobile: "bg-gray-900",
    }
  }

  const currentStyles = styles[variant]

  const handleNavigation = (href: string, id: string) => {
    if (onPageChange) {
      onPageChange(id)
    }
  }

  return (
    <nav className={`${currentStyles.nav} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            {onPageChange ? (
              <button
                onClick={() => handleNavigation("/", "home")}
                className={currentStyles.logo}
              >
                <Wallet className="w-6 h-6" />
                COTRAIN
              </button>
            ) : (
              <Link href="/" className={currentStyles.logo}>
                <Wallet className="w-6 h-6" />
                COTRAIN
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                const isActive = onPageChange 
                  ? currentPage === item.id 
                  : pathname === item.href
                
                return onPageChange ? (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.href, item.id)}
                    className={currentStyles.navItem(isActive)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={currentStyles.navItem(isActive)}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* External Links */}
          <div className="hidden md:flex items-center space-x-2">
            {externalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions & Controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications (CoTrain only) */}
            {variant === 'cotrain' && <NotificationBell />}
            
            {/* Authenticated Navigation */}
            {isAuthenticated && authenticatedNavItems.map((item) => {
              const isActive = onPageChange 
                ? currentPage === item.id 
                : pathname === item.href
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1 ${currentStyles.navItem(isActive)}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            
            {/* Social Links (CoTrain only) */}
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={variant === 'cotrain' 
                  ? "text-gray-400 hover:text-green-400 transition-colors"
                  : "text-muted-foreground hover:text-primary transition-colors"
                }
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
            
            <ThemeToggle />
            <WalletSelector />
            
            {/* CTA Button */}
            {variant === 'cotrain' ? (
              <Button
                onClick={() => handleNavigation("/terminal", "terminal")}
                className="bg-green-600 hover:bg-green-700 text-white font-mono text-sm"
              >
                Launch Terminal
              </Button>
            ) : (
              <Link href="/demo">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm"
                  size="sm"
                >
                  Launch Demo
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={variant === 'cotrain' 
                ? "text-gray-400 hover:text-white focus:outline-none focus:text-white"
                : "text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground"
              }
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${currentStyles.mobile}`}>
            {navItems.map((item) => {
              const isActive = onPageChange 
                ? currentPage === item.id 
                : pathname === item.href
              
              return onPageChange ? (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavigation(item.href, item.id)
                    setIsMenuOpen(false)
                  }}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${currentStyles.navItem(isActive)}`}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${currentStyles.navItem(isActive)}`}
                >
                  {item.label}
                </Link>
              )
            })}
            
            {/* External Links in Mobile */}
            <div className="border-t border-gray-700 pt-2">
              {externalLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Authenticated Navigation for Mobile */}
            {isAuthenticated && authenticatedNavItems.map((item) => {
              const isActive = onPageChange 
                ? currentPage === item.id 
                : pathname === item.href
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${currentStyles.navItem(isActive)}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
            
            <div className="px-3 py-2">
              <WalletSelector />
            </div>
            
            {/* Social Links & Actions for Mobile */}
            {socialLinks.length > 0 && (
              <div className="flex items-center space-x-4 px-3 py-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-green-400 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
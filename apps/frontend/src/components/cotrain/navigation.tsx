"use client"

import { useState } from "react"
import { Button } from "@/components/cotrain/ui/button"
import { Menu, X, Github, Twitter, DiscIcon as Discord, TextIcon as Telegram, Cpu } from "lucide-react"
import Link from "next/link"
import { NotificationBell } from "@/components/ui/notification-center"
import { HelpButton } from "@/components/ui/user-guide"
import { useAppContext } from "@/contexts/AppContext"
import { WalletSelector } from "@/components/WalletSelector"

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { startGuide, guides } = useAppContext()

  const navItems = [
    { id: "home", label: "Home", href: "/" },
    { id: "terminal", label: "Terminal", href: "/terminal" },
    { id: "training", label: "Training", href: "/training" },
    { id: "rewards", label: "Rewards", href: "/rewards" },
    { id: "history", label: "History", href: "/history" },
    { id: "docs", label: "Docs", href: "/docs" },
  ]

  const externalLinks = [
    { id: "demo", label: "Tech Demo", href: "/demo", icon: Cpu },
    { id: "aptos-demo", label: "Aptos Demo", href: "/AptosWalletAdapterDemo", icon: Cpu },
  ]

  const socialLinks = [
    { icon: Github, href: "https://github.com/cotrain-ai", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com/cotrain_ai", label: "Twitter" },
    { icon: Discord, href: "https://discord.gg/cotrain", label: "Discord" },
    { icon: Telegram, href: "https://t.me/cotrain_ai", label: "Telegram" },
  ]

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onPageChange("home")}
              className="text-green-400 text-xl font-bold font-mono hover:text-green-300 transition-colors"
            >
              COTRAIN
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? "bg-gray-900 text-green-400"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* External Links */}
          <div className="hidden md:flex items-center space-x-2">
            {externalLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Notifications & Help */}
          <div className="hidden md:flex items-center space-x-2">
            <NotificationBell />
            <HelpButton onClick={() => startGuide(guides.wallet)} />
          </div>

          {/* Wallet Selector */}
          <div className="hidden md:flex items-center space-x-2">
            <WalletSelector />
          </div>

          {/* Social Links & CTA */}
          <div className="hidden md:flex items-center space-x-4">
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
            <Button
              onClick={() => onPageChange("terminal")}
              className="bg-green-600 hover:bg-green-700 text-white font-mono text-sm"
            >
              Launch Terminal
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none focus:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onPageChange(item.id)
                  setIsMenuOpen(false)
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left transition-colors ${
                  currentPage === item.id
                    ? "bg-gray-800 text-green-400"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* External Links in Mobile */}
            <div className="border-t border-gray-700 pt-2">
              {externalLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="px-3 py-2">
              <WalletSelector />
            </div>
            
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
          </div>
        </div>
      )}
    </nav>
  )
}

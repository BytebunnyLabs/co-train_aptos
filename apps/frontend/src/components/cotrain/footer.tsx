"use client"

import { Button } from "@heroui/react"
import { Github, Twitter, DiscIcon as Discord, TextIcon as Telegram, MapPin } from "lucide-react"

export function Footer() {
  const socialLinks = [
    { icon: Github, href: "https://github.com/cotrain-ai", label: "GitHub" },
    { icon: Twitter, href: "https://twitter.com/cotrain_ai", label: "Twitter" },
    { icon: Discord, href: "https://discord.gg/cotrain", label: "Discord" },
    { icon: Telegram, href: "https://t.me/cotrain_ai", label: "Telegram" },
  ]

  const footerLinks = {
    Product: [
      { name: "Terminal", href: "#" },
      { name: "Training Hub", href: "#" },
      { name: "Analytics", href: "#" },
      { name: "API", href: "#" },
    ],
    Resources: [
      { name: "Documentation", href: "#" },
      { name: "Tutorials", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Research Papers", href: "#" },
    ],
    Community: [
      { name: "Discord Server", href: "#" },
      { name: "Forum", href: "#" },
      { name: "Contributors", href: "#" },
      { name: "Events", href: "#" },
    ],
    Company: [
      { name: "About", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press", href: "#" },
      { name: "Contact", href: "#" },
    ],
  }

  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-4">
              <span className="text-green-400 text-2xl font-bold font-mono">COTRAIN</span>
            </div>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              Democratizing AI training through decentralized compute. Join thousands of contributors building the
              future of artificial intelligence.
            </p>
            <div className="flex space-x-4">
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

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-white font-semibold mb-2">Stay updated</h3>
              <p className="text-gray-400 text-sm">
                Get the latest updates on new training opportunities and platform features.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <Button
                color="success"
                className="px-6 py-2 font-medium"
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <span>© 2024 CoTrain. All rights reserved.</span>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Network Status: Online</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span>Global</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/cotrain/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/cotrain/ui/card"
import { Badge } from "@/components/cotrain/ui/badge"
import { Input } from "@/components/cotrain/ui/input"
import { Book, Search, Code, Terminal, Cpu, Zap, ChevronRight, ExternalLink, Download, Play } from "lucide-react"
import { HARDWARE_REQUIREMENTS } from "@/config/index"

interface DocsPageProps {
  onNavigate?: (page: string) => void
}

export function DocsPage({ onNavigate = () => {} }: DocsPageProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const docSections = [
    {
      title: "Getting Started",
      icon: <Play className="w-5 h-5" />,
      articles: [
        { title: "Quick Start Guide", description: "Get up and running in 5 minutes", difficulty: "Beginner" },
        { title: "Installation", description: "Install CoTrain client on your system", difficulty: "Beginner" },
        { title: "First Training Session", description: "Join your first training project", difficulty: "Beginner" },
        { title: "Understanding Rewards", description: "How tokens and reputation work", difficulty: "Beginner" },
      ],
    },
    {
      title: "Technical Documentation",
      icon: <Code className="w-5 h-5" />,
      articles: [
        { title: "API Reference", description: "Complete API documentation", difficulty: "Advanced" },
        { title: "Client SDK", description: "Integrate CoTrain into your applications", difficulty: "Intermediate" },
        { title: "Network Protocol", description: "Understanding the CoTrain protocol", difficulty: "Advanced" },
        { title: "Security Model", description: "How we keep your data safe", difficulty: "Intermediate" },
      ],
    },
    {
      title: "Hardware & Setup",
      icon: <Cpu className="w-5 h-5" />,
      articles: [
        { title: "Hardware Requirements", description: "Minimum and recommended specs", difficulty: "Beginner" },
        { title: "GPU Configuration", description: "Optimize your GPU for training", difficulty: "Intermediate" },
        { title: "Network Setup", description: "Configure networking and firewall", difficulty: "Intermediate" },
        { title: "Troubleshooting", description: "Common issues and solutions", difficulty: "Beginner" },
      ],
    },
    {
      title: "Advanced Topics",
      icon: <Zap className="w-5 h-5" />,
      articles: [
        { title: "Custom Training Jobs", description: "Create your own training projects", difficulty: "Advanced" },
        { title: "Federated Learning", description: "Deep dive into our FL implementation", difficulty: "Advanced" },
        {
          title: "Performance Optimization",
          description: "Maximize your contribution efficiency",
          difficulty: "Intermediate",
        },
        {
          title: "Enterprise Integration",
          description: "Deploy CoTrain in enterprise environments",
          difficulty: "Advanced",
        },
      ],
    },
  ]

  const quickLinks = [
    { title: "Download Client", icon: <Download className="w-4 h-4" />, href: "/download" },
    { title: "API Docs", icon: <Code className="w-4 h-4" />, href: "/api" },
    { title: "GitHub", icon: <ExternalLink className="w-4 h-4" />, href: "https://github.com/cotrain-ai" },
    { title: "Discord", icon: <ExternalLink className="w-4 h-4" />, href: "https://discord.gg/cotrain" },
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-600"
      case "Intermediate":
        return "bg-yellow-600"
      case "Advanced":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Book className="w-10 h-10 text-green-400" />
            Documentation
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about CoTrain, from getting started to advanced configuration
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-green-400"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <Card
              key={index}
              className="bg-gray-800 border-gray-700 hover:border-green-400/50 transition-all cursor-pointer"
            >
              <CardContent className="p-4 text-center">
                <div className="text-green-400 mb-2 flex justify-center">{link.icon}</div>
                <h3 className="text-sm font-medium text-white">{link.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Hardware Requirements */}
        <Card className="mb-12 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Cpu className="w-5 h-5 text-green-400" />
              Hardware Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(HARDWARE_REQUIREMENTS).map(([tier, specs]) => (
                <div key={tier} className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3 capitalize">{tier}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPU:</span>
                      <span className="text-white">{specs.GPU}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Memory:</span>
                      <span className="text-white">{specs.MEMORY}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage:</span>
                      <span className="text-white">{specs.STORAGE}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bandwidth:</span>
                      <span className="text-white">{specs.BANDWIDTH}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {docSections.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="text-green-400">{section.icon}</span>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.articles.map((article, articleIndex) => (
                    <div
                      key={articleIndex}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all cursor-pointer group"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-white font-medium group-hover:text-green-400 transition-colors">
                            {article.title}
                          </h4>
                          <Badge className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                            {article.difficulty}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{article.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Getting Started CTA */}
        <Card className="mt-12 bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-400/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-gray-300 mb-6">
              Follow our quick start guide to begin contributing to the CoTrain network in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => onNavigate("terminal")} className="bg-green-600 hover:bg-green-700 text-white">
                <Terminal className="w-4 h-4 mr-2" />
                Launch Terminal
              </Button>
              <Button
                variant="outline"
                className="border-green-400 text-green-400 hover:bg-green-400 hover:text-black bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Client
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

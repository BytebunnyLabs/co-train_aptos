"use client"

import { useState, useEffect } from "react"
import { Button, Card, CardBody, CardHeader, Progress, Avatar, Chip } from "@heroui/react"
import { Brain, Zap, Globe, Users, TrendingUp, Shield, ArrowRight, Play, Star, Database, Network, Coins, ExternalLink } from "lucide-react"

interface LandingPageProps {
  onNavigate: (page: string) => void
  isConnecting?: boolean
  contributors?: any[]
  logs?: any
  currentTime?: string
}

export function LandingPage({ onNavigate, isConnecting, contributors, logs, currentTime }: LandingPageProps) {
  const [stats, setStats] = useState({
    activeNodes: 1247,
    totalCompute: 89234,
    modelsTraining: 12,
    contributors: 5678,
  })

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats((prev) => ({
        activeNodes: prev.activeNodes + Math.floor(Math.random() * 3),
        totalCompute: prev.totalCompute + Math.floor(Math.random() * 50),
        modelsTraining: prev.modelsTraining + (Math.random() > 0.8 ? 1 : 0),
        contributors: prev.contributors + Math.floor(Math.random() * 2),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const features = [
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Decentralized Network",
      description: "Contribute compute power from anywhere in the world and earn rewards for your participation.",
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI Model Training",
      description: "Train state-of-the-art AI models collaboratively with the global community.",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Transparent",
      description: "Blockchain-based verification ensures fair compensation and transparent operations.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "High Performance",
      description: "Optimized distributed training algorithms for maximum efficiency and speed.",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Driven",
      description: "Join a vibrant community of AI researchers, developers, and compute contributors.",
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Earn Rewards",
      description: "Get compensated with tokens, NFTs, and reputation for your valuable contributions.",
    },
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "AI Researcher",
      avatar: "/placeholder.svg?height=40&width=40",
      content:
        "CoTrain has revolutionized how we approach large-scale AI training. The decentralized approach is brilliant.",
    },
    {
      name: "Marcus Rodriguez",
      role: "GPU Farm Owner",
      avatar: "/placeholder.svg?height=40&width=40",
      content: "I've been contributing compute for 6 months and the rewards have been fantastic. Great platform!",
    },
    {
      name: "Alex Kim",
      role: "ML Engineer",
      avatar: "/placeholder.svg?height=40&width=40",
      content: "The transparency and ease of use make CoTrain the best platform for distributed AI training.",
    },
  ]

  const currentProjects = [
    {
      name: "LLM Foundation Model",
      progress: 67,
      participants: 156,
      type: "Language Model",
      status: "active",
    },
    {
      name: "Multimodal Vision-Language",
      progress: 34,
      participants: 89,
      type: "Vision-Language",
      status: "active",
    },
    {
      name: "Code Generation Model",
      progress: 12,
      participants: 234,
      type: "Code Generation",
      status: "starting",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-black to-blue-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="text-white">Decentralized</span>
              <br />
              <span className="text-green-400 font-mono">AI Training</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join the global network of contributors training the next generation of AI models. Contribute compute,
              earn rewards, and shape the future of artificial intelligence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => onNavigate("terminal")}
                color="success"
                size="lg"
                className="px-8 py-4 text-lg font-semibold"
                endContent={<ArrowRight className="w-5 h-5" />}
              >
                Launch Terminal
              </Button>
              <Button
                onClick={() => onNavigate("training")}
                variant="bordered"
                color="success"
                size="lg"
                className="px-8 py-4 text-lg"
                startContent={<Play className="w-5 h-5" />}
              >
                View Training
              </Button>
            </div>
          </div>

          {/* Live Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                {stats.activeNodes.toLocaleString()}
              </div>
              <div className="text-gray-400">Active Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">
                {stats.totalCompute.toLocaleString()}h
              </div>
              <div className="text-gray-400">Compute Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">{stats.modelsTraining}</div>
              <div className="text-gray-400">Models Training</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">
                {stats.contributors.toLocaleString()}
              </div>
              <div className="text-gray-400">Contributors</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose CoTrain?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of AI training with our cutting-edge decentralized platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gray-800/50 border-gray-700 hover:border-green-400/50 transition-all duration-300"
                isHoverable
              >
                <CardBody className="p-6">
                  <div className="text-green-400 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Current Projects */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Active Training Projects</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Join ongoing AI model training projects and contribute to cutting-edge research
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {currentProjects.map((project, index) => (
              <Card
                key={index}
                className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-all"
                isHoverable
              >
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">{project.type}</span>
                    <Chip
                      color={project.status === "active" ? "success" : "warning"}
                      variant="flat"
                      size="sm"
                    >
                      {project.status.toUpperCase()}
                    </Chip>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{project.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress
                        value={project.progress}
                        color="success"
                        className="max-w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Participants</span>
                      <span className="text-green-400">{project.participants}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              onPress={() => onNavigate("training")}
              color="success"
              size="lg"
              className="px-8 py-3"
              endContent={<ArrowRight className="w-4 h-4" />}
            >
              View All Projects
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">What Our Community Says</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Hear from researchers, developers, and contributors who are building the future with CoTrain
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700" isHoverable>
                <CardBody className="p-6">
                  <div className="flex items-center mb-4">
                    <Avatar
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="mr-3"
                      size="md"
                    />
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">"{testimonial.content}"</p>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shelby Integration Roadmap */}
      <section className="py-20 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              下一步集成计划：<span className="text-blue-400">Shelby</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
              Web3 首个云存储革命，重新定义数据服务。由 Aptos Labs 和 Jump Crypto 联合打造的开创性去中心化热存储协议。
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <a 
                href="https://shelby.xyz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                官方网站 <ExternalLink className="w-4 h-4 ml-1" />
              </a>
              <a 
                href="https://x.com/shelbyserves" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
              >
                Twitter <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>

          {/* Shelby Core Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="bg-gray-800/50 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300" isHoverable>
              <CardBody className="p-6">
                <div className="text-blue-400 mb-4">
                  <Network className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">专用光纤网络</h3>
                <p className="text-gray-400">提供亚秒级响应速度，媲美 CDN 性能，支持 10-100 Gbps 高带宽数据传输</p>
              </CardBody>
            </Card>
            
            <Card className="bg-gray-800/50 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300" isHoverable>
              <CardBody className="p-6">
                <div className="text-blue-400 mb-4">
                  <Coins className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">数据货币化</h3>
                <p className="text-gray-400">每次数据访问都能产生收入，打破传统静态存储逻辑，实现动态价值创造</p>
              </CardBody>
            </Card>
            
            <Card className="bg-gray-800/50 border-blue-500/30 hover:border-blue-400/50 transition-all duration-300" isHoverable>
              <CardBody className="p-6">
                <div className="text-blue-400 mb-4">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">节点激励机制</h3>
                <p className="text-gray-400">首创对提供数据服务的节点进行奖励，激励生态系统高效运行</p>
              </CardBody>
            </Card>
          </div>

          {/* Integration Benefits */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">CoTrain × Shelby 集成优势</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">为 AI 训练数据提供高性能存储和分发服务</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">通过数据访问货币化增加训练参与者收益</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">利用全球光纤网络加速模型训练数据传输</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">支持流媒体和实时 AI 推理场景</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">基于 Aptos 区块链的透明结算和激励机制</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300">为代币门控内容和 AI 游戏提供基础设施</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Start Contributing?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of contributors and start earning rewards while training the next generation of AI models.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onPress={() => onNavigate("terminal")}
              color="success"
              size="lg"
              className="px-8 py-4 text-lg"
              endContent={<ArrowRight className="w-5 h-5" />}
            >
              Get Started Now
            </Button>
            <Button
              variant="bordered"
              color="default"
              size="lg"
              className="px-8 py-4 text-lg"
              onPress={() => window.open('https://docs.cotrain.ai', '_blank')}
            >
              Read Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

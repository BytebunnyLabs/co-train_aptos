"use client"

import { useState } from "react"
import { Button } from "@heroui/react"
import { TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react"

interface ChartData {
  date: string
  computeHours: number
  tokens: number
  reputation: number
  rank: number
}

interface ContributionTrendsProps {
  data: ChartData[]
}

function ContributionTrends({ data }: ContributionTrendsProps) {
  const [activeChart, setActiveChart] = useState<"compute" | "tokens" | "reputation" | "rank">("compute")

  const maxValues = {
    compute: Math.max(...data.map((d) => d.computeHours)),
    tokens: Math.max(...data.map((d) => d.tokens)),
    reputation: Math.max(...data.map((d) => d.reputation)),
    rank: Math.max(...data.map((d) => d.rank)),
  }

  const getChartData = () => {
    switch (activeChart) {
      case "compute":
        return data.map((d) => ({ ...d, value: d.computeHours, max: maxValues.compute }))
      case "tokens":
        return data.map((d) => ({ ...d, value: d.tokens, max: maxValues.tokens }))
      case "reputation":
        return data.map((d) => ({ ...d, value: d.reputation, max: maxValues.reputation }))
      case "rank":
        return data.map((d) => ({ ...d, value: d.rank, max: maxValues.rank }))
      default:
        return data.map((d) => ({ ...d, value: d.computeHours, max: maxValues.compute }))
    }
  }

  const chartData = getChartData()
  const isRankChart = activeChart === "rank"

  const getColor = () => {
    switch (activeChart) {
      case "compute":
        return "rgb(59, 130, 246)" // blue
      case "tokens":
        return "rgb(245, 158, 11)" // yellow
      case "reputation":
        return "rgb(34, 197, 94)" // green
      case "rank":
        return "rgb(168, 85, 247)" // purple
      default:
        return "rgb(59, 130, 246)"
    }
  }

  const getGradientColor = () => {
    switch (activeChart) {
      case "compute":
        return "rgba(59, 130, 246, 0.1)"
      case "tokens":
        return "rgba(245, 158, 11, 0.1)"
      case "reputation":
        return "rgba(34, 197, 94, 0.1)"
      case "rank":
        return "rgba(168, 85, 247, 0.1)"
      default:
        return "rgba(59, 130, 246, 0.1)"
    }
  }

  const formatValue = (value: number) => {
    switch (activeChart) {
      case "compute":
        return `${value.toFixed(1)}h`
      case "tokens":
        return value.toLocaleString()
      case "reputation":
        return value.toString()
      case "rank":
        return `#${value}`
      default:
        return value.toString()
    }
  }

  const getTrend = () => {
    if (chartData.length < 2) return { direction: "neutral", percentage: 0 }

    const first = chartData[0].value
    const last = chartData[chartData.length - 1].value

    if (isRankChart) {
      // For rank, lower is better
      const change = ((first - last) / first) * 100
      return {
        direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
        percentage: Math.abs(change),
      }
    } else {
      const change = ((last - first) / first) * 100
      return {
        direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
        percentage: Math.abs(change),
      }
    }
  }

  const trend = getTrend()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Contribution Trends</h3>
          <div className="flex items-center gap-2">
            {trend.direction === "up" ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : trend.direction === "down" ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : null}
            <span
              className={`text-sm ${
                trend.direction === "up"
                  ? "text-green-400"
                  : trend.direction === "down"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {trend.percentage > 0 && (
                <>
                  {trend.percentage.toFixed(1)}%{" "}
                  {isRankChart
                    ? trend.direction === "up"
                      ? "rank improvement"
                      : "rank decline"
                    : trend.direction === "up"
                      ? "increase"
                      : "decrease"}{" "}
                  this period
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onPress={() => setActiveChart("compute")}
            size="sm"
            variant={activeChart === "compute" ? "solid" : "ghost"}
            color={activeChart === "compute" ? "primary" : "default"}
            className="px-3 py-1 text-xs"
          >
            Compute
          </Button>
          <Button
            onPress={() => setActiveChart("tokens")}
            size="sm"
            variant={activeChart === "tokens" ? "solid" : "ghost"}
            color={activeChart === "tokens" ? "warning" : "default"}
            className="px-3 py-1 text-xs"
          >
            Tokens
          </Button>
          <Button
            onPress={() => setActiveChart("reputation")}
            size="sm"
            variant={activeChart === "reputation" ? "solid" : "ghost"}
            color={activeChart === "reputation" ? "success" : "default"}
            className="px-3 py-1 text-xs"
          >
            Reputation
          </Button>
          <Button
            onPress={() => setActiveChart("rank")}
            size="sm"
            variant={activeChart === "rank" ? "solid" : "ghost"}
            color={activeChart === "rank" ? "secondary" : "default"}
            className="px-3 py-1 text-xs"
          >
            Rank
          </Button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative h-64 mb-4">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <linearGradient id={`gradient-${activeChart}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={getColor()} stopOpacity={0.3} />
              <stop offset="100%" stopColor={getColor()} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={`${ratio * 100}%`}
              x2="100%"
              y2={`${ratio * 100}%`}
              stroke="rgb(55, 65, 81)"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}

          {/* Chart Line and Area */}
          {chartData.length > 1 && (
            <>
              {/* Area */}
              <path
                d={`M 0,100% ${chartData
                  .map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 100
                    const y = isRankChart
                      ? (1 - (point.value - 1) / (point.max - 1)) * 100
                      : (1 - point.value / point.max) * 100
                    return `L ${x},${y}`
                  })
                  .join(" ")} L 100%,100% Z`}
                fill={`url(#gradient-${activeChart})`}
              />

              {/* Line */}
              <path
                d={`M ${chartData
                  .map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 100
                    const y = isRankChart
                      ? (1 - (point.value - 1) / (point.max - 1)) * 100
                      : (1 - point.value / point.max) * 100
                    return `${x},${y}`
                  })
                  .join(" L ")}`}
                fill="none"
                stroke={getColor()}
                strokeWidth="2"
              />

              {/* Data Points */}
              {chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 100
                const y = isRankChart
                  ? (1 - (point.value - 1) / (point.max - 1)) * 100
                  : (1 - point.value / point.max) * 100
                return (
                  <g key={index}>
                    <circle
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill={getColor()}
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                    <text
                      x={`${x}%`}
                      y={`${y - 8}%`}
                      textAnchor="middle"
                      className="text-xs fill-gray-400 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      {formatValue(point.value)}
                    </text>
                  </g>
                )
              })}
            </>
          )}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, index) => {
            const value = isRankChart
              ? Math.ceil(1 + ratio * (maxValues.rank - 1))
              : Math.ceil(ratio * maxValues[activeChart])
            return (
              <span key={index} className="leading-none">
                {formatValue(value)}
              </span>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        {chartData.map((point, index) => (
          <span key={index} className={index % 2 === 0 ? "" : "opacity-50"}>
            {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        ))}
      </div>
    </div>
  )
}

interface PerformanceMetricsProps {
  data: {
    projectName: string
    computeHours: number
    tokensEarned: number
    rank: number
    participants: number
    efficiency: number
  }[]
}

function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  const maxEfficiency = Math.max(...data.map((d) => d.efficiency))
  const avgRank = data.reduce((sum, d) => sum + d.rank, 0) / data.length

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
      </div>

      <div className="space-y-4">
        {data.map((project, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white text-sm">{project.projectName}</h4>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>
                  Rank #{project.rank}/{project.participants}
                </span>
                <span>{project.computeHours.toFixed(1)}h</span>
              </div>
            </div>

            {/* Efficiency Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Efficiency Score</span>
                <span>{project.efficiency.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    project.efficiency >= 80
                      ? "bg-green-400"
                      : project.efficiency >= 60
                        ? "bg-yellow-400"
                        : "bg-red-400"
                  }`}
                  style={{ width: `${(project.efficiency / maxEfficiency) * 100}%` }}
                />
              </div>
            </div>

            {/* Rank Visualization */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 h-1 rounded-full">
                <div
                  className="h-1 bg-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${((project.participants - project.rank) / project.participants) * 100}%` }}
                />
              </div>
              <span className="text-xs text-purple-400">
                Top {Math.round((project.rank / project.participants) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-800">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {data.reduce((sum, d) => sum + d.efficiency, 0) / data.length}%
          </div>
          <div className="text-xs text-gray-400">Avg Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400">#{Math.round(avgRank)}</div>
          <div className="text-xs text-gray-400">Avg Rank</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">
            {data.reduce((sum, d) => sum + d.computeHours, 0).toFixed(1)}h
          </div>
          <div className="text-xs text-gray-400">Total Hours</div>
        </div>
      </div>
    </div>
  )
}

interface MonthlyStatsProps {
  data: {
    month: string
    projects: number
    computeHours: number
    tokensEarned: number
    avgRank: number
  }[]
}

function MonthlyStats({ data }: MonthlyStatsProps) {
  const maxHours = Math.max(...data.map((d) => d.computeHours))
  const maxTokens = Math.max(...data.map((d) => d.tokensEarned))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">Monthly Overview</h3>
      </div>

      <div className="space-y-4">
        {data.map((month, index) => (
          <div key={index} className="border-b border-gray-800 pb-4 last:border-b-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white">{month.month}</h4>
              <div className="text-xs text-gray-400">
                {month.projects} project{month.projects !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Compute Hours */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Compute Hours</span>
                  <span>{month.computeHours.toFixed(1)}h</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full">
                  <div
                    className="h-1.5 bg-blue-400 rounded-full transition-all duration-500"
                    style={{ width: `${(month.computeHours / maxHours) * 100}%` }}
                  />
                </div>
              </div>

              {/* Tokens Earned */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Tokens Earned</span>
                  <span>{month.tokensEarned.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full">
                  <div
                    className="h-1.5 bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${(month.tokensEarned / maxTokens) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">Average Rank: #{month.avgRank.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Export all components
export { ContributionTrends, PerformanceMetrics, MonthlyStats }

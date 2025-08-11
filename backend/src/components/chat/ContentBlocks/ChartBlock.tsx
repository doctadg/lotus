'use client'

import React, { useState, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js'
import {
  Line,
  Bar,
  Pie,
  Doughnut,
  Radar,
  PolarArea,
  Scatter
} from 'react-chartjs-2'
import { Download, Maximize2, Settings } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
)

interface ChartBlockProps {
  data: string
  title?: string
}

export const ChartBlock: React.FC<ChartBlockProps> = ({ data, title }) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const chartRef = useRef<any>(null)

  const parseChartData = (dataStr: string) => {
    try {
      const parsed = JSON.parse(dataStr)
      
      // If it's already in Chart.js format, return it
      if (parsed.type && (parsed.data || parsed.datasets)) {
        return parsed
      }

      // Try to auto-detect and convert data formats
      if (Array.isArray(parsed)) {
        // Simple array data - convert to line chart
        return {
          type: 'line',
          data: {
            labels: parsed.map((_, i) => `Point ${i + 1}`),
            datasets: [{
              label: 'Data',
              data: parsed,
              borderColor: 'rgb(124, 58, 237)',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              tension: 0.3
            }]
          }
        }
      }

      // Object with key-value pairs - convert to bar chart
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        const labels = Object.keys(parsed)
        const values = Object.values(parsed)
        
        return {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Values',
              data: values,
              backgroundColor: 'rgba(124, 58, 237, 0.8)',
              borderColor: 'rgb(124, 58, 237)',
              borderWidth: 1
            }]
          }
        }
      }

      return null
    } catch (error) {
      console.error('Failed to parse chart data:', error)
      return null
    }
  }

  const chartConfig = parseChartData(data)
  
  if (!chartConfig) {
    return (
      <div className="chart-error p-4 bg-red-50 border border-red-200 rounded-lg my-4">
        <p className="text-red-700">Failed to parse chart data. Please check the format.</p>
      </div>
    )
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'var(--text-primary)',
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: !!title,
        text: title,
        color: 'var(--text-primary)',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        backgroundColor: 'var(--surface-elevated)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-primary)',
        borderColor: 'var(--border)',
        borderWidth: 1
      }
    },
    scales: chartConfig.type !== 'pie' && chartConfig.type !== 'doughnut' ? {
      x: {
        ticks: {
          color: 'var(--text-secondary)'
        },
        grid: {
          color: 'var(--border)'
        }
      },
      y: {
        ticks: {
          color: 'var(--text-secondary)'
        },
        grid: {
          color: 'var(--border)'
        }
      }
    } : {}
  }

  const downloadChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `chart-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: chartConfig.data,
      options: chartOptions
    }

    switch (chartConfig.type) {
      case 'line':
        return <Line {...commonProps} />
      case 'bar':
        return <Bar {...commonProps} />
      case 'pie':
        return <Pie {...commonProps} />
      case 'doughnut':
        return <Doughnut {...commonProps} />
      case 'radar':
        return <Radar {...commonProps} />
      case 'polarArea':
        return <PolarArea {...commonProps} />
      case 'scatter':
        return <Scatter {...commonProps} />
      default:
        return <Line {...commonProps} />
    }
  }

  return (
    <div className={`chart-block my-6 bg-surface border border-border rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50 m-0 rounded-none' : ''
    }`}>
      {/* Chart Controls */}
      <div className="chart-controls px-4 py-3 bg-surface-elevated border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-primary">
          {title || 'Chart Visualization'}
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title="Chart settings"
          >
            <Settings size={14} className="text-text-tertiary hover:text-accent-primary" />
          </button>
          
          <button
            onClick={downloadChart}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title="Download chart"
          >
            <Download size={14} className="text-text-tertiary hover:text-accent-primary" />
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded hover:bg-surface-hover transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          >
            <Maximize2 size={14} className="text-text-tertiary hover:text-accent-primary" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={`chart-canvas p-6 ${isFullscreen ? 'h-full' : 'h-80'}`}>
        {renderChart()}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel p-4 bg-surface-elevated border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Chart Type
              </label>
              <select className="w-full p-2 bg-surface border border-border rounded text-text-primary">
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
                <option value="doughnut">Doughnut</option>
                <option value="radar">Radar</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Color Scheme
              </label>
              <select className="w-full p-2 bg-surface border border-border rounded text-text-primary">
                <option value="default">Default</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
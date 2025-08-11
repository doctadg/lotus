'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth, ProtectedRoute } from '../../lib/auth-context'

const MemoryMindmap3D = dynamic(
  () => import('@/components/MemoryMindmap3D'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }
)

interface Memory {
  id: string
  type: 'preference' | 'fact' | 'context' | 'skill'
  category?: string
  key: string
  value: string
  confidence: number
  source: string
  createdAt: string
  updatedAt: string
}

function MemoriesPageContent() {
  const { token } = useAuth()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchMemories()
  }, [filter, searchQuery])

  const fetchMemories = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append('query', searchQuery)
      if (filter !== 'all') params.append('type', filter)
      params.append('limit', '100')
      
      const response = await fetch(`/api/user/memories?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch memories')
      }

      setMemories(data.data.memories || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return

    try {
      const response = await fetch(`/api/user/memories?id=${memoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      })

      if (response.ok) {
        await fetchMemories()
      }
    } catch (err) {
      console.error('Error deleting memory:', err)
    }
  }

  const handleAddMemory = async () => {
    const type = prompt('Enter memory type (preference/fact/context/skill):')
    if (!type || !['preference', 'fact', 'context', 'skill'].includes(type)) {
      alert('Invalid type')
      return
    }

    const key = prompt('Enter memory key:')
    if (!key) return

    const value = prompt('Enter memory value:')
    if (!value) return

    const category = prompt('Enter category (optional):') || undefined

    try {
      const response = await fetch('/api/user/memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          key,
          value,
          category,
          confidence: 1.0
        }),
        credentials: 'include'
      })

      if (response.ok) {
        await fetchMemories()
      }
    } catch (err) {
      console.error('Error adding memory:', err)
    }
  }

  return (
    <div className="memories-page">
      <style jsx>{`
        .memories-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, #0c1220 0%, #111827 50%, #0f172a 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header-section {
          background: rgba(15, 20, 25, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          padding: 24px;
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .page-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .brain-icon {
          width: 32px;
          height: 32px;
          color: #3b82f6;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #1f2937, #374151);
          color: #e5e7eb;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .back-button:hover {
          background: linear-gradient(135deg, #374151, #4b5563);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .controls-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 300px;
          padding: 12px 16px;
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(31, 41, 55, 1);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .filter-select {
          padding: 12px 16px;
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #ffffff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .add-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #ffffff;
        }

        .add-button:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .refresh-button {
          background: rgba(75, 85, 99, 0.8);
          color: #e5e7eb;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .refresh-button:hover {
          background: rgba(107, 114, 128, 0.8);
        }

        .loading-state, .error-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          padding: 40px;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .state-text {
          color: #9ca3af;
          font-size: 16px;
          margin-bottom: 16px;
        }

        .error-text {
          color: #ef4444;
        }

        .mindmap-section {
          flex: 1;
          padding: 24px;
          overflow: hidden;
        }

        .stats-bar {
          background: rgba(15, 20, 25, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          padding: 20px 24px;
        }

        .stats-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #9ca3af;
        }

        .stats-left {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .confidence-stat {
          color: #10b981;
          font-weight: 500;
        }
      `}</style>

      {/* Header */}
      <div className="header-section">
        <div className="header-content">
          <div className="header-top">
            <h1 className="page-title">
              <svg className="brain-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V7A3,3 0 0,1 18,10V12A3,3 0 0,1 21,15A3,3 0 0,1 18,18V16A3,3 0 0,1 15,19V17A3,3 0 0,1 12,20A3,3 0 0,1 9,17V19A3,3 0 0,1 6,16V18A3,3 0 0,1 3,15A3,3 0 0,1 6,12V10A3,3 0 0,1 9,7V5A3,3 0 0,1 12,2Z"/>
              </svg>
              Neural Memory Map
            </h1>
            <button
              onClick={() => router.push('/chat')}
              className="back-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Chat
            </button>
          </div>
          
          <div className="controls-bar">
            <input
              type="text"
              placeholder="Search your neural pathways..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Memory Types</option>
              <option value="preference">🔵 Preferences</option>
              <option value="fact">🟢 Facts</option>
              <option value="context">🟡 Context</option>
              <option value="skill">🔴 Skills</option>
            </select>
            
            <button
              onClick={handleAddMemory}
              className="action-button add-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Memory
            </button>
            
            <button
              onClick={fetchMemories}
              className="action-button refresh-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="mindmap-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div className="state-text">Initializing neural pathways...</div>
          </div>
        ) : error ? (
          <div className="error-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" style={{ marginBottom: '20px' }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="m15 9-6 6M9 9l6 6"/>
            </svg>
            <div className="state-text error-text">{error}</div>
            <button
              onClick={fetchMemories}
              className="action-button add-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
              Retry Connection
            </button>
          </div>
        ) : memories.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ marginBottom: '20px' }}>
              <path d="M12,2A3,3 0 0,1 15,5V7A3,3 0 0,1 18,10V12A3,3 0 0,1 21,15A3,3 0 0,1 18,18V16A3,3 0 0,1 15,19V17A3,3 0 0,1 12,20A3,3 0 0,1 9,17V19A3,3 0 0,1 6,16V18A3,3 0 0,1 3,15A3,3 0 0,1 6,12V10A3,3 0 0,1 9,7V5A3,3 0 0,1 12,2Z"/>
            </svg>
            <div className="state-text">No memories found in the neural network</div>
            <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Start a conversation to build your first neural pathways
            </div>
            <button
              onClick={handleAddMemory}
              className="action-button add-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Create First Memory
            </button>
          </div>
        ) : (
          <MemoryMindmap3D memories={memories} />
        )}
      </div>

      {/* Enhanced Stats Bar */}
      <div className="stats-bar">
        <div className="stats-content">
          <div className="stats-left">
            <div className="stat-item">
              <strong>{memories.length}</strong> Neural Nodes
            </div>
            <div className="stat-item">
              <div className="stat-dot" style={{ backgroundColor: '#3b82f6' }}></div>
              <span>{memories.filter(m => m.type === 'preference').length} Preferences</span>
            </div>
            <div className="stat-item">
              <div className="stat-dot" style={{ backgroundColor: '#10b981' }}></div>
              <span>{memories.filter(m => m.type === 'fact').length} Facts</span>
            </div>
            <div className="stat-item">
              <div className="stat-dot" style={{ backgroundColor: '#f59e0b' }}></div>
              <span>{memories.filter(m => m.type === 'context').length} Context</span>
            </div>
            <div className="stat-item">
              <div className="stat-dot" style={{ backgroundColor: '#ef4444' }}></div>
              <span>{memories.filter(m => m.type === 'skill').length} Skills</span>
            </div>
          </div>
          <div className="confidence-stat">
            Average Confidence: {memories.length > 0 
              ? (memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length * 100).toFixed(1) 
              : 0}%
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MemoriesPage() {
  return (
    <ProtectedRoute>
      <MemoriesPageContent />
    </ProtectedRoute>
  )
}
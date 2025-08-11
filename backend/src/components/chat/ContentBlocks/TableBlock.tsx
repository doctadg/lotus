'use client'

import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react'

interface TableBlockProps {
  children: React.ReactNode
}

export const TableBlock: React.FC<TableBlockProps> = ({ children }) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnIndex)
      setSortDirection('asc')
    }
  }

  const exportToCSV = () => {
    // This would extract table data and create CSV
    // Implementation would depend on the table structure
    console.log('Exporting table to CSV...')
  }

  return (
    <div className="table-block my-6 bg-surface border border-border rounded-lg overflow-hidden">
      {/* Table Controls */}
      <div className="table-controls px-4 py-3 bg-surface-elevated border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search size={16} className="text-text-tertiary" />
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder-text-tertiary"
          />
        </div>
        
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-accent-subtle hover:bg-accent-border rounded-md transition-colors"
          title="Export to CSV"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>

      {/* Table Wrapper */}
      <div className="table-wrapper overflow-x-auto">
        <div className="enhanced-table">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === 'table') {
              const tableChild = child as React.ReactElement<any>
              return React.cloneElement(tableChild, {
                className: `w-full ${tableChild.props.className || ''}`,
                style: {
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  ...tableChild.props.style
                }
              })
            }
            return child
          })}
        </div>
      </div>

      <style jsx>{`
        .enhanced-table table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .enhanced-table th,
        .enhanced-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border);
          position: relative;
        }
        
        .enhanced-table th {
          background: var(--surface-elevated);
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }
        
        .enhanced-table th:hover {
          background: var(--surface-hover);
        }
        
        .enhanced-table th:after {
          content: '';
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid var(--text-tertiary);
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .enhanced-table th:hover:after {
          opacity: 1;
        }
        
        .enhanced-table th.sorted-asc:after {
          opacity: 1;
          border-bottom: 4px solid var(--accent-primary);
          border-top: none;
        }
        
        .enhanced-table th.sorted-desc:after {
          opacity: 1;
          border-top: 4px solid var(--accent-primary);
          border-bottom: none;
        }
        
        .enhanced-table td {
          color: var(--text-primary);
          background: var(--surface);
        }
        
        .enhanced-table tr:hover td {
          background: var(--surface-hover);
        }
        
        .enhanced-table tr:last-child td {
          border-bottom: none;
        }
        
        .enhanced-table th:first-child,
        .enhanced-table td:first-child {
          padding-left: 24px;
        }
        
        .enhanced-table th:last-child,
        .enhanced-table td:last-child {
          padding-right: 24px;
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          .enhanced-table th,
          .enhanced-table td {
            padding: 8px 12px;
            font-size: 14px;
          }
          
          .enhanced-table th:first-child,
          .enhanced-table td:first-child {
            padding-left: 16px;
          }
          
          .enhanced-table th:last-child,
          .enhanced-table td:last-child {
            padding-right: 16px;
          }
        }
      `}</style>
    </div>
  )
}
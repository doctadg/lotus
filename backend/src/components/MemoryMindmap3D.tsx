'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Line, Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'

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

interface MemoryNode {
  id: string
  memory: Memory
  position: [number, number, number]
  connections: string[]
  color: string
  size: number
}

interface MemoryNodeMeshProps {
  node: MemoryNode
  onClick: (node: MemoryNode) => void
  isSelected: boolean
}

const MemoryNodeMesh = ({ node, onClick, isSelected }: MemoryNodeMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation for visual interest
      meshRef.current.rotation.y += 0.002
      meshRef.current.rotation.x += 0.001
      
      // Pulsing animation for hovered/selected nodes
      if (hovered || isSelected) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08
        meshRef.current.scale.setScalar(node.size * pulse)
        if (glowRef.current) {
          glowRef.current.scale.setScalar(node.size * pulse * 1.5)
        }
      } else {
        meshRef.current.scale.setScalar(node.size)
        if (glowRef.current) {
          glowRef.current.scale.setScalar(node.size * 1.3)
        }
      }
    }
  })

  const getTypeGlow = (type: string) => {
    const glows = {
      preference: '#3b82f6',
      fact: '#10b981',
      context: '#f59e0b',
      skill: '#ef4444'
    }
    return glows[type as keyof typeof glows] || '#6b7280'
  }

  return (
    <group position={node.position}>
      {/* Outer glow sphere */}
      <Sphere
        ref={glowRef}
        args={[node.size * 1.3, 16, 16]}
      >
        <meshBasicMaterial
          color={getTypeGlow(node.memory.type)}
          transparent
          opacity={hovered || isSelected ? 0.15 : 0.08}
        />
      </Sphere>
      
      {/* Main memory orb */}
      <Sphere
        ref={meshRef}
        args={[node.size, 32, 32]}
        onClick={() => onClick(node)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshPhysicalMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 0.4 : hovered ? 0.25 : 0.12}
          metalness={0.1}
          roughness={0.1}
          transmission={0.1}
          thickness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>

      {/* Floating text label */}
      <Text
        position={[0, node.size + 0.8, 0]}
        fontSize={0.25}
        color="rgba(255,255,255,0.9)"
        anchorX="center"
        anchorY="middle"
      >
        {node.memory.key.replace(/_/g, ' ')}
      </Text>

      {/* Enhanced tooltip */}
      {(hovered || isSelected) && (
        <Html position={[0, node.size + 1.5, 0]} center>
          <div className="memory-tooltip">
            <div className="tooltip-header">
              <span className={`type-badge type-${node.memory.type}`}>
                {node.memory.type}
              </span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill" 
                  style={{ width: `${node.memory.confidence * 100}%` }}
                />
              </div>
            </div>
            <h3 className="tooltip-title">{node.memory.key.replace(/_/g, ' ')}</h3>
            <p className="tooltip-content">{node.memory.value}</p>
            <div className="tooltip-footer">
              <span className="confidence-text">
                {(node.memory.confidence * 100).toFixed(0)}% confidence
              </span>
              {node.memory.category && (
                <span className="category-text">{node.memory.category}</span>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface ConnectionLineProps {
  start: [number, number, number]
  end: [number, number, number]
  strength: number
}

const ConnectionLine = ({ start, end, strength }: ConnectionLineProps) => {
  const points = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 2,
        (start[1] + end[1]) / 2 + (Math.random() - 0.5) * 3,
        (start[2] + end[2]) / 2 + (Math.random() - 0.5) * 2
      ),
      new THREE.Vector3(...end)
    ])
    return curve.getPoints(30)
  }, [start, end])

  return (
    <Line
      points={points}
      color={`hsl(${200 + strength * 60}, 70%, ${40 + strength * 30}%)`}
      lineWidth={Math.max(0.5, strength * 1.5)}
      opacity={0.4 + strength * 0.3}
      transparent
      dashed={false}
    />
  )
}

interface MemoryMindmap3DProps {
  memories: Memory[]
}

export default function MemoryMindmap3D({ memories }: MemoryMindmap3DProps) {
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null)
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [connections, setConnections] = useState<Array<{ from: string; to: string; strength: number }>>([])

  useEffect(() => {
    // Group memories by type and category
    const typeGroups: Record<string, Memory[]> = {}
    const categoryGroups: Record<string, Memory[]> = {}
    
    memories.forEach(memory => {
      if (!typeGroups[memory.type]) typeGroups[memory.type] = []
      typeGroups[memory.type].push(memory)
      
      if (memory.category) {
        if (!categoryGroups[memory.category]) categoryGroups[memory.category] = []
        categoryGroups[memory.category].push(memory)
      }
    })

    // Create nodes with 3D positions
    const newNodes: MemoryNode[] = []
    const typeColors = {
      preference: '#3b82f6', // blue
      fact: '#10b981',       // green
      context: '#f59e0b',    // yellow
      skill: '#ef4444'       // red
    }

    let nodeIndex = 0
    Object.entries(typeGroups).forEach(([type, typeMemories], typeIdx) => {
      const angleStep = (2 * Math.PI) / Object.keys(typeGroups).length
      const baseAngle = angleStep * typeIdx
      
      typeMemories.forEach((memory, idx) => {
        const radius = 5 + (idx % 3) * 2
        const verticalOffset = Math.floor(idx / 3) * 2 - 2
        const angle = baseAngle + (idx * 0.3)
        
        newNodes.push({
          id: memory.id,
          memory,
          position: [
            Math.cos(angle) * radius,
            verticalOffset,
            Math.sin(angle) * radius
          ],
          connections: [],
          color: typeColors[type as keyof typeof typeColors] || '#6b7280',
          size: 0.3 + memory.confidence * 0.3
        })
        nodeIndex++
      })
    })

    // Create connections based on category and semantic similarity
    const newConnections: Array<{ from: string; to: string; strength: number }> = []
    
    newNodes.forEach((node, i) => {
      newNodes.forEach((otherNode, j) => {
        if (i >= j) return
        
        let strength = 0
        
        // Same category = stronger connection
        if (node.memory.category && node.memory.category === otherNode.memory.category) {
          strength += 0.5
        }
        
        // Same type = moderate connection
        if (node.memory.type === otherNode.memory.type) {
          strength += 0.3
        }
        
        // Check for keyword similarity
        const nodeKeywords = node.memory.key.toLowerCase().split(/\s+/)
        const otherKeywords = otherNode.memory.key.toLowerCase().split(/\s+/)
        const commonKeywords = nodeKeywords.filter(k => otherKeywords.includes(k))
        if (commonKeywords.length > 0) {
          strength += 0.2 * commonKeywords.length
        }
        
        if (strength > 0.3) {
          newConnections.push({
            from: node.id,
            to: otherNode.id,
            strength: Math.min(strength, 1)
          })
          node.connections.push(otherNode.id)
          otherNode.connections.push(node.id)
        }
      })
    })

    setNodes(newNodes)
    setConnections(newConnections)
  }, [memories])

  const CameraController = () => {
    const { camera } = useThree()
    
    useEffect(() => {
      camera.position.set(10, 10, 10)
      camera.lookAt(0, 0, 0)
    }, [camera])
    
    return null
  }

  return (
    <div className="mindmap-container">
      <style jsx>{`
        .mindmap-container {
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, #0f1419 0%, #000000 100%);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }

        .memory-tooltip {
          background: rgba(15, 20, 25, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          max-width: 280px;
          backdrop-filter: blur(20px);
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.5),
            0 10px 10px -5px rgba(0, 0, 0, 0.3);
          transform: translateY(-8px);
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .type-badge {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 4px 8px;
          border-radius: 6px;
          color: white;
        }

        .type-preference { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .type-fact { background: linear-gradient(135deg, #10b981, #059669); }
        .type-context { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .type-skill { background: linear-gradient(135deg, #ef4444, #dc2626); }

        .confidence-bar {
          width: 60px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .tooltip-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 6px;
          text-transform: capitalize;
        }

        .tooltip-content {
          font-size: 12px;
          color: #a1a1aa;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .tooltip-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .confidence-text {
          color: #10b981;
          font-weight: 500;
        }

        .category-text {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .legend-panel {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(15, 20, 25, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(20px);
          min-width: 160px;
        }

        .legend-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #d4d4d8;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
        }

        .controls-panel {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(15, 20, 25, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          backdrop-filter: blur(20px);
        }

        .controls-text {
          font-size: 11px;
          color: #9ca3af;
          line-height: 1.4;
        }

        .brain-icon {
          width: 16px;
          height: 16px;
          opacity: 0.8;
        }
      `}</style>

      <Canvas camera={{ position: [12, 8, 12], fov: 50 }}>
        <CameraController />
        
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.3} color="#4f46e5" />
        <pointLight position={[15, 15, 15]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-15, -10, -15]} intensity={0.4} color="#3b82f6" />
        <pointLight position={[0, -10, 0]} intensity={0.2} color="#10b981" />
        
        {/* Add subtle fog for depth */}
        <fog attach="fog" args={['#000000', 20, 60]} />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={40}
          autoRotate={!selectedNode}
          autoRotateSpeed={0.3}
          enableDamping={true}
          dampingFactor={0.05}
        />
        
        {/* Render connections */}
        {connections.map((connection, idx) => {
          const fromNode = nodes.find(n => n.id === connection.from)
          const toNode = nodes.find(n => n.id === connection.to)
          if (!fromNode || !toNode) return null
          
          return (
            <ConnectionLine
              key={idx}
              start={fromNode.position}
              end={toNode.position}
              strength={connection.strength}
            />
          )
        })}
        
        {/* Render memory nodes */}
        {nodes.map(node => (
          <MemoryNodeMesh
            key={node.id}
            node={node}
            onClick={setSelectedNode}
            isSelected={selectedNode?.id === node.id}
          />
        ))}
      </Canvas>
      
      {/* Enhanced Legend */}
      <div className="legend-panel">
        <h3 className="legend-title">
          <svg className="brain-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A3,3 0 0,1 15,5V7A3,3 0 0,1 18,10V12A3,3 0 0,1 21,15A3,3 0 0,1 18,18V16A3,3 0 0,1 15,19V17A3,3 0 0,1 12,20A3,3 0 0,1 9,17V19A3,3 0 0,1 6,16V18A3,3 0 0,1 3,15A3,3 0 0,1 6,12V10A3,3 0 0,1 9,7V5A3,3 0 0,1 12,2Z"/>
          </svg>
          Neural Memory
        </h3>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#3b82f6', color: '#3b82f6' }}></div>
          <span>Preferences</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#10b981', color: '#10b981' }}></div>
          <span>Facts</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#f59e0b', color: '#f59e0b' }}></div>
          <span>Context</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: '#ef4444', color: '#ef4444' }}></div>
          <span>Skills</span>
        </div>
      </div>
      
      {/* Enhanced Controls */}
      <div className="controls-panel">
        <div className="controls-text">
          <strong>Navigation:</strong><br/>
          • Drag to rotate view<br/>
          • Scroll to zoom in/out<br/>
          • Click orbs for details<br/>
          • Auto-rotation when idle
        </div>
      </div>
    </div>
  )
}
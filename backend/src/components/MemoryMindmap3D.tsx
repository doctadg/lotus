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
  isHighlighted: boolean
  isSearchActive: boolean
}

const MemoryNodeMesh = ({ node, onClick, isSelected, isHighlighted, isSearchActive }: MemoryNodeMeshProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // Calculate memory age for visual effects
  const createdDate = new Date(node.memory.createdAt)
  const updatedDate = new Date(node.memory.updatedAt)
  const now = new Date()
  const daysSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  const daysSinceUpdated = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
  
  // Visual age indicators
  const memoryAge = daysSinceCreated / 365 // Age in years
  const isRecent = daysSinceUpdated < 7
  const isOld = daysSinceCreated > 90
  const ageOpacity = Math.max(0.3, 1 - memoryAge * 0.1) // Fade older memories slightly

  useFrame((state) => {
    if (meshRef.current) {
      // Age-based rotation speeds
      const rotationSpeed = isRecent ? 0.004 : isOld ? 0.001 : 0.002
      meshRef.current.rotation.y += rotationSpeed
      meshRef.current.rotation.x += rotationSpeed * 0.5
      
      // Enhanced pulsing animation with age considerations
      if (hovered || isSelected) {
        const pulseSpeed = isRecent ? 4 : 3
        const pulseIntensity = isRecent ? 0.12 : isOld ? 0.06 : 0.08
        const pulse = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * pulseIntensity
        meshRef.current.scale.setScalar(node.size * pulse)
        if (glowRef.current) {
          glowRef.current.scale.setScalar(node.size * pulse * (isRecent ? 1.8 : 1.5))
        }
      } else {
        // Subtle breathing for recent memories
        const breathe = isRecent ? 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02 : 1
        meshRef.current.scale.setScalar(node.size * breathe)
        if (glowRef.current) {
          const glowSize = isRecent ? 1.4 : isOld ? 1.2 : 1.3
          glowRef.current.scale.setScalar(node.size * glowSize * breathe)
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
      {/* Outer glow sphere with age-based opacity and search highlighting */}
      <Sphere
        ref={glowRef}
        args={[node.size * (isHighlighted ? 1.6 : 1.3), 16, 16]}
      >
        <meshBasicMaterial
          color={isHighlighted ? '#fbbf24' : getTypeGlow(node.memory.type)}
          transparent
          opacity={
            isSearchActive && !isHighlighted ? 
              0.02 * ageOpacity : 
              (hovered || isSelected || isHighlighted ? 0.25 : 0.08) * ageOpacity * (isRecent ? 1.3 : 1)
          }
        />
      </Sphere>
      
      {/* Enhanced crystal-like memory orb for preferences */}
      {node.memory.type === 'preference' && (
        <Sphere
          ref={meshRef}
          args={[node.size, 64, 64]}
          onClick={() => onClick(node)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshPhysicalMaterial
            color={new THREE.Color(node.color).multiplyScalar(0.8)}
            emissive={new THREE.Color(node.color).multiplyScalar(0.2)}
            emissiveIntensity={isSelected ? 1.2 : hovered ? 0.8 : 0.4}
            metalness={0.05}
            roughness={0.02}
            transmission={0.8}
            thickness={2.5}
            clearcoat={1}
            clearcoatRoughness={0.01}
            ior={1.5}
            dispersion={0.2}
            iridescence={0.3}
            iridescenceIOR={1.8}
            iridescenceThicknessRange={[100, 400]}
            transparent={true}
            opacity={0.9}
          />
        </Sphere>
      )}

      {/* Crystalline cube for facts */}
      {node.memory.type === 'fact' && (
        <mesh
          ref={meshRef}
          onClick={() => onClick(node)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[node.size * 1.8, node.size * 1.8, node.size * 1.8]} />
          <meshPhysicalMaterial
            color={new THREE.Color(node.color).multiplyScalar(0.7)}
            emissive={new THREE.Color(node.color).multiplyScalar(0.3)}
            emissiveIntensity={isSelected ? 1.0 : hovered ? 0.7 : 0.3}
            metalness={0.1}
            roughness={0.01}
            transmission={0.7}
            thickness={1.8}
            clearcoat={1}
            clearcoatRoughness={0.02}
            ior={2.4}
            dispersion={0.3}
            iridescence={0.6}
            iridescenceIOR={2.2}
            iridescenceThicknessRange={[300, 800]}
            transparent={true}
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Diamond-like octahedron for context */}
      {node.memory.type === 'context' && (
        <mesh
          ref={meshRef}
          onClick={() => onClick(node)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <octahedronGeometry args={[node.size * 1.6, 1]} />
          <meshPhysicalMaterial
            color={new THREE.Color(node.color).multiplyScalar(0.6)}
            emissive={new THREE.Color(node.color).multiplyScalar(0.4)}
            emissiveIntensity={isSelected ? 1.4 : hovered ? 0.9 : 0.5}
            metalness={0.02}
            roughness={0.0}
            transmission={0.95}
            thickness={1.5}
            clearcoat={1}
            clearcoatRoughness={0.0}
            ior={2.8}
            dispersion={0.4}
            iridescence={0.9}
            iridescenceIOR={2.8}
            iridescenceThicknessRange={[400, 1000]}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Sharp crystalline tetrahedron for skills */}
      {node.memory.type === 'skill' && (
        <mesh
          ref={meshRef}
          onClick={() => onClick(node)}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <tetrahedronGeometry args={[node.size * 2.0, 0]} />
          <meshPhysicalMaterial
            color={new THREE.Color(node.color).multiplyScalar(0.5)}
            emissive={new THREE.Color(node.color).multiplyScalar(0.5)}
            emissiveIntensity={isSelected ? 1.6 : hovered ? 1.0 : 0.6}
            metalness={0.05}
            roughness={0.0}
            transmission={0.6}
            thickness={1.0}
            clearcoat={1}
            clearcoatRoughness={0.0}
            ior={2.0}
            dispersion={0.5}
            iridescence={1.0}
            iridescenceIOR={3.0}
            iridescenceThicknessRange={[200, 600]}
            transparent={true}
            opacity={0.9}
          />
        </mesh>
      )}

      {/* Inner energy core for preferences */}
      {node.memory.type === 'preference' && (
        <Sphere args={[node.size * 0.4, 16, 16]}>
          <meshBasicMaterial
            color={new THREE.Color(node.color).multiplyScalar(3)}
            transparent={true}
            opacity={hovered || isSelected ? 0.6 : 0.3}
          />
        </Sphere>
      )}

      {/* Inner cubic core for facts */}
      {node.memory.type === 'fact' && (
        <mesh>
          <boxGeometry args={[node.size * 0.8, node.size * 0.8, node.size * 0.8]} />
          <meshBasicMaterial
            color={new THREE.Color(node.color).multiplyScalar(4)}
            transparent={true}
            opacity={hovered || isSelected ? 0.5 : 0.25}
          />
        </mesh>
      )}

      {/* Inner spherical core for context */}
      {node.memory.type === 'context' && (
        <Sphere args={[node.size * 0.3, 12, 12]}>
          <meshBasicMaterial
            color={new THREE.Color(node.color).multiplyScalar(5)}
            transparent={true}
            opacity={hovered || isSelected ? 0.7 : 0.4}
          />
        </Sphere>
      )}

      {/* Inner tetrahedral core for skills */}
      {node.memory.type === 'skill' && (
        <mesh>
          <tetrahedronGeometry args={[node.size * 0.6, 0]} />
          <meshBasicMaterial
            color={new THREE.Color(node.color).multiplyScalar(6)}
            transparent={true}
            opacity={hovered || isSelected ? 0.8 : 0.5}
          />
        </mesh>
      )}

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

      {/* Enhanced responsive tooltip */}
      {(hovered || isSelected) && (
        <Html 
          position={[0, node.size + 1.8, 0]} 
          center
          style={{
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            pointerEvents: 'none'
          }}
        >
          <div className="memory-tooltip" style={{
            transform: `translateX(${Math.max(-150, Math.min(150, -node.position[0] * 10))}px)`
          }}>
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
            <div className="tooltip-meta">
              <div className="age-indicator">
                <span className={`age-badge ${isRecent ? 'recent' : isOld ? 'old' : 'standard'}`}>
                  {isRecent ? '🔥 Recent' : isOld ? '📚 Archive' : '🧠 Active'}
                </span>
                <span className="age-text">
                  {daysSinceCreated < 1 ? 'Today' : 
                   daysSinceCreated < 7 ? `${Math.floor(daysSinceCreated)}d ago` :
                   daysSinceCreated < 30 ? `${Math.floor(daysSinceCreated / 7)}w ago` :
                   `${Math.floor(daysSinceCreated / 30)}mo ago`}
                </span>
              </div>
            </div>
            <div className="tooltip-arrow"></div>
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
  const tubeRef = useRef<THREE.Mesh>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const energyRef = useRef<THREE.Points>(null)
  
  const { curve, tubeGeometry, energyParticles } = useMemo(() => {
    // Create smooth curve between points
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...start),
      new THREE.Vector3(
        (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 1,
        (start[1] + end[1]) / 2 + Math.abs(start[0] - end[0]) * 0.2,
        (start[2] + end[2]) / 2 + (Math.random() - 0.5) * 1
      ),
      new THREE.Vector3(...end)
    ])
    
    // Create tube geometry for the connection (reduced thickness by 70%)
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      64, // segments
      Math.max(0.01, strength * 0.025), // radius - reduced from 0.08 to 0.025
      8, // radial segments
      false
    )
    
    // Create energy particle positions along the curve
    const particleCount = Math.floor(20 * strength + 10)
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount
      const point = curve.getPoint(t)
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      
      // Color based on strength
      const hue = 180 + strength * 100
      colors[i * 3] = Math.sin((hue * Math.PI) / 180) * 0.5 + 0.5
      colors[i * 3 + 1] = Math.cos((hue * Math.PI) / 180) * 0.5 + 0.5  
      colors[i * 3 + 2] = 1
      
      sizes[i] = Math.random() * 0.3 + 0.1
    }
    
    return {
      curve,
      tubeGeometry,
      energyParticles: { positions, colors, sizes, count: particleCount }
    }
  }, [start, end, strength])

  useFrame((state) => {
    // Animate energy pulse along the connection
    if (pulseRef.current) {
      const time = state.clock.elapsedTime * (1 + strength)
      const t = (time % 2) / 2 // 0 to 1 cycle
      const point = curve.getPoint(t)
      pulseRef.current.position.copy(point)
      pulseRef.current.scale.setScalar(0.05 + strength * 0.15 + Math.sin(time * 4) * 0.05)
    }
    
    // Animate energy particles
    if (energyRef.current) {
      const positions = energyRef.current.geometry.attributes.position.array as Float32Array
      const time = state.clock.elapsedTime * 0.5
      
      for (let i = 0; i < energyParticles.count; i++) {
        const baseT = i / energyParticles.count
        const animatedT = (baseT + time * strength) % 1
        const point = curve.getPoint(animatedT)
        
        positions[i * 3] = point.x + (Math.random() - 0.5) * 0.1
        positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.1
        positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.1
      }
      
      energyRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Main tube connection */}
      <mesh ref={tubeRef} geometry={tubeGeometry}>
        <meshPhysicalMaterial
          color={`hsl(${180 + strength * 100}, 70%, 50%)`}
          emissive={`hsl(${180 + strength * 100}, 80%, 30%)`}
          emissiveIntensity={0.3 + strength * 0.4}
          metalness={0.1}
          roughness={0.2}
          transmission={0.6}
          thickness={0.5}
          transparent={true}
          opacity={0.7 + strength * 0.3}
        />
      </mesh>
      
      {/* Energy pulse */}
      <Sphere ref={pulseRef} args={[0.05, 8, 8]}>
        <meshBasicMaterial
          color={`hsl(${180 + strength * 100}, 100%, 80%)`}
          transparent={true}
          opacity={0.9}
        />
      </Sphere>
      
      {/* Energy particle stream */}
      <points ref={energyRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={energyParticles.count}
            array={energyParticles.positions}
            itemSize={3}
            args={[energyParticles.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            count={energyParticles.count}
            array={energyParticles.colors}
            itemSize={3}
            args={[energyParticles.colors, 3]}
          />
          <bufferAttribute
            attach="attributes-size"
            count={energyParticles.count}
            array={energyParticles.sizes}
            itemSize={1}
            args={[energyParticles.sizes, 1]}
          />
        </bufferGeometry>
        <pointsMaterial
          vertexColors={true}
          size={0.05}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

// Particle system component for background effects
const ParticleField = () => {
  const particlesRef = useRef<THREE.Points>(null)
  const particleCount = 200
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    
    for (let i = 0; i < particleCount; i++) {
      // Random positions in a larger space
      positions[i * 3] = (Math.random() - 0.5) * 50
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50
      
      // Varied colors with neural theme
      const colorChoice = Math.random()
      if (colorChoice < 0.3) {
        colors[i * 3] = 0.2 + Math.random() * 0.3 // R
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.5 // G
        colors[i * 3 + 2] = 1 // B
      } else if (colorChoice < 0.6) {
        colors[i * 3] = 0.1 + Math.random() * 0.3 // R
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3 // G
        colors[i * 3 + 2] = 0.5 + Math.random() * 0.3 // B
      } else {
        colors[i * 3] = 0.6 + Math.random() * 0.4 // R
        colors[i * 3 + 1] = 0.4 + Math.random() * 0.3 // G
        colors[i * 3 + 2] = 1 // B
      }
      
      sizes[i] = Math.random() * 2 + 0.5
    }
    
    return { positions, colors, sizes }
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        // Slow floating animation
        positions[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.5 + i * 0.1) * 0.01
        
        // Subtle horizontal drift
        positions[i * 3] += Math.cos(state.clock.elapsedTime * 0.3 + i * 0.05) * 0.005
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.rotation.y += 0.0005
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
          args={[particles.colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
          args={[particles.sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors={true}
        size={0.05}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

interface MemoryMindmap3DProps {
  memories: Memory[]
}

export default function MemoryMindmap3D({ memories }: MemoryMindmap3DProps) {
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null)
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [connections, setConnections] = useState<Array<{ from: string; to: string; strength: number }>>([])
  const [connectionStrengthThreshold, setConnectionStrengthThreshold] = useState(0.4)
  const [visibleConnections, setVisibleConnections] = useState<Array<{ from: string; to: string; strength: number }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set())
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Force-directed graph simulation
  const runForceSimulation = (memories: Memory[]) => {
    const nodes: MemoryNode[] = []
    const typeColors = {
      preference: '#3b82f6',
      fact: '#10b981', 
      context: '#f59e0b',
      skill: '#ef4444'
    }

    // Initialize nodes with random positions
    memories.forEach((memory, idx) => {
      const createdDate = new Date(memory.createdAt)
      const updatedDate = new Date(memory.updatedAt)
      const now = new Date()
      const daysSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      const daysSinceUpdated = (now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      const temporalDepth = Math.max(-8, Math.min(8, (daysSinceCreated - 30) / 15))
      const recentActivity = daysSinceUpdated < 7 ? 1.3 : daysSinceUpdated < 30 ? 1.0 : 0.7
      
      nodes.push({
        id: memory.id,
        memory,
        position: [
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 10, 
          (Math.random() - 0.5) * 20 + temporalDepth
        ],
        connections: [],
        color: typeColors[memory.type as keyof typeof typeColors] || '#6b7280',
        size: Math.max(0.2, (0.25 + memory.confidence * 0.35) * recentActivity)
      })
    })

    // Calculate forces and update positions iteratively
    const iterations = 150
    const dampening = 0.85
    const repulsionStrength = 80
    const attractionStrength = 0.8
    const centeringForce = 0.02
    
    for (let iter = 0; iter < iterations; iter++) {
      const forces: [number, number, number][] = nodes.map(() => [0, 0, 0])
      
      // Repulsion forces (all nodes push each other away)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].position[0] - nodes[j].position[0]
          const dy = nodes[i].position[1] - nodes[j].position[1] 
          const dz = nodes[i].position[2] - nodes[j].position[2]
          const distance = Math.sqrt(dx*dx + dy*dy + dz*dz)
          
          if (distance > 0) {
            const force = repulsionStrength / (distance * distance)
            const fx = (dx / distance) * force
            const fy = (dy / distance) * force
            const fz = (dz / distance) * force
            
            forces[i][0] += fx
            forces[i][1] += fy
            forces[i][2] += fz
            forces[j][0] -= fx
            forces[j][1] -= fy
            forces[j][2] -= fz
          }
        }
      }
      
      // Type-based clustering attraction
      const typeCenters: Record<string, [number, number, number]> = {
        preference: [8, 2, 0],
        fact: [-8, 2, 0], 
        context: [0, 2, 8],
        skill: [0, 2, -8]
      }
      
      for (let i = 0; i < nodes.length; i++) {
        const center = typeCenters[nodes[i].memory.type]
        if (center) {
          const dx = center[0] - nodes[i].position[0]
          const dy = center[1] - nodes[i].position[1]
          const dz = center[2] - nodes[i].position[2]
          
          forces[i][0] += dx * 0.05
          forces[i][1] += dy * 0.03
          forces[i][2] += dz * 0.05
        }
      }
      
      // Centering force to prevent drift
      for (let i = 0; i < nodes.length; i++) {
        forces[i][0] -= nodes[i].position[0] * centeringForce
        forces[i][1] -= nodes[i].position[1] * centeringForce * 0.5
        forces[i][2] -= nodes[i].position[2] * centeringForce
      }
      
      // Apply forces with dampening
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].position[0] += forces[i][0] * dampening * (1 - iter / iterations)
        nodes[i].position[1] += forces[i][1] * dampening * (1 - iter / iterations)
        nodes[i].position[2] += forces[i][2] * dampening * (1 - iter / iterations)
      }
    }
    
    return nodes
  }

  useEffect(() => {
    if (memories.length === 0) return
    
    // Run force-directed layout
    const newNodes = runForceSimulation(memories)

    // Enhanced multi-level clustering and semantic connections
    const newConnections: Array<{ from: string; to: string; strength: number }> = []
    
    // Organize memories by type and category for better clustering
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
    
    // Apply additional clustering forces to the positioned nodes
    const applyClusteringForces = () => {
      const clusterForce = 0.3
      const iterations = 50
      
      for (let iter = 0; iter < iterations; iter++) {
        const forces: [number, number, number][] = newNodes.map(() => [0, 0, 0])
        
        // Category-based clustering
        Object.entries(categoryGroups).forEach(([category, categoryMemories]) => {
          if (categoryMemories.length < 2) return
          
          // Calculate center of mass for this category
          const categoryNodes = newNodes.filter(n => n.memory.category === category)
          const centerX = categoryNodes.reduce((sum, n) => sum + n.position[0], 0) / categoryNodes.length
          const centerY = categoryNodes.reduce((sum, n) => sum + n.position[1], 0) / categoryNodes.length
          const centerZ = categoryNodes.reduce((sum, n) => sum + n.position[2], 0) / categoryNodes.length
          
          // Apply attraction to category center
          categoryNodes.forEach(node => {
            const nodeIndex = newNodes.findIndex(n => n.id === node.id)
            if (nodeIndex !== -1) {
              forces[nodeIndex][0] += (centerX - node.position[0]) * clusterForce * 0.1
              forces[nodeIndex][1] += (centerY - node.position[1]) * clusterForce * 0.05
              forces[nodeIndex][2] += (centerZ - node.position[2]) * clusterForce * 0.1
            }
          })
        })
        
        // Semantic similarity clustering (keyword-based)
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const nodeKeywords = newNodes[i].memory.key.toLowerCase().split(/[\\s_-]+/)
            const otherKeywords = newNodes[j].memory.key.toLowerCase().split(/[\\s_-]+/)
            const valueKeywords = newNodes[i].memory.value.toLowerCase().split(/[\\s_-]+/)
            const otherValueKeywords = newNodes[j].memory.value.toLowerCase().split(/[\\s_-]+/)
            
            // Check keyword overlap in keys and values
            const keyOverlap = nodeKeywords.filter(k => k.length > 2 && otherKeywords.includes(k)).length
            const valueOverlap = valueKeywords.filter(v => v.length > 3 && otherValueKeywords.includes(v)).length
            
            const semanticSimilarity = (keyOverlap * 0.3 + valueOverlap * 0.2) / Math.max(nodeKeywords.length, otherKeywords.length)
            
            if (semanticSimilarity > 0.1) {
              const dx = newNodes[j].position[0] - newNodes[i].position[0]
              const dy = newNodes[j].position[1] - newNodes[i].position[1]
              const dz = newNodes[j].position[2] - newNodes[i].position[2]
              const distance = Math.sqrt(dx*dx + dy*dy + dz*dz)
              
              if (distance > 0) {
                const attractionForce = semanticSimilarity * clusterForce * 0.05
                const fx = (dx / distance) * attractionForce
                const fy = (dy / distance) * attractionForce
                const fz = (dz / distance) * attractionForce
                
                forces[i][0] += fx
                forces[i][1] += fy
                forces[i][2] += fz
                forces[j][0] -= fx
                forces[j][1] -= fy
                forces[j][2] -= fz
              }
            }
          }
        }
        
        // Apply clustering forces
        for (let i = 0; i < newNodes.length; i++) {
          newNodes[i].position[0] += forces[i][0] * (1 - iter / iterations)
          newNodes[i].position[1] += forces[i][1] * (1 - iter / iterations)
          newNodes[i].position[2] += forces[i][2] * (1 - iter / iterations)
        }
      }
    }
    
    applyClusteringForces()
    
    // Create connections with improved strength calculation
    newNodes.forEach((node, i) => {
      newNodes.forEach((otherNode, j) => {
        if (i >= j) return
        
        let strength = 0
        
        // Same category = very strong connection
        if (node.memory.category && node.memory.category === otherNode.memory.category) {
          strength += 0.7
        }
        
        // Same type = moderate connection
        if (node.memory.type === otherNode.memory.type) {
          strength += 0.4
        }
        
        // Enhanced semantic similarity
        const nodeKeywords = node.memory.key.toLowerCase().split(/[\\s_-]+/).filter(k => k.length > 2)
        const otherKeywords = otherNode.memory.key.toLowerCase().split(/[\\s_-]+/).filter(k => k.length > 2)
        const nodeValueWords = node.memory.value.toLowerCase().split(/[\\s_-]+/).filter(v => v.length > 3)
        const otherValueWords = otherNode.memory.value.toLowerCase().split(/[\\s_-]+/).filter(v => v.length > 3)
        
        const keyMatches = nodeKeywords.filter(k => otherKeywords.includes(k)).length
        const valueMatches = nodeValueWords.filter(v => otherValueWords.includes(v)).length
        
        if (keyMatches > 0) {
          strength += 0.3 * Math.min(keyMatches, 3) / 3
        }
        if (valueMatches > 0) {
          strength += 0.2 * Math.min(valueMatches, 2) / 2
        }
        
        // Confidence-based weighting
        const avgConfidence = (node.memory.confidence + otherNode.memory.confidence) / 2
        strength *= (0.7 + avgConfidence * 0.3)
        
        // Only create connections above a higher threshold for cleaner visualization
        if (strength > 0.4) {
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

  // Filter visible connections based on threshold and camera distance
  useEffect(() => {
    const filtered = connections.filter(conn => {
      // Always show connections for selected node
      if (selectedNode && (conn.from === selectedNode.id || conn.to === selectedNode.id)) {
        return conn.strength > 0.3
      }
      // Filter by strength threshold
      return conn.strength >= connectionStrengthThreshold
    })
    
    // Limit number of visible connections to improve performance
    const maxConnections = Math.min(filtered.length, 150)
    const sortedFiltered = filtered
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxConnections)
    
    setVisibleConnections(sortedFiltered)
  }, [connections, connectionStrengthThreshold, selectedNode])

  // Search and highlighting functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedNodes(new Set())
      return
    }

    const query = searchQuery.toLowerCase()
    const matchingNodeIds = new Set<string>()
    
    nodes.forEach(node => {
      const keyMatch = node.memory.key.toLowerCase().includes(query)
      const valueMatch = node.memory.value.toLowerCase().includes(query)
      const categoryMatch = node.memory.category?.toLowerCase().includes(query)
      const typeMatch = node.memory.type.toLowerCase().includes(query)
      
      if (keyMatch || valueMatch || categoryMatch || typeMatch) {
        matchingNodeIds.add(node.id)
        
        // Also highlight connected nodes
        node.connections.forEach(connId => {
          matchingNodeIds.add(connId)
        })
      }
    })
    
    setHighlightedNodes(matchingNodeIds)
  }, [searchQuery, nodes])

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
          background: 
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #0a0f1c 0%, #111827 25%, #1e1b4b 50%, #111827 75%, #0f172a 100%);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }

        .memory-tooltip {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.98));
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          padding: 24px;
          max-width: 320px;
          min-width: 280px;
          backdrop-filter: blur(30px) saturate(1.8);
          box-shadow: 
            0 32px 64px -12px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
          transform: translateY(-16px) scale(1.05);
          animation: tooltipGlassAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }

        .memory-tooltip::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, 
            rgba(59, 130, 246, 0.1), 
            rgba(16, 185, 129, 0.1), 
            rgba(245, 158, 11, 0.1), 
            rgba(239, 68, 68, 0.1)
          );
          border-radius: 22px;
          z-index: -1;
        }

        @keyframes tooltipGlassAppear {
          0% {
            opacity: 0;
            transform: translateY(-8px) scale(0.85);
            backdrop-filter: blur(0px);
          }
          50% {
            backdrop-filter: blur(15px);
          }
          100% {
            opacity: 1;
            transform: translateY(-16px) scale(1.05);
            backdrop-filter: blur(30px) saturate(1.8);
          }
        }

        .tooltip-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .type-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 8px 16px;
          border-radius: 16px;
          color: white;
          box-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .type-badge::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: badgeShine 2s infinite;
        }

        @keyframes badgeShine {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .type-preference { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .type-fact { background: linear-gradient(135deg, #10b981, #059669); }
        .type-context { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .type-skill { background: linear-gradient(135deg, #ef4444, #dc2626); }

        .confidence-bar {
          width: 100px;
          height: 8px;
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1));
          border-radius: 6px;
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399, #6ee7b7);
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          box-shadow: 
            0 0 8px rgba(16, 185, 129, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .confidence-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 255, 255, 0.4), 
            transparent
          );
          animation: confidenceShimmer 2.5s infinite ease-in-out;
          border-radius: 4px;
        }

        @keyframes confidenceShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .tooltip-arrow {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 12px solid rgba(255, 255, 255, 0.95);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .tooltip-arrow::before {
          content: '';
          position: absolute;
          top: -14px;
          left: -14px;
          width: 0;
          height: 0;
          border-left: 14px solid transparent;
          border-right: 14px solid transparent;
          border-top: 14px solid rgba(59, 130, 246, 0.2);
        }

        .tooltip-meta {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.2);
        }

        .age-indicator {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .age-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 8px;
          border: 1px solid;
        }

        .age-badge.recent {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05));
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .age-badge.standard {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
          color: #2563eb;
          border-color: rgba(59, 130, 246, 0.3);
        }

        .age-badge.old {
          background: linear-gradient(135deg, rgba(107, 114, 128, 0.15), rgba(107, 114, 128, 0.05));
          color: #6b7280;
          border-color: rgba(107, 114, 128, 0.3);
        }

        .age-text {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
        }

        .tooltip-title {
          font-size: 18px;
          font-weight: 800;
          background: linear-gradient(135deg, #1e293b, #334155);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
          text-transform: capitalize;
          letter-spacing: 0.025em;
          line-height: 1.2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .tooltip-content {
          font-size: 14px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 16px;
          font-weight: 400;
          text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
        }

        .tooltip-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.3);
          margin-top: 8px;
        }

        .confidence-text {
          color: #047857;
          font-weight: 700;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
          padding: 6px 12px;
          border-radius: 12px;
          border: 1.5px solid rgba(16, 185, 129, 0.3);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.1);
        }

        .category-text {
          color: #4338ca;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1));
          padding: 6px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 11px;
          border: 1.5px solid rgba(99, 102, 241, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
        }

        .legend-panel {
          position: absolute;
          top: 24px;
          left: 24px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(25px) saturate(1.5);
          min-width: 180px;
          box-shadow: 
            0 16px 32px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        }

        .legend-title {
          font-size: 16px;
          font-weight: 800;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          letter-spacing: 0.5px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 13px;
          color: #e2e8f0;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .legend-item:hover {
          color: #ffffff;
          transform: translateX(4px);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 
            0 0 12px currentColor,
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            0 2px 4px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .legend-item:hover .legend-dot {
          transform: scale(1.2);
          box-shadow: 
            0 0 20px currentColor,
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .controls-panel {
          position: absolute;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 20px;
          backdrop-filter: blur(25px) saturate(1.5);
          max-width: 220px;
          box-shadow: 
            0 16px 32px -8px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        }

        .connection-controls {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .slider-label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          color: #d1d5db;
          font-weight: 500;
        }

        .slider-label span:first-child {
          color: #ffffff;
          font-weight: 600;
        }

        .strength-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3));
          outline: none;
          cursor: pointer;
        }

        .strength-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .strength-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .slider-value {
          text-align: center;
          font-weight: 600;
          color: #10b981;
          font-size: 11px;
        }

        .search-controls {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          color: #d1d5db;
          font-weight: 500;
        }

        .search-label span:first-child {
          color: #ffffff;
          font-weight: 600;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          font-size: 12px;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #fbbf24;
          box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
          background: rgba(31, 41, 55, 1);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-stats {
          font-size: 10px;
          color: #fbbf24;
          text-align: center;
          margin-top: 4px;
          font-weight: 600;
        }

        .controls-text {
          font-size: 12px;
          color: #d1d5db;
          line-height: 1.5;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .controls-text strong {
          color: #ffffff;
          font-weight: 700;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brain-icon {
          width: 20px;
          height: 20px;
          opacity: 0.9;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          animation: brainPulse 3s ease-in-out infinite;
        }

        @keyframes brainPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .minimap-section {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
        }

        .minimap-title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
          text-align: center;
        }

        .minimap {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(31, 41, 55, 0.2));
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px;
          width: 100%;
          max-width: 160px;
          height: auto;
          cursor: crosshair;
        }

        .minimap-node {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .minimap-node:hover {
          transform: scale(1.5);
          opacity: 1 !important;
        }

        .minimap-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          gap: 8px;
        }

        .stat-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          background: rgba(31, 41, 55, 0.4);
          border-radius: 8px;
          padding: 6px 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-count {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1;
        }

        .stat-label {
          font-size: 9px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
      `}</style>

      <Canvas camera={{ position: [12, 8, 12], fov: 50 }}>
        <CameraController />
        
        {/* Dynamic particle field background */}
        <ParticleField />
        
        {/* Enhanced lighting setup with multiple colored lights */}
        <ambientLight intensity={0.4} color="#2563eb" />
        <pointLight position={[15, 15, 15]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-15, -10, -15]} intensity={0.6} color="#3b82f6" />
        <pointLight position={[0, -15, 0]} intensity={0.4} color="#10b981" />
        <pointLight position={[10, 5, -10]} intensity={0.5} color="#f59e0b" />
        <pointLight position={[-5, 8, 15]} intensity={0.3} color="#ef4444" />
        
        {/* Enhanced fog with color gradient */}
        <fog attach="fog" args={['#0a0f1c', 25, 80]} />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={40}
          enableDamping={true}
          dampingFactor={0.05}
        />
        
        {/* Render filtered connections */}
        {visibleConnections.map((connection, idx) => {
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
            isHighlighted={highlightedNodes.has(node.id)}
            isSearchActive={searchQuery.trim().length > 0}
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
        
        {/* Mini Navigation Map */}
        <div className="minimap-section">
          <h4 className="minimap-title">Network Overview</h4>
          <svg className="minimap" width="160" height="120" viewBox="-20 -15 40 30">
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse">
                <path d="M 2 0 L 0 0 0 2" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect x="-20" y="-15" width="40" height="30" fill="url(#grid)" />
            
            {/* Render nodes as small dots */}
            {nodes.slice(0, 100).map((node, idx) => {
              const x = (node.position[0] / 40) * 20
              const z = (node.position[2] / 40) * 15
              const isActive = selectedNode?.id === node.id || highlightedNodes.has(node.id)
              
              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={z}
                  r={isActive ? 1.2 : 0.6}
                  fill={isActive ? '#fbbf24' : node.color}
                  opacity={isActive ? 1 : 0.6}
                  stroke={isActive ? '#ffffff' : 'none'}
                  strokeWidth={isActive ? 0.3 : 0}
                  className="minimap-node"
                  onClick={() => setSelectedNode(node)}
                />
              )
            })}
            
            {/* Render major connections */}
            {visibleConnections.slice(0, 20).map((conn, idx) => {
              const fromNode = nodes.find(n => n.id === conn.from)
              const toNode = nodes.find(n => n.id === conn.to)
              if (!fromNode || !toNode) return null
              
              const x1 = (fromNode.position[0] / 40) * 20
              const z1 = (fromNode.position[2] / 40) * 15
              const x2 = (toNode.position[0] / 40) * 20
              const z2 = (toNode.position[2] / 40) * 15
              
              return (
                <line
                  key={idx}
                  x1={x1}
                  y1={z1}
                  x2={x2}
                  y2={z2}
                  stroke="rgba(59, 130, 246, 0.3)"
                  strokeWidth={conn.strength * 0.5}
                  opacity={0.6}
                />
              )
            })}
          </svg>
          
          <div className="minimap-stats">
            <div className="stat-mini">
              <span className="stat-count">{nodes.length}</span>
              <span className="stat-label">Nodes</span>
            </div>
            <div className="stat-mini">
              <span className="stat-count">{visibleConnections.length}</span>
              <span className="stat-label">Connections</span>
            </div>
          </div>
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
        <div className="connection-controls">
          <label className="slider-label">
            <span>Connection Filter</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.1"
              value={connectionStrengthThreshold}
              onChange={(e) => setConnectionStrengthThreshold(parseFloat(e.target.value))}
              className="strength-slider"
            />
            <span className="slider-value">{Math.round(connectionStrengthThreshold * 100)}%</span>
          </label>
          
          <div className="search-controls">
            <label className="search-label">
              <span>Search Neural Network</span>
              <input
                type="text"
                placeholder="Find memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </label>
            {searchQuery && (
              <div className="search-stats">
                {highlightedNodes.size} nodes highlighted
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
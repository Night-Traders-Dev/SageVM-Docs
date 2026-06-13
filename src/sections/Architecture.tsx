import { useEffect, useRef, useState, useCallback } from 'react'

interface Node {
  id: string
  label: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  originX: number
  originY: number
  color: string
  description: string
}

interface Edge {
  from: string
  to: string
}

const nodesData: Omit<Node, 'x' | 'y' | 'vx' | 'vy'>[] = [
  { id: 'core', label: 'sgvm_core', radius: 18, originX: 0.5, originY: 0.5, color: '#0aff60', description: 'Opcode constants, utilities, IEEE 754 float packing' },
  { id: 'compiler', label: 'sgvm_compiler', radius: 14, originX: 0.25, originY: 0.3, color: '#00f0ff', description: 'Two-pass compiler: .svm -> .sgvm binary' },
  { id: 'vm', label: 'sgvm_vm', radius: 14, originX: 0.75, originY: 0.3, color: '#00f0ff', description: 'Bytecode interpreter with threaded dispatch' },
  { id: 'native', label: 'native_bridge', radius: 12, originX: 0.8, originY: 0.6, color: '#ffaa00', description: 'Guest-to-host delegation for GPU, I/O, native modules' },
  { id: 'gc', label: 'garbage_collector', radius: 11, originX: 0.6, originY: 0.75, color: '#a3a3ff', description: 'Mark-and-sweep GC with capability-tagged objects' },
  { id: 'thread', label: 'thread_manager', radius: 11, originX: 0.35, originY: 0.7, color: '#a3a3ff', description: 'Multi-threading with GIL and result capturing' },
  { id: 'loader', label: 'binary_loader', radius: 10, originX: 0.15, originY: 0.55, color: '#ffaa00', description: 'SGVM binary parsing with bounds checking' },
  { id: 'utils', label: 'SGVMUtils', radius: 10, originX: 0.5, originY: 0.2, color: '#ffffff', description: 'Hex parsing, string ops, binary I/O helpers' },
]

const edgesData: Edge[] = [
  { from: 'core', to: 'compiler' },
  { from: 'core', to: 'vm' },
  { from: 'core', to: 'utils' },
  { from: 'compiler', to: 'loader' },
  { from: 'vm', to: 'native' },
  { from: 'vm', to: 'gc' },
  { from: 'vm', to: 'thread' },
  { from: 'native', to: 'gc' },
  { from: 'thread', to: 'gc' },
  { from: 'loader', to: 'vm' },
  { from: 'utils', to: 'compiler' },
  { from: 'utils', to: 'vm' },
]

export default function Architecture() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const mousePos = useRef({ x: -1000, y: -1000 })
  const nodesRef = useRef<Node[]>([])
  const animRef = useRef<number>(0)

  const initNodes = useCallback((width: number, height: number) => {
    nodesRef.current = nodesData.map((n) => ({
      ...n,
      x: n.originX * width,
      y: n.originY * height,
      vx: 0,
      vy: 0,
    }))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = (entries: ResizeObserverEntry[]) => {
      const rect = entries[0].contentRect
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      initNodes(rect.width, rect.height)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const getNodeAt = (mx: number, my: number) => {
      for (const node of nodesRef.current) {
        const dx = mx - node.x
        const dy = my - node.y
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 5) {
          return node
        }
      }
      return null
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
      const node = getNodeAt(mousePos.current.x, mousePos.current.y)
      setHoveredNode(node ? node.id : null)
      canvas.style.cursor = node ? 'pointer' : 'crosshair'
    }

    const onMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 }
      setHoveredNode(null)
      canvas.style.cursor = 'crosshair'
    }

    const onClick = () => {
      const node = getNodeAt(mousePos.current.x, mousePos.current.y)
      if (node) {
        // Handle navigation or highlighting here. 
        // For now, let's just log to simulate the action.
        console.log('Node clicked:', node.label)
        // In a real app, you might use window.location.hash or a router:
        // window.location.hash = `#${node.label}`
      }
    }

    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)
    canvas.addEventListener('click', onClick)

    const updatePhysics = (width: number, height: number) => {
      const nodes = nodesRef.current


      // Spring toward origin
      for (const n of nodes) {
        const dx = n.originX * width - n.x
        const dy = n.originY * height - n.y
        n.vx += dx * 0.05
        n.vy += dy * 0.05
      }

      // Node-node repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy
          if (distSq > 1 && distSq < 250000) {
            const force = 5000 / distSq
            const dist = Math.sqrt(distSq)
            const fx = (force * dx) / dist
            const fy = (force * dy) / dist
            a.vx += fx
            a.vy += fy
            b.vx -= fx
            b.vy -= fy
          }
        }
      }

      // Mouse repulsion
      const mx = mousePos.current.x
      const my = mousePos.current.y
      for (const n of nodes) {
        const dx = n.x - mx
        const dy = n.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          const force = (150 - dist) / 150
          n.vx -= (dx / dist) * force * 5
          n.vy -= (dy / dist) * force * 5
        }
      }

      // Apply velocity with damping
      for (const n of nodes) {
        n.vx *= 0.9
        n.vy *= 0.9
        n.x += n.vx
        n.y += n.vy

        // Keep in bounds
        n.x = Math.max(n.radius, Math.min(width - n.radius, n.x))
        n.y = Math.max(n.radius, Math.min(height - n.radius, n.y))
      }
    }

    const draw = () => {
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      updatePhysics(width, height)

      // Draw edges
      for (const edge of edgesData) {
        const from = nodesRef.current.find((n) => n.id === edge.from)
        const to = nodesRef.current.find((n) => n.id === edge.to)
        if (!from || !to) continue

        const isHighlighted =
          hoveredNode === edge.from || hoveredNode === edge.to

        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = isHighlighted
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(163, 163, 255, 0.15)'
        ctx.lineWidth = isHighlighted ? 2 : 1
        ctx.stroke()
      }

      // Draw nodes
      for (const n of nodesRef.current) {
        const isHovered = hoveredNode === n.id
        const r = isHovered ? n.radius * 1.3 : n.radius

        // Glow
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2)
        grad.addColorStop(0, n.color + '60')
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, r * 2, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.color + (isHovered ? 'FF' : 'DD')
        ctx.fill()

        // Pulse effect for core node
        if (n.id === 'core') {
          const pulseR = r + Math.sin(Date.now() / 500) * 4
          ctx.beginPath()
          ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2)
          ctx.strokeStyle = n.color + '40'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Label
        ctx.fillStyle = '#ffffff'
        ctx.font = `500 ${isHovered ? 13 : 11}px "JetBrains Mono"`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.label, n.x, n.y + r + 18)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      resizeObserver.disconnect()
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('click', onClick)
    }
  }, [hoveredNode, initNodes])

  const hoveredNodeData = nodesData.find((n) => n.id === hoveredNode)

  return (
    <section
      id="architecture"
      ref={containerRef}
      className="relative min-h-screen bg-void py-32"
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <img
          src="/vm-architecture.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/90 to-void" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-sage-mid tracking-widest mb-4">
            SYSTEM ARCHITECTURE
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight">
            Component Graph
          </h2>
          <p className="font-body text-white/50 mt-4 max-w-2xl mx-auto">
            Interactive visualization of the SageVM module interdependencies.
            Hover over nodes to explore connections.
          </p>
        </div>

        {/* Canvas + Info panel */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Canvas */}
          <div className="flex-1 relative">
            <div className="glass-panel rounded-xl overflow-hidden" style={{ height: '500px' }}>
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair"
              />
            </div>
            <p className="font-mono text-xs text-white/30 mt-3 text-center">
              Move cursor to interact with the graph
            </p>
          </div>

          {/* Info panel */}
          <div className="lg:w-80">
            <div className="glass-panel rounded-xl p-6 h-full">
              <h3 className="font-display text-lg font-bold text-white mb-4">
                Module Info
              </h3>

              {hoveredNodeData ? (
                <div className="animate-in fade-in duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: hoveredNodeData.color }}
                    />
                    <span className="font-mono text-sage-mid text-sm">
                      {hoveredNodeData.label}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {hoveredNodeData.description}
                  </p>

                  {/* Connected modules */}
                  <div className="mt-4">
                    <p className="font-mono text-xs text-white/40 mb-2">
                      CONNECTED TO:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {edgesData
                        .filter(
                          (e) =>
                            e.from === hoveredNodeData.id ||
                            e.to === hoveredNodeData.id
                        )
                        .map((e) => {
                          const otherId =
                            e.from === hoveredNodeData.id ? e.to : e.from
                          const other = nodesData.find((n) => n.id === otherId)
                          if (!other) return null
                          return (
                            <span
                              key={otherId}
                              className="px-2 py-1 rounded text-xs font-mono"
                              style={{
                                background: `${other.color}15`,
                                color: other.color,
                                border: `1px solid ${other.color}30`,
                              }}
                            >
                              {other.label}
                            </span>
                          )
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-white/40 text-sm">
                  <p>Hover over a node in the graph to see details about that module.</p>
                  <div className="mt-6 space-y-3">
                    {nodesData.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-white/[0.03] rounded px-2 py-1 transition-colors"
                        onMouseEnter={() => setHoveredNode(n.id)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: n.color }}
                        />
                        <span className="font-mono text-xs text-white/60">
                          {n.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Search, Terminal } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

type Category = 'all' | 'stack' | 'arithmetic' | 'comparison' | 'bitwise' | 'control' | 'memory' | 'oop' | 'exception'

interface Opcode {
  name: string
  value: string
  description: string
  category: Category
  example?: string
}

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'stack', label: 'Stack' },
  { id: 'arithmetic', label: 'Arithmetic' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'bitwise', label: 'Bitwise' },
  { id: 'control', label: 'Control Flow' },
  { id: 'memory', label: 'Memory' },
  { id: 'oop', label: 'OOP' },
  { id: 'exception', label: 'Exception' },
]

const opcodes: Opcode[] = [
  { name: 'OP_CONSTANT', value: '0x00', description: 'Push a constant onto the stack', category: 'stack', example: 'OP_CONSTANT 5  ; Push const[5]' },
  { name: 'OP_NIL', value: '0x01', description: 'Push nil onto the stack', category: 'stack' },
  { name: 'OP_TRUE', value: '0x02', description: 'Push true onto the stack', category: 'stack' },
  { name: 'OP_FALSE', value: '0x03', description: 'Push false onto the stack', category: 'stack' },
  { name: 'OP_POP', value: '0x04', description: 'Pop the top value from the stack', category: 'stack' },
  { name: 'OP_DUP', value: '0x2F', description: 'Duplicate a value on the stack', category: 'stack' },
  { name: 'OP_GET_GLOBAL', value: '0x05', description: 'Get a global variable value', category: 'memory', example: 'OP_GET_GLOBAL 3  ; Push globals[3]' },
  { name: 'OP_DEFINE_GLOBAL', value: '0x06', description: 'Define a global variable', category: 'memory' },
  { name: 'OP_SET_GLOBAL', value: '0x07', description: 'Assign a value to a global variable', category: 'memory' },
  { name: 'OP_GET_PROPERTY', value: '0x09', description: 'Get an object property', category: 'oop' },
  { name: 'OP_SET_PROPERTY', value: '0x0A', description: 'Set an object property', category: 'oop' },
  { name: 'OP_GET_INDEX', value: '0x0B', description: 'Get an element at an index (array/dict)', category: 'memory' },
  { name: 'OP_SET_INDEX', value: '0x0C', description: 'Set an element at an index', category: 'memory' },
  { name: 'OP_DEFINE_FUNCTION', value: '0x08', description: 'Define a function', category: 'control' },
  { name: 'OP_LOAD_FUNCTION', value: '0x0D', description: 'Load a function onto the stack', category: 'control' },
  { name: 'OP_CALL', value: '0x25', description: 'Call a function', category: 'control', example: 'OP_CALL 2  ; Call with 2 args' },
  { name: 'OP_CALL_METHOD', value: '0x26', description: 'Call an object method', category: 'oop' },
  { name: 'OP_RETURN', value: '0x2C', description: 'Return from a function', category: 'control' },
  { name: 'OP_ADD', value: '0x0F', description: 'Addition', category: 'arithmetic' },
  { name: 'OP_SUB', value: '0x10', description: 'Subtraction', category: 'arithmetic' },
  { name: 'OP_MUL', value: '0x11', description: 'Multiplication', category: 'arithmetic' },
  { name: 'OP_DIV', value: '0x12', description: 'Division', category: 'arithmetic' },
  { name: 'OP_MOD', value: '0x13', description: 'Modulo', category: 'arithmetic' },
  { name: 'OP_NEGATE', value: '0x14', description: 'Unary negation', category: 'arithmetic' },
  { name: 'OP_EQUAL', value: '0x15', description: 'Equality check', category: 'comparison' },
  { name: 'OP_NOT_EQUAL', value: '0x16', description: 'Inequality check', category: 'comparison' },
  { name: 'OP_GREATER', value: '0x17', description: 'Greater than', category: 'comparison' },
  { name: 'OP_GREATER_EQUAL', value: '0x18', description: 'Greater than or equal', category: 'comparison' },
  { name: 'OP_LESS', value: '0x19', description: 'Less than', category: 'comparison' },
  { name: 'OP_LESS_EQUAL', value: '0x1A', description: 'Less than or equal', category: 'comparison' },
  { name: 'OP_BIT_AND', value: '0x1B', description: 'Bitwise AND', category: 'bitwise' },
  { name: 'OP_BIT_OR', value: '0x1C', description: 'Bitwise OR', category: 'bitwise' },
  { name: 'OP_BIT_XOR', value: '0x1D', description: 'Bitwise XOR', category: 'bitwise' },
  { name: 'OP_BIT_NOT', value: '0x1E', description: 'Bitwise NOT', category: 'bitwise' },
  { name: 'OP_SHIFT_LEFT', value: '0x1F', description: 'Bitwise left shift', category: 'bitwise' },
  { name: 'OP_SHIFT_RIGHT', value: '0x20', description: 'Bitwise right shift', category: 'bitwise' },
  { name: 'OP_NOT', value: '0x21', description: 'Logical NOT', category: 'bitwise' },
  { name: 'OP_JUMP', value: '0x23', description: 'Unconditional jump', category: 'control', example: 'OP_JUMP 16  ; PC += 16' },
  { name: 'OP_JUMP_IF_FALSE', value: '0x24', description: 'Jump if the top value is false', category: 'control' },
  { name: 'OP_LOOP_BACK', value: '0x33', description: 'Jump to the start of a loop', category: 'control' },
  { name: 'OP_BREAK', value: '0x31', description: 'Loop break', category: 'control' },
  { name: 'OP_CONTINUE', value: '0x32', description: 'Loop continue', category: 'control' },
  { name: 'OP_PUSH_ENV', value: '0x2D', description: 'Push a new environment scope', category: 'memory' },
  { name: 'OP_POP_ENV', value: '0x2E', description: 'Pop an environment scope', category: 'memory' },
  { name: 'OP_ARRAY', value: '0x27', description: 'Create an array', category: 'memory' },
  { name: 'OP_TUPLE', value: '0x28', description: 'Create a tuple', category: 'memory' },
  { name: 'OP_DICT', value: '0x29', description: 'Create a dictionary', category: 'memory' },
  { name: 'OP_SLICE', value: '0x0E', description: 'Perform an array or string slice', category: 'memory' },
  { name: 'OP_ARRAY_LEN', value: '0x30', description: 'Get array length', category: 'memory' },
  { name: 'OP_CLASS', value: '0x35', description: 'Define a class', category: 'oop' },
  { name: 'OP_METHOD', value: '0x36', description: 'Define a method on a class', category: 'oop' },
  { name: 'OP_INHERIT', value: '0x37', description: 'Set up class inheritance', category: 'oop' },
  { name: 'OP_SETUP_TRY', value: '0x38', description: 'Push an exception handler', category: 'exception' },
  { name: 'OP_END_TRY', value: '0x39', description: 'Pop the current exception handler', category: 'exception' },
  { name: 'OP_RAISE', value: '0x3A', description: 'Raise an exception', category: 'exception' },
  { name: 'OP_IMPORT', value: '0x34', description: 'Import and execute an external module', category: 'control' },
  { name: 'OP_PRINT', value: '0x2A', description: 'Print a value', category: 'stack' },
  { name: 'OP_EXEC_AST_STMT', value: '0x2B', description: 'Execute an AST statement (fallback)', category: 'control' },
  { name: 'OP_HALT', value: '0xFF', description: 'Halt execution', category: 'control' },
]

export default function Opcodes() {
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOpcode, setExpandedOpcode] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const filtered = opcodes.filter((op) => {
    const matchesCategory = activeCategory === 'all' || op.category === activeCategory
    const matchesSearch =
      op.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      op.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  useEffect(() => {
    if (!gridRef.current) return
    const cards = gridRef.current.querySelectorAll('.opcode-card')
    gsap.fromTo(
      cards,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.03,
        ease: 'power2.out',
      }
    )
  }, [activeCategory, searchQuery])

  const categoryColors: Record<string, string> = {
    stack: '#00f0ff',
    arithmetic: '#0aff60',
    comparison: '#a3a3ff',
    bitwise: '#ffaa00',
    control: '#ff6666',
    memory: '#66ccff',
    oop: '#cc66ff',
    exception: '#ff6699',
  }

  return (
    <section
      id="opcodes"
      ref={sectionRef}
      className="relative py-32 bg-void"
    >
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-neon-cyan tracking-widest mb-4">
            INSTRUCTION SET
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight">
            Opcode Reference
          </h2>
          <p className="font-body text-white/50 mt-4 max-w-2xl mx-auto">
            59 general-purpose opcodes plus 28 GPU opcodes. Full parity with
            SageLang v3.6.5 MetalVM.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search opcodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border border-white/[0.08] rounded-lg font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-mono text-xs transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                  : 'bg-white/[0.03] text-white/50 border border-transparent hover:border-white/[0.08] hover:text-white/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Opcode grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {filtered.map((op) => {
            const isExpanded = expandedOpcode === op.name
            const color = categoryColors[op.category] || '#00f0ff'

            return (
              <div
                key={op.name}
                className={`opcode-card glass-panel rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
                  isExpanded ? 'neon-border-cyan' : 'hover:border-white/[0.1]'
                }`}
                onClick={() =>
                  setExpandedOpcode(isExpanded ? null : op.name)
                }
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Terminal
                        className="w-4 h-4 flex-shrink-0"
                        style={{ color }}
                      />
                      <span className="font-mono text-sm font-bold text-white">
                        {op.name}
                      </span>
                    </div>
                    <span
                      className="font-mono text-xs px-2 py-0.5 rounded"
                      style={{
                        background: `${color}15`,
                        color,
                      }}
                    >
                      {op.value}
                    </span>
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    {op.description}
                  </p>

                  {/* Expanded content */}
                  {isExpanded && op.example && (
                    <div className="mt-3 pt-3 border-t border-white/[0.06]">
                      <p className="font-mono text-[10px] text-white/40 mb-1">
                        EXAMPLE:
                      </p>
                      <div className="code-block rounded p-2">
                        <code className="font-mono text-xs text-neon-green">
                          {op.example}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 font-mono text-sm">
              No opcodes match your search.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-12">
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-neon-cyan">
              59
            </p>
            <p className="font-mono text-xs text-white/40 mt-1">
              General Opcodes
            </p>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-neon-green">
              28
            </p>
            <p className="font-mono text-xs text-white/40 mt-1">GPU Opcodes</p>
          </div>
          <div className="w-px bg-white/[0.08]" />
          <div className="text-center">
            <p className="font-display text-3xl font-bold text-neon-amber">
              88
            </p>
            <p className="font-mono text-xs text-white/40 mt-1">Total</p>
          </div>
        </div>
      </div>
    </section>
  )
}

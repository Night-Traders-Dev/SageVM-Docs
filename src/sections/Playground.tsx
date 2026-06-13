import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Play, StepForward, RotateCcw, Zap, Edit3 } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const SAMPLE_PROGRAMS = [
  {
    name: 'Hello World',
    code: `proc main():
    print "Hello, SageVM!"
    return 0`,
    bytecode: [
      'OP_CONSTANT "Hello, SageVM!"',
      'OP_PRINT',
      'OP_CONSTANT 0',
      'OP_RETURN',
    ],
  },
  {
    name: 'Arithmetic',
    code: `proc main():
    var x = 10
    var y = 20
    var result = x + y * 2
    print result
    return result`,
    bytecode: [
      'OP_CONSTANT 10',
      'OP_DEFINE_GLOBAL "x"',
      'OP_CONSTANT 20',
      'OP_DEFINE_GLOBAL "y"',
      'OP_GET_GLOBAL "x"',
      'OP_GET_GLOBAL "y"',
      'OP_CONSTANT 2',
      'OP_MUL',
      'OP_ADD',
      'OP_DEFINE_GLOBAL "result"',
      'OP_GET_GLOBAL "result"',
      'OP_PRINT',
      'OP_GET_GLOBAL "result"',
      'OP_RETURN',
    ],
  },
  {
    name: 'Custom',
    code: '; Write your own bytecode here',
    bytecode: [
      'OP_CONSTANT 42',
      'OP_PRINT',
    ],
    isCustom: true,
  }
]

class SGVMInterpreter {
  stack: (string | number)[] = []
  globals: Map<string, string | number> = new Map()
  pc: number = 0
  output: string[] = []
  halted: boolean = false

  constructor() {
    this.reset()
  }

  reset() {
    this.stack = []
    this.globals = new Map()
    this.pc = 0
    this.output = []
    this.halted = false
  }

  step(bytecode: string[]) {
    if (this.pc >= bytecode.length || this.halted) {
      this.halted = true
      return
    }

    const line = bytecode[this.pc]
    const parts = line.split(/\s+/)
    const opcode = parts[0]
    const operand = parts.slice(1).join(' ').split(';')[0].trim()

    let val: string | number = operand
    if (operand.startsWith('"') && operand.endsWith('"')) {
      val = operand.slice(1, -1)
    } else if (!isNaN(Number(operand)) && operand !== '') {
      val = Number(operand)
    }

    switch (opcode) {
      case 'OP_CONSTANT':
        this.stack.push(val)
        break
      case 'OP_POP':
        this.stack.pop()
        break
      case 'OP_DUP':
        if (this.stack.length > 0) {
          this.stack.push(this.stack[this.stack.length - 1])
        }
        break
      case 'OP_ADD': {
        const b = this.stack.pop() as number
        const a = this.stack.pop() as number
        this.stack.push(a + b)
        break
      }
      case 'OP_SUB': {
        const b = this.stack.pop() as number
        const a = this.stack.pop() as number
        this.stack.push(a - b)
        break
      }
      case 'OP_MUL': {
        const b = this.stack.pop() as number
        const a = this.stack.pop() as number
        this.stack.push(a * b)
        break
      }
      case 'OP_DIV': {
        const b = this.stack.pop() as number
        const a = this.stack.pop() as number
        this.stack.push(a / b)
        break
      }
      case 'OP_DEFINE_GLOBAL':
        this.globals.set(val as string, this.stack.pop() as string | number)
        break
      case 'OP_SET_GLOBAL':
        this.globals.set(val as string, this.stack[this.stack.length - 1] as string | number)
        break
      case 'OP_GET_GLOBAL':
        this.stack.push(this.globals.get(val as string)!)
        break
      case 'OP_PRINT': {
        const v = this.stack.pop()
        this.output.push(`> ${v}`)
        break
      }
      case 'OP_RETURN':
      case 'OP_HALT':
        this.halted = true
        break
      default:
        console.warn(`Unknown opcode: ${opcode}`)
    }

    this.pc++
  }
}

export default function Playground() {
  const [selectedProgramIdx, setSelectedProgramIdx] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [stack, setStack] = useState<(string | number)[]>([])
  const [customBytecode, setCustomBytecode] = useState('')
  const [isHalted, setIsHalted] = useState(false)
  
  const sectionRef = useRef<HTMLDivElement>(null)
  const bytecodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const vmRef = useRef(new SGVMInterpreter())

  const program = SAMPLE_PROGRAMS[selectedProgramIdx]
  const bytecode = program.isCustom ? customBytecode.split('\n').filter(l => l.trim() !== '') : program.bytecode

  const reset = () => {
    setIsRunning(false)
    setCurrentStep(-1)
    setConsoleOutput([])
    setStack([])
    setIsHalted(false)
    vmRef.current.reset()
  }

  const run = async () => {
    reset()
    setIsRunning(true)

    const vm = vmRef.current
    while (!vm.halted && vm.pc < bytecode.length) {
      const stepIdx = vm.pc
      setCurrentStep(stepIdx)

      // Animate the current line
      if (bytecodeRefs.current[stepIdx]) {
        gsap.fromTo(
          bytecodeRefs.current[stepIdx],
          { backgroundColor: 'rgba(0, 240, 255, 0.2)' },
          { backgroundColor: 'transparent', duration: 0.5 }
        )
      }

      vm.step(bytecode)
      setStack([...vm.stack])
      setConsoleOutput([...vm.output])
      setIsHalted(vm.halted)

      await new Promise((r) => setTimeout(r, 400))
    }

    setIsRunning(false)
  }

  const step = () => {
    if (vmRef.current.halted || vmRef.current.pc >= bytecode.length) {
      reset()
      return
    }

    const vm = vmRef.current
    const stepIdx = vm.pc
    setCurrentStep(stepIdx)

    if (bytecodeRefs.current[stepIdx]) {
      gsap.fromTo(
        bytecodeRefs.current[stepIdx],
        { backgroundColor: 'rgba(0, 240, 255, 0.2)' },
        { backgroundColor: 'transparent', duration: 0.5 }
      )
    }

    vm.step(bytecode)
    setStack([...vm.stack])
    setConsoleOutput([...vm.output])
    setIsHalted(vm.halted)
  }

  const selectProgram = (idx: number) => {
    reset()
    setSelectedProgramIdx(idx)
  }

  const initializedCustom = useRef(false)
  // Effect to sync custom bytecode when switching to custom program
  useEffect(() => {
    if (program.isCustom && !initializedCustom.current) {
      setCustomBytecode(program.bytecode.join('\n'))
      initializedCustom.current = true
    } else if (!program.isCustom) {
      initializedCustom.current = false
    }
  }, [program.isCustom, program.bytecode])

  return (
    <section
      id="playground"
      ref={sectionRef}
      className="relative py-32 bg-void"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-8">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-sage-mid tracking-widest mb-4">
            INTERACTIVE
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white tracking-tight">
            VM Playground
          </h2>
          <p className="font-body text-white/50 mt-4 max-w-2xl mx-auto">
            Simulate bytecode execution in real-time. Watch the stack grow,
            instructions execute, and output flow through the VM.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {SAMPLE_PROGRAMS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => selectProgram(i)}
              className={`px-4 py-2 rounded-lg font-mono text-xs transition-all duration-300 ${
                selectedProgramIdx === i
                  ? 'bg-sage-mid/15 text-sage-mid border border-sage-mid/30'
                  : 'bg-white/[0.03] text-white/50 border border-transparent hover:border-white/[0.08]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {!program.isCustom && (
              <div className="glass-panel rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <span className="font-mono text-xs text-white/40">
                    {program.name}.sage
                  </span>
                </div>
                <div className="code-block p-4">
                  <pre className="font-mono text-xs leading-relaxed">
                    <code className="text-white/80">{program.code}</code>
                  </pre>
                </div>
              </div>
            )}

            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-xs text-sage-mid">
                  {program.isCustom ? 'BYTECODE EDITOR' : 'BYTECODE'}
                </span>
                {program.isCustom && (
                  <Edit3 className="w-4 h-4 text-sage-mid" />
                )}
                {!program.isCustom && <Zap className="w-4 h-4 text-sage-mid" />}
              </div>
              
              {program.isCustom ? (
                <div className="p-0">
                  <textarea
                    value={customBytecode}
                    onChange={(e) => setCustomBytecode(e.target.value)}
                    className="w-full h-64 bg-transparent p-4 font-mono text-xs text-white/80 focus:outline-none resize-none"
                    placeholder="OP_CONSTANT 100\nOP_PRINT"
                  />
                </div>
              ) : (
                <div className="code-block p-4 max-h-64 overflow-y-auto">
                  <pre className="font-mono text-xs leading-relaxed">
                    {bytecode.map((line, i) => (
                      <div
                        key={i}
                        ref={(el) => {
                          if (el) bytecodeRefs.current[i] = el
                        }}
                        className={`py-0.5 px-1 rounded transition-colors ${
                          i === currentStep
                            ? 'bg-sage-mid/10 text-sage-mid'
                            : 'text-white/60'
                        }`}
                      >
                        <span className="text-white/30 mr-3">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {line}
                      </div>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={run}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2.5 bg-sage-mid/15 text-sage-mid border border-sage-mid/30 rounded-lg font-mono text-sm hover:bg-sage-mid/25 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Run
              </button>
              <button
                onClick={step}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] text-white/70 border border-white/[0.08] rounded-lg font-mono text-sm hover:border-sage-mid/30 hover:text-sage-mid transition-all disabled:opacity-50"
              >
                <StepForward className="w-4 h-4" />
                Step
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] text-white/70 border border-white/[0.08] rounded-lg font-mono text-sm hover:border-sage-mid/30 hover:text-sage-mid transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-xs text-sage-light">
                  STACK
                </span>
              </div>
              <div className="p-4 min-h-[120px]">
                {stack.length === 0 ? (
                  <p className="text-white/30 font-mono text-xs text-center py-8">
                    Stack empty — run to see values
                  </p>
                ) : (
                  <div className="flex flex-col-reverse gap-2">
                    {stack.map((val, i) => (
                      <div
                        key={i}
                        className="border-sage-light rounded-lg px-4 py-3 bg-sage-light/5 animate-in fade-in slide-in-from-bottom-2"
                      >
                        <span className="font-mono text-sm text-sage-light">
                          {typeof val === 'string' ? `"${val}"` : val}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-xs text-amber">
                  CONSOLE
                </span>
              </div>
              <div className="code-block p-4 min-h-[120px]">
                {consoleOutput.length === 0 ? (
                  <p className="text-white/30 font-mono text-xs">
                    $ waiting for execution...
                  </p>
                ) : (
                  <div className="space-y-1">
                    {consoleOutput.map((line, i) => (
                      <p
                        key={i}
                        className="font-mono text-xs text-white/80 animate-in fade-in"
                      >
                        {line}
                      </p>
                    ))}
                    {isHalted && (
                      <p className="font-mono text-xs text-white/30 mt-2">
                        $ execution complete
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

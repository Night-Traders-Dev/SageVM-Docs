import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Play, StepForward, RotateCcw, Zap } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const SAMPLE_PROGRAMS = [
  {
    name: 'Hello World',
    code: `proc main():
    print "Hello, SageVM!"
    return 0`,
    bytecode: [
      'OP_CONSTANT 0    ; "Hello, SageVM!"',
      'OP_PRINT',
      'OP_CONSTANT 1    ; 0',
      'OP_RETURN',
    ],
    output: 'Hello, SageVM!',
    stack: ['"Hello, SageVM!"', '0'],
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
      'OP_CONSTANT 0    ; 10',
      'OP_DEFINE_GLOBAL 1  ; x',
      'OP_CONSTANT 2    ; 20',
      'OP_DEFINE_GLOBAL 3  ; y',
      'OP_GET_GLOBAL 1  ; x',
      'OP_GET_GLOBAL 3  ; y',
      'OP_CONSTANT 4    ; 2',
      'OP_MUL',
      'OP_ADD',
      'OP_DEFINE_GLOBAL 5  ; result',
      'OP_GET_GLOBAL 5  ; result',
      'OP_PRINT',
      'OP_GET_GLOBAL 5  ; result',
      'OP_RETURN',
    ],
    output: '50',
    stack: ['50'],
  },
  {
    name: 'Function Call',
    code: `proc add(a, b):
    return a + b

proc main():
    var result = add(5, 3)
    print result
    return result`,
    bytecode: [
      'OP_CONSTANT 0    ; 5',
      'OP_CONSTANT 1    ; 3',
      'OP_CALL 2        ; add(5, 3)',
      'OP_DEFINE_GLOBAL 2  ; result',
      'OP_GET_GLOBAL 2  ; result',
      'OP_PRINT',
      'OP_GET_GLOBAL 2  ; result',
      'OP_RETURN',
    ],
    output: '8',
    stack: ['8'],
  },
]

export default function Playground() {
  const [selectedProgram, setSelectedProgram] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [consoleOutput, setConsoleOutput] = useState<string[]>([])
  const [stack, setStack] = useState<string[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)
  const bytecodeRefs = useRef<HTMLDivElement[]>([])

  const program = SAMPLE_PROGRAMS[selectedProgram]

  const reset = () => {
    setIsRunning(false)
    setCurrentStep(-1)
    setConsoleOutput([])
    setStack([])
  }

  const run = async () => {
    reset()
    setIsRunning(true)

    for (let i = 0; i < program.bytecode.length; i++) {
      setCurrentStep(i)

      // Animate the current line
      if (bytecodeRefs.current[i]) {
        gsap.fromTo(
          bytecodeRefs.current[i],
          { backgroundColor: 'rgba(0, 240, 255, 0.2)' },
          { backgroundColor: 'transparent', duration: 0.5 }
        )
      }

      // Simulate execution
      await new Promise((r) => setTimeout(r, 400))

      // Check for print
      if (program.bytecode[i].includes('OP_PRINT')) {
        setConsoleOutput((prev) => [...prev, `> ${program.output}`])
      }

      // Update stack visualization
      if (i === program.bytecode.length - 1) {
        setStack(program.stack)
      }
    }

    setIsRunning(false)
  }

  const step = async () => {
    if (currentStep >= program.bytecode.length - 1) {
      reset()
      return
    }

    const nextStep = currentStep + 1
    setCurrentStep(nextStep)

    if (bytecodeRefs.current[nextStep]) {
      gsap.fromTo(
        bytecodeRefs.current[nextStep],
        { backgroundColor: 'rgba(0, 240, 255, 0.2)' },
        { backgroundColor: 'transparent', duration: 0.5 }
      )
    }

    if (program.bytecode[nextStep].includes('OP_PRINT')) {
      setConsoleOutput((prev) => [...prev, `> ${program.output}`])
    }

    if (nextStep === program.bytecode.length - 1) {
      setStack(program.stack)
    }
  }

  useEffect(() => {
    reset()
  }, [selectedProgram])

  return (
    <section
      id="playground"
      ref={sectionRef}
      className="relative py-32 bg-void"
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <img
          src="/native-bridge.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-void via-void/90 to-void" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-neon-cyan tracking-widest mb-4">
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

        {/* Program selector */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {SAMPLE_PROGRAMS.map((p, i) => (
            <button
              key={p.name}
              onClick={() => setSelectedProgram(i)}
              className={`px-4 py-2 rounded-lg font-mono text-xs transition-all duration-300 ${
                selectedProgram === i
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30'
                  : 'bg-white/[0.03] text-white/50 border border-transparent hover:border-white/[0.08]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Main playground area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Source + Bytecode */}
          <div className="space-y-4">
            {/* Source code */}
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

            {/* Bytecode */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-xs text-neon-cyan">
                  BYTECODE
                </span>
                <Zap className="w-4 h-4 text-neon-cyan" />
              </div>
              <div className="code-block p-4 max-h-64 overflow-y-auto">
                <pre className="font-mono text-xs leading-relaxed">
                  {program.bytecode.map((line, i) => (
                    <div
                      key={i}
                      ref={(el) => {
                        if (el) bytecodeRefs.current[i] = el
                      }}
                      className={`py-0.5 px-1 rounded transition-colors ${
                        i === currentStep
                          ? 'bg-neon-cyan/10 text-neon-cyan'
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
            </div>
          </div>

          {/* Right: VM State */}
          <div className="space-y-4">
            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={run}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2.5 bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 rounded-lg font-mono text-sm hover:bg-neon-cyan/25 transition-all disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Run
              </button>
              <button
                onClick={step}
                disabled={isRunning}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] text-white/70 border border-white/[0.08] rounded-lg font-mono text-sm hover:border-neon-cyan/30 hover:text-neon-cyan transition-all disabled:opacity-50"
              >
                <StepForward className="w-4 h-4" />
                Step
              </button>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.03] text-white/70 border border-white/[0.08] rounded-lg font-mono text-sm hover:border-neon-cyan/30 hover:text-neon-cyan transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Stack visualization */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-xs text-neon-green">
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
                        className="neon-border-green rounded-lg px-4 py-3 bg-neon-green/5 animate-in fade-in slide-in-from-bottom-2"
                      >
                        <span className="font-mono text-sm text-neon-green">
                          {val}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Console output */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="font-mono text-xs text-neon-amber">
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
                    <p className="font-mono text-xs text-white/30 mt-2">
                      $ execution complete
                    </p>
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

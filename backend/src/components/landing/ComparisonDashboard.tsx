"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, Code, Target } from "lucide-react"

interface Scenario {
  id: string
  title: string
  icon: typeof Brain
  question: string
  genericResponse: string
  mrorResponse: string
  context: string
}

const scenarios: Scenario[] = [
  {
    id: "1",
    title: "Career Advice",
    icon: Target,
    question: "What career path should I consider?",
    genericResponse:
      "Consider your strengths and interests when choosing a career path. Look into fields that align with your skills, research job markets, and network with professionals in areas you find interesting.",
    mrorResponse:
      "Given your background in mechanical engineering and recent interest in renewable energy that we discussed, have you considered roles in wind turbine design or EV battery systems? Your technical skills would transfer well, and it aligns with the sustainable focus you mentioned.",
    context: "Background: Mechanical Engineering",
  },
  {
    id: "2",
    title: "Learning Help",
    icon: Code,
    question: "How should I learn Python?",
    genericResponse:
      "Python is great for beginners. Start with variables and loops, practice with simple programs, and gradually move to more advanced concepts like functions and classes.",
    mrorResponse:
      "Since you mentioned struggling with abstract concepts, let's relate Python to your woodworking hobby. Think of functions as reusable jigs - you build them once, use them many times. Variables are like your labeled bins storing different types of screws.",
    context: "Interest: Woodworking",
  },
  {
    id: "3",
    title: "Project Planning",
    icon: Brain,
    question: "Help me plan my week",
    genericResponse:
      "Break your week into manageable tasks, prioritize important items, set realistic goals, and leave buffer time for unexpected issues. Use a calendar or task management tool to stay organized.",
    mrorResponse:
      "Based on your design portfolio deadline next Friday and your morning person preference, I've structured a schedule: mornings for creative work (6-10am), afternoons for client calls, and reserved Wednesday evening for your pottery class you enjoy.",
    context: "Goals: Design Portfolio",
  },
]

export default function ComparisonDashboard() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0])
  const [activeResponse, setActiveResponse] = useState<"generic" | "mror">("generic")

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-0">
      {/* Scenario Selector */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center">
        {scenarios.map((scenario) => {
          const Icon = scenario.icon
          return (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario)}
              className={`
                flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full
                text-xs sm:text-sm font-medium transition-all duration-300
                ${
                  selectedScenario.id === scenario.id
                    ? "bg-white/10 text-white border border-white/30 shadow-lg shadow-white/10"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{scenario.title}</span>
              <span className="xs:hidden">{scenario.title.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* Dashboard Card */}
      <div className="relative">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10"></div>

        {/* Content */}
        <div className="relative p-4 sm:p-6 md:p-8">
          {/* Question */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/60 rounded-full"></div>
              <span className="text-white/60 text-xs sm:text-sm font-medium uppercase tracking-wide">
                User Question
              </span>
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white">{selectedScenario.question}</h3>
          </div>

          {/* Context Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 mb-6 sm:mb-8">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-400 rounded-full animate-pulse"></div>
            <span className="text-indigo-200 text-xs sm:text-sm font-medium">{selectedScenario.context}</span>
          </div>

          {/* Toggle */}
          <div className="mb-4 sm:mb-6 overflow-x-auto">
            <div className="relative inline-flex p-0.5 sm:p-1 bg-black/40 rounded-full border border-white/10 min-w-max">
              <motion.div
                className="absolute inset-y-0.5 sm:inset-y-1 w-1/2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full"
                animate={{
                  x: activeResponse === "generic" ? 0 : "100%",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setActiveResponse("generic")}
                className={`
                  relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap
                  ${activeResponse === "generic" ? "text-white" : "text-white/50"}
                `}
              >
                Generic AI
              </button>
              <button
                onClick={() => setActiveResponse("mror")}
                className={`
                  relative z-10 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-colors whitespace-nowrap
                  ${activeResponse === "mror" ? "text-white" : "text-white/50"}
                `}
              >
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-semibold">
                  MROR
                </span>
              </button>
            </div>
          </div>

          {/* Response */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeResponse}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`
                p-4 sm:p-6 rounded-xl sm:rounded-2xl border min-h-[140px] sm:min-h-[180px]
                ${
                  activeResponse === "generic"
                    ? "bg-white/5 border-white/10"
                    : "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-400/20"
                }
              `}
            >
              <p className="text-white/90 text-sm sm:text-base md:text-lg leading-relaxed">
                {activeResponse === "generic"
                  ? selectedScenario.genericResponse
                  : selectedScenario.mrorResponse}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Stats (only show for MROR) */}
          {activeResponse === "mror" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6"
            >
              {[
                { label: "Context-aware", icon: "✓" },
                { label: "Personalized", icon: "✓" },
                { label: "Actionable", icon: "✓" },
              ].map((stat, index) => (
                <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold">
                    {stat.icon}
                  </div>
                  <span className="text-white/70 text-xs sm:text-sm font-medium">{stat.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

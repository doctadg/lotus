"use client"

import { useCallback, useEffect, useMemo } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import { loadPolygonMaskPlugin } from "@tsparticles/plugin-polygon-mask"
interface ParticleBackgroundProps {
  className?: string
}

export default function ParticleBackground({ className = "" }: ParticleBackgroundProps) {
  const init = useCallback(async (engine: any) => {
    await loadSlim(engine)
    await loadPolygonMaskPlugin(engine)
  }, [])

  const particlesLoaded = useCallback(async (container?: any) => {
    console.log("Particles loaded", container)
  }, [])

  // Enhanced particle configuration with SVG trace lines and original particle style
  const options = useMemo(
    () => ({
      autoPlay: true,
      background: {
        color: {
          value: "transparent",
        },
      },
      fullScreen: {
        enable: false,
        zIndex: 0,
      },
      detectRetina: true,
      fpsLimit: 120,
      interactivity: {
        detectsOn: "window" as const,
        events: {
          onHover: {
            enable: true,
            mode: "bubble" as const,
          },
          resize: {
            enable: true,
            delay: 0.5,
          },
        },
        modes: {
          bubble: {
            distance: 80,
            duration: 2,
            opacity: 0.8,
            size: 2,
            speed: 3,
          },
        },
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        links: {
          blink: false,
          color: {
            value: "#ffffff",
          },
          consent: false,
          distance: 60,
          enable: true,
          frequency: 1,
          opacity: 0.4,
          width: 2.5,
          warp: false,
        },
        move: {
          direction: "none" as const,
          enable: true,
          outModes: {
            default: "bounce" as const,
          },
          random: false,
          speed: 0.5,
          straight: false,
        },
        number: {
          density: {
            enable: false,
          },
          value: 100,
        },
        opacity: {
          value: {
            min: 0.1,
            max: 0.5,
          },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
            startValue: "random" as const,
            mode: "auto" as const,
          },
        },
        shape: {
          type: "circle" as const,
        },
        size: {
          value: 1.5,
        },
      },
      polygon: {
        draw: {
          enable: true,
          stroke: {
            color: {
              value: "#ffffff",
            },
            width: 1.5,
            opacity: 0.4,
          },
        },
        enable: true,
        inline: {
          arrangement: "equidistant" as const,
        },
        move: {
          radius: 4,
          type: "path" as const,
        },
        scale: 0.4,
        type: "inline" as const,
        url: "/lotus.svg",
        position: {
          x: 50,
          y: 50,
        },
      },
    }),
    [],
  )

  useEffect(() => {
    initParticlesEngine(init)
  }, [init])

  return (
    <div className={`w-full h-full ${className}`}>
      <Particles
        id="lotus-particles"
        url="/"
        options={options}
        className="w-full h-full"
      />
    </div>
  )
}
"use client"

import { useCallback, useEffect, useMemo } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import { loadSlim } from "@tsparticles/slim"
import { loadPolygonMaskPlugin } from "@tsparticles/plugin-polygon-mask"
import type { Container, Engine } from "@tsparticles/engine"

interface ParticleBackgroundProps {
  className?: string
}

export default function ParticleBackground({ className = "" }: ParticleBackgroundProps) {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
    await loadPolygonMaskPlugin(engine)
  }, [])

  const particlesLoaded = useCallback(async (container?: Container) => {
    console.log("Particles loaded", container)
  }, [])

  // Particle configuration optimized for lotus logo
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
          distance: 25,
          enable: true,
          frequency: 1,
          opacity: 0.2,
          width: 0.5,
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
          value: 800,
        },
        opacity: {
          value: {
            min: 0.1,
            max: 0.4,
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
          value: 0.8,
        },
      },
      polygon: {
        draw: {
          enable: false,
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
        init={init}
        loaded={particlesLoaded}
        options={options}
        className="w-full h-full"
      />
    </div>
  )
}

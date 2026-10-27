import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  Sun,
  Layers,
  Sparkles,
  Camera,
  Info,
} from 'lucide-react'
import { resolveImageUrl } from '@/lib/api'

interface Spatial3dRenderModalProps {
  isOpen: boolean
  onClose: () => void
  render?: { imageUrl: string; prompt?: string; id?: string } | null
  imageUrl?: string
  title?: string
  prompt?: string
}

export function Spatial3dRenderModal({
  isOpen,
  onClose,
  render,
  imageUrl,
  title,
  prompt,
}: Spatial3dRenderModalProps) {
  const targetImageUrl = render?.imageUrl || imageUrl || ''
  const targetTitle = title || (render?.prompt ? render.prompt.slice(0, 50) + '...' : 'Architectural 3D Spatial View')
  const targetPrompt = prompt || render?.prompt || ''
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const animFrameId = useRef<number | null>(null)

  // Control parameters
  const [depthIntensity, setDepthIntensity] = useState<number>(0.35)
  const [meshMode, setMeshMode] = useState<'textured' | 'wireframe' | 'clay'>('textured')
  const [curveMode, setCurveMode] = useState<'flat' | 'curved' | 'dome'>('curved')
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [lightColor, setLightColor] = useState<'daylight' | 'golden' | 'cyan'>('golden')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoadingTexture, setIsLoadingTexture] = useState(true)

  const dirLightRef = useRef<THREE.DirectionalLight | null>(null)

  // Initialize Three.js Scene
  useEffect(() => {
    if (!isOpen || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 500

    // 1. Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x070709)
    sceneRef.current = scene

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 7)
    cameraRef.current = camera

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 15
    controls.minDistance = 2
    controls.maxPolarAngle = Math.PI / 1.6
    controls.minPolarAngle = Math.PI / 4
    controlsRef.current = controls

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xfff4e0, 2.0)
    dirLight.position.set(5, 5, 6)
    scene.add(dirLight)
    dirLightRef.current = dirLight

    // 6. Texture Loader
    setIsLoadingTexture(true)
    const textureLoader = new THREE.TextureLoader()
    const resolvedUrl = resolveImageUrl(targetImageUrl)

    textureLoader.load(
      resolvedUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearMipmapLinearFilter

        // Calculate aspect ratio
        const imgAspect = (texture.image.width || 16) / (texture.image.height || 9)
        const planeWidth = 5.2
        const planeHeight = planeWidth / imgAspect

        // Subdivided geometry for spatial displacement
        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, 140, 90)

        // Generate algorithmic depth curve based on position & perspective
        const pos = geometry.attributes.position
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const y = pos.getY(i)
          // Curved perspective arching towards camera edges
          const r2 = (x * x) / (planeWidth * planeWidth) + (y * y) / (planeHeight * planeHeight)
          pos.setZ(i, -r2 * depthIntensity * 1.5)
        }
        geometry.computeVertexNormals()

        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.35,
          metalness: 0.1,
          side: THREE.DoubleSide,
        })

        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)
        meshRef.current = mesh
        setIsLoadingTexture(false)
      },
      undefined,
      (err) => {
        console.error('Failed to load spatial texture:', err)
        setIsLoadingTexture(false)
      },
    )

    // Animation Loop
    function animate() {
      animFrameId.current = requestAnimationFrame(animate)
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotating
        controlsRef.current.autoRotateSpeed = 2.0
        controlsRef.current.update()
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    // Resize Handler
    function handleResize() {
      if (!container || !cameraRef.current || !rendererRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [isOpen, targetImageUrl])

  // Update Depth Displacement & Geometry
  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const pos = mesh.geometry.attributes.position

    const planeWidth = 5.2

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)

      let z = 0
      if (curveMode === 'curved') {
        // Cylindrical IMAX curve
        const factor = (x * x) / (planeWidth * 0.5 * (planeWidth * 0.5))
        z = -factor * depthIntensity * 1.8
      } else if (curveMode === 'dome') {
        // Spherical dome projection
        const r2 = (x * x) / 10 + (y * y) / 6
        z = -r2 * depthIntensity * 2.2
      } else {
        // Subtle relief
        z = 0
      }
      pos.setZ(i, z)
    }
    pos.needsUpdate = true
    mesh.geometry.computeVertexNormals()
  }, [depthIntensity, curveMode])

  // Update Material Shading Mode
  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current
    const mat = mesh.material as THREE.MeshStandardMaterial

    if (meshMode === 'wireframe') {
      mat.wireframe = true
      mat.color.setHex(0x10b981)
    } else if (meshMode === 'clay') {
      mat.wireframe = false
      mat.color.setHex(0xf5f5f5)
      mat.roughness = 0.9
      mat.metalness = 0.0
    } else {
      mat.wireframe = false
      mat.color.setHex(0xffffff)
      mat.roughness = 0.35
      mat.metalness = 0.1
    }
    mat.needsUpdate = true
  }, [meshMode])

  // Update Light Tone
  useEffect(() => {
    if (!dirLightRef.current) return
    if (lightColor === 'golden') {
      dirLightRef.current.color.setHex(0xfff0d0)
      dirLightRef.current.intensity = 2.2
    } else if (lightColor === 'cyan') {
      dirLightRef.current.color.setHex(0xd0f5ff)
      dirLightRef.current.intensity = 2.0
    } else {
      dirLightRef.current.color.setHex(0xffffff)
      dirLightRef.current.intensity = 2.0
    }
  }, [lightColor])

  // Reset Camera View
  function handleResetView() {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(0, 0, 7)
    controlsRef.current.target.set(0, 0, 0)
    controlsRef.current.update()
  }

  // Capture Screenshot of 3D Scene
  function handleCaptureSnapshot() {
    if (!rendererRef.current) return
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${targetTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-3d-spatial.png`
    link.href = dataUrl
    link.click()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0e] shadow-2xl transition-all ${
          isFullscreen ? 'size-full' : 'h-[90vh] w-full max-w-5xl'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{targetTitle}</h3>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  Interactive 3D Spatial Mesh
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate max-w-md">
                {targetPrompt || 'Orbit, tilt, and explore the architectural render in 3D perspective'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-neutral-400 hover:text-white"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-neutral-400 hover:text-white"
              title="Close 3D View"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Viewport */}
        <div className="relative flex-1 bg-[#070709] overflow-hidden">
          <div ref={containerRef} className="size-full cursor-grab active:cursor-grabbing" />

          {/* Loading Indicator */}
          {isLoadingTexture && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-4 py-2 text-xs font-medium text-white shadow-xl">
                <RotateCw className="size-4 animate-spin text-emerald-400" />
                <span>Generating 3D spatial relief...</span>
              </div>
            </div>
          )}

          {/* Viewport Overlay Controls */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <button
              onClick={handleResetView}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-neutral-300 backdrop-blur-md hover:bg-black/80 hover:text-white"
            >
              <RotateCw className="size-3" />
              <span>Center Camera</span>
            </button>

            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium backdrop-blur-md transition-colors ${
                isAutoRotating
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/10 bg-black/60 text-neutral-300 hover:text-white'
              }`}
            >
              <span>Auto Orbit</span>
            </button>

            <button
              onClick={handleCaptureSnapshot}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-neutral-300 backdrop-blur-md hover:bg-black/80 hover:text-white"
              title="Save current 3D perspective angle"
            >
              <Camera className="size-3" />
              <span>Snap 3D Angle</span>
            </button>
          </div>

          {/* Instructions Overlay */}
          <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-[11px] text-neutral-400 backdrop-blur-md border border-white/5">
            <Info className="size-3.5 text-emerald-400" />
            <span>Left-click: Orbit · Right-click: Pan · Scroll: Zoom</span>
          </div>
        </div>

        {/* Bottom Control Dock */}
        <div className="border-t border-white/10 bg-black/60 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* 3D Depth Curve Mode */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-neutral-400">Projection:</span>
              <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5">
                {[
                  { id: 'curved', label: 'IMAX Curved' },
                  { id: 'dome', label: 'Dome 3D' },
                  { id: 'flat', label: 'Flat Relief' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setCurveMode(mode.id as any)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      curveMode === mode.id
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Shading Mode */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-neutral-400">Shader:</span>
              <div className="flex rounded-lg border border-white/10 bg-black/40 p-0.5">
                {[
                  { id: 'textured', label: 'Photoreal' },
                  { id: 'clay', label: 'Clay White' },
                  { id: 'wireframe', label: 'Wireframe' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMeshMode(m.id as any)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      meshMode === m.id
                        ? 'bg-white/15 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Depth Intensity Slider */}
            <div className="flex items-center gap-2.5 min-w-[180px]">
              <span className="text-[11px] font-medium text-neutral-400">Depth:</span>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={depthIntensity}
                onChange={(e) => setDepthIntensity(parseFloat(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-emerald-500"
              />
              <span className="font-mono text-[10px] text-neutral-400 w-8">
                {depthIntensity.toFixed(2)}
              </span>
            </div>

            {/* Lighting Tone */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-neutral-400">Light:</span>
              <button
                onClick={() => setLightColor('golden')}
                className={`rounded-md border p-1 text-[10px] ${
                  lightColor === 'golden'
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
                title="Golden Sunset"
              >
                <Sun className="size-3.5" />
              </button>
              <button
                onClick={() => setLightColor('daylight')}
                className={`rounded-md border p-1 text-[10px] ${
                  lightColor === 'daylight'
                    ? 'border-white bg-white/20 text-white'
                    : 'border-white/10 text-neutral-400 hover:text-white'
                }`}
                title="Bright Daylight"
              >
                <Layers className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

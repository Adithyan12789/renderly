import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { useNavigate } from 'react-router'
import {
  Download,
  Grid,
  Maximize2,
  Minimize2,
  RotateCw,
  Sparkles,
  Upload,
  Building2,
  Sofa,
  Compass,
} from 'lucide-react'
import { toast } from '@/stores/toast-store'

type ModelPreset = 'villa' | 'pavilion' | 'tower' | 'interior' | 'custom'
type MaterialMode = 'pbr' | 'clay' | 'wireframe' | 'normal' | 'gold'
type LightingPreset = 'golden' | 'daylight' | 'studio' | 'night'
type CameraPreset = 'perspective' | 'top' | 'front' | 'side' | 'isometric'

export function ThreeDStudioPage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Three.js instances
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const gridHelperRef = useRef<THREE.GridHelper | null>(null)
  const animFrameId = useRef<number | null>(null)

  // Lighting refs
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null)
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null)
  const pointLightRef = useRef<THREE.PointLight | null>(null)

  // State
  const [selectedModel, setSelectedModel] = useState<ModelPreset>('villa')
  const [customModelName, setCustomModelName] = useState<string | null>(null)
  const [materialMode, setMaterialMode] = useState<MaterialMode>('pbr')
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('golden')
  const [isAutoRotating, setIsAutoRotating] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [fov, setFov] = useState(45)
  const [lightIntensity, setLightIntensity] = useState(1.8)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoadingModel, setIsLoadingModel] = useState(false)

  // -------------------------------------------------------------
  // 1. Procedural Architectural Model Generators
  // -------------------------------------------------------------

  // Model 1: Modern Cantilevered Villa
  function createModernVilla(): THREE.Group {
    const group = new THREE.Group()

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xe2e4e8, roughness: 0.6, metalness: 0.05 })
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5d3b, roughness: 0.5, metalness: 0.0 })
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.3, metalness: 0.8 })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xccf2ff,
      transmission: 0.85,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
    })
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x1f94a8, roughness: 0.1, metalness: 0.2 })

    // Ground platform & driveway
    const ground = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 14), concreteMat)
    ground.position.y = -0.2
    ground.receiveShadow = true
    group.add(ground)

    // Wood pool deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.2, 5), woodMat)
    deck.position.set(3.5, 0.1, 3.5)
    deck.receiveShadow = true
    group.add(deck)

    // Swimming Pool
    const pool = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 3), waterMat)
    pool.position.set(3.5, 0.15, 3.5)
    group.add(pool)

    // Lower Floor Concrete Volume
    const lowerVolume = new THREE.Mesh(new THREE.BoxGeometry(7, 2.8, 6), concreteMat)
    lowerVolume.position.set(-2.5, 1.4, 0)
    lowerVolume.castShadow = true
    lowerVolume.receiveShadow = true
    group.add(lowerVolume)

    // Large Glass Sliding Wall (Lower level)
    const lowerGlass = new THREE.Mesh(new THREE.BoxGeometry(6.6, 2.4, 0.1), glassMat)
    lowerGlass.position.set(-2.5, 1.4, 3.05)
    group.add(lowerGlass)

    // Upper Floor Cantilevered Volume (shifted out dramatically)
    const upperVolume = new THREE.Mesh(new THREE.BoxGeometry(8, 2.6, 5), concreteMat)
    upperVolume.position.set(-1.0, 4.0, 1.0)
    upperVolume.castShadow = true
    upperVolume.receiveShadow = true
    group.add(upperVolume)

    // Upper Level Panoramic Glass
    const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.2, 0.1), glassMat)
    upperGlass.position.set(-1.0, 4.0, 3.55)
    group.add(upperGlass)

    // Slender Architectural Columns
    for (let x = -4; x <= 2; x += 3) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.7, 16), darkMetalMat)
      col.position.set(x, 1.35, 3.2)
      col.castShadow = true
      group.add(col)
    }

    // Roof overhang
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.25, 5.6), darkMetalMat)
    roof.position.set(-1.0, 5.4, 1.0)
    roof.castShadow = true
    group.add(roof)

    return group
  }

  // Model 2: Parametric Architectural Pavilion
  function createParametricPavilion(): THREE.Group {
    const group = new THREE.Group()

    const marbleMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.3, metalness: 0.1 })
    const woodRibMat = new THREE.MeshStandardMaterial({ color: 0x9c6644, roughness: 0.4, metalness: 0.1 })
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.25, metalness: 0.85 })

    // Base podium
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.4, 0.5, 32), marbleMat)
    podium.position.y = -0.25
    podium.receiveShadow = true
    group.add(podium)

    // Series of curved architectural ribs creating a sweeping canopy
    const ribCount = 18
    for (let i = 0; i < ribCount; i++) {
      const angle = (i / ribCount) * Math.PI * 1.5 - Math.PI * 0.75
      const height = 3.5 + Math.sin((i / ribCount) * Math.PI) * 2.2
      const radius = 4.2 + Math.cos((i / ribCount) * Math.PI) * 0.8

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle) * (radius * 0.4), 0, Math.sin(angle) * (radius * 0.4)),
        new THREE.Vector3(Math.cos(angle) * radius, height * 0.6, Math.sin(angle) * radius),
        new THREE.Vector3(Math.cos(angle + 0.3) * (radius * 0.8), height, Math.sin(angle + 0.3) * (radius * 0.8)),
        new THREE.Vector3(Math.cos(angle + 0.6) * 0.8, height * 0.9, Math.sin(angle + 0.6) * 0.8),
      ])

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.1, 8, false)
      const rib = new THREE.Mesh(tubeGeo, i % 2 === 0 ? woodRibMat : goldMat)
      rib.castShadow = true
      group.add(rib)
    }

    // Central circular seating sculpture
    const seating = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.35, 16, 32), woodRibMat)
    seating.rotation.x = Math.PI / 2
    seating.position.y = 0.35
    seating.castShadow = true
    group.add(seating)

    return group
  }

  // Model 3: Urban Highrise Skyscraper
  function createSkyscraper(): THREE.Group {
    const group = new THREE.Group()

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x33353b, roughness: 0.6 })
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x5599bb,
      transmission: 0.7,
      roughness: 0.1,
      metalness: 0.3,
    })
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.2, metalness: 0.9 })

    // Podium Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 6), concreteMat)
    base.position.y = 0.75
    base.castShadow = true
    group.add(base)

    // Main Tower Glass Core
    const towerCore = new THREE.Mesh(new THREE.BoxGeometry(4.2, 11, 4.2), glassMat)
    towerCore.position.y = 7
    towerCore.castShadow = true
    group.add(towerCore)

    // Floor plates & facade mullions
    for (let f = 2; f <= 12; f += 0.8) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.08, 4.4), metalMat)
      plate.position.y = f
      group.add(plate)
    }

    // Vertical structural fins on facade
    for (let i = -1.8; i <= 1.8; i += 0.9) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 11, 0.3), metalMat)
      fin.position.set(i, 7, 2.15)
      group.add(fin)
    }

    // Angular Crown / Penthouse
    const crown = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.5, 4), metalMat)
    crown.position.y = 13.75
    crown.rotation.y = Math.PI / 4
    group.add(crown)

    // Spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 3, 8), metalMat)
    spire.position.y = 16
    group.add(spire)

    group.scale.set(0.65, 0.65, 0.65)
    return group
  }

  // Model 4: Interior Loft
  function createInteriorLoft(): THREE.Group {
    const group = new THREE.Group()

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x5a3e2a, roughness: 0.35 })
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f2, roughness: 0.8 })
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.85 })
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.6 })
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xe0f7fa, transmission: 0.9, roughness: 0.1 })
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc69214, roughness: 0.3, metalness: 0.8 })

    // Floor
    const floor = new THREE.Mesh(new THREE.BoxGeometry(10, 0.2, 8), floorMat)
    floor.position.y = -0.1
    floor.receiveShadow = true
    group.add(floor)

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.2), wallMat)
    backWall.position.set(0, 2.4, -4)
    backWall.receiveShadow = true
    group.add(backWall)

    // Side Wall with Large Window Cutout
    const sideWallTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 8), wallMat)
    sideWallTop.position.set(-5, 4.3, 0)
    group.add(sideWallTop)

    const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.6, 6.5), glassMat)
    windowGlass.position.set(-5, 1.9, 0)
    group.add(windowGlass)

    // Mezzanine Loft
    const mezzanine = new THREE.Mesh(new THREE.BoxGeometry(5, 0.25, 4), floorMat)
    mezzanine.position.set(2.5, 3.0, -2.0)
    mezzanine.castShadow = true
    group.add(mezzanine)

    // Loft Railing
    const railing = new THREE.Mesh(new THREE.BoxGeometry(5, 0.9, 0.05), brassMat)
    railing.position.set(2.5, 3.55, 0.0)
    group.add(railing)

    // Sofa (Modern Minimalist Sectional)
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.8), sofaMat)
    sofaBase.position.set(0, 0.22, 0.5)
    sofaBase.castShadow = true
    group.add(sofaBase)

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.7, 0.4), sofaMat)
    sofaBack.position.set(0, 0.7, -0.2)
    sofaBack.castShadow = true
    group.add(sofaBack)

    // Accent Pillows
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.15), accentMat)
    pillow1.position.set(-1.2, 0.65, 0.1)
    pillow1.rotation.y = 0.2
    group.add(pillow1)

    // Coffee Table (Round Travertine)
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.3, 32), wallMat)
    table.position.set(0, 0.15, 2.0)
    table.castShadow = true
    group.add(table)

    return group
  }

  // -------------------------------------------------------------
  // 2. Initialize Three.js Viewport
  // -------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x08080a)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 1000)
    camera.position.set(9, 7, 11)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxDistance = 50
    controls.minDistance = 2
    controls.target.set(0, 1.5, 0)
    controls.update()
    controlsRef.current = controls

    // Architectural Ground Grid
    const grid = new THREE.GridHelper(30, 30, 0x10b981, 0x22252a)
    grid.position.y = -0.01
    scene.add(grid)
    gridHelperRef.current = grid

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)
    ambientLightRef.current = ambient

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 2.0)
    dirLight.position.set(12, 18, 10)
    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = 2048
    dirLight.shadow.mapSize.height = 2048
    dirLight.shadow.camera.near = 0.5
    dirLight.shadow.camera.far = 50
    dirLight.shadow.camera.left = -15
    dirLight.shadow.camera.right = 15
    dirLight.shadow.camera.top = 15
    dirLight.shadow.camera.bottom = -15
    dirLight.shadow.bias = -0.0005
    scene.add(dirLight)
    dirLightRef.current = dirLight

    const pointLight = new THREE.PointLight(0xffaa44, 1.5, 10)
    pointLight.position.set(0, 3, 0)
    scene.add(pointLight)
    pointLightRef.current = pointLight

    // Model Container Group
    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    // Load initial model
    loadModel('villa')

    // Animation Loop
    function animate() {
      animFrameId.current = requestAnimationFrame(animate)
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isAutoRotating
        controlsRef.current.autoRotateSpeed = 1.8
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
  }, [])

  // -------------------------------------------------------------
  // 3. Load Model (Procedural or Custom File)
  // -------------------------------------------------------------
  function loadModel(preset: ModelPreset, customObject?: THREE.Object3D) {
    if (!modelGroupRef.current) return
    setIsLoadingModel(true)

    // Clear previous model
    while (modelGroupRef.current.children.length > 0) {
      const obj = modelGroupRef.current.children[0]
      modelGroupRef.current.remove(obj)
    }

    let newMesh: THREE.Object3D | null = null

    if (preset === 'villa') {
      newMesh = createModernVilla()
    } else if (preset === 'pavilion') {
      newMesh = createParametricPavilion()
    } else if (preset === 'tower') {
      newMesh = createSkyscraper()
    } else if (preset === 'interior') {
      newMesh = createInteriorLoft()
    } else if (preset === 'custom' && customObject) {
      newMesh = customObject
    }

    if (newMesh) {
      modelGroupRef.current.add(newMesh)
      applyMaterialMode(materialMode, newMesh)
    }

    setIsLoadingModel(false)
  }

  // Handle Model Preset Selection
  function handleSelectPreset(preset: ModelPreset) {
    setSelectedModel(preset)
    loadModel(preset)
    toast.info(`Loaded ${preset.toUpperCase()} architectural 3D scene`)
  }

  // Handle Custom 3D File Upload (.glb, .gltf, .obj)
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    setIsLoadingModel(true)
    setCustomModelName(file.name)
    setSelectedModel('custom')

    const reader = new FileReader()

    if (ext === 'glb' || ext === 'gltf') {
      reader.onload = (event) => {
        const contents = event.target?.result
        if (!contents) return

        const loader = new GLTFLoader()
        loader.parse(
          contents as ArrayBuffer,
          '',
          (gltf) => {
            const root = gltf.scene

            // Auto-center and fit to bounding box
            const box = new THREE.Box3().setFromObject(root)
            const size = box.getSize(new THREE.Vector3())
            const center = box.getCenter(new THREE.Vector3())

            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = 7 / (maxDim || 1)
            root.scale.setScalar(scale)

            root.position.x = -center.x * scale
            root.position.y = -box.min.y * scale
            root.position.z = -center.z * scale

            root.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true
                child.receiveShadow = true
              }
            })

            loadModel('custom', root)
            toast.success(`Loaded 3D file: ${file.name}`)
          },
          (err) => {
            console.error('Error parsing GLTF:', err)
            toast.error('Failed to parse 3D GLTF/GLB model')
            setIsLoadingModel(false)
          },
        )
      }
      reader.readAsArrayBuffer(file)
    } else if (ext === 'obj') {
      reader.onload = (event) => {
        const contents = event.target?.result
        if (typeof contents !== 'string') return

        const loader = new OBJLoader()
        const root = loader.parse(contents)

        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 7 / (maxDim || 1)
        root.scale.setScalar(scale)
        root.position.x = -center.x * scale
        root.position.y = -box.min.y * scale
        root.position.z = -center.z * scale

        loadModel('custom', root)
        toast.success(`Loaded OBJ 3D Model: ${file.name}`)
      }
      reader.readAsText(file)
    } else {
      toast.error('Unsupported 3D format. Please upload .glb, .gltf, or .obj files.')
      setIsLoadingModel(false)
    }
  }

  // -------------------------------------------------------------
  // 4. Material Modes (Clay, Wireframe, Normal, Gold, PBR)
  // -------------------------------------------------------------
  function applyMaterialMode(mode: MaterialMode, target?: THREE.Object3D) {
    const root = target || modelGroupRef.current
    if (!root) return

    root.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      // Save original material if not stored
      if (!mesh.userData.originalMaterial) {
        mesh.userData.originalMaterial = mesh.material
      }

      if (mode === 'pbr') {
        mesh.material = mesh.userData.originalMaterial
      } else if (mode === 'clay') {
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xf2f2f4,
          roughness: 0.85,
          metalness: 0.05,
        })
      } else if (mode === 'wireframe') {
        mesh.material = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          wireframe: true,
        })
      } else if (mode === 'normal') {
        mesh.material = new THREE.MeshNormalMaterial()
      } else if (mode === 'gold') {
        mesh.material = new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          roughness: 0.25,
          metalness: 0.9,
        })
      }
    })
  }

  useEffect(() => {
    applyMaterialMode(materialMode)
  }, [materialMode])

  // -------------------------------------------------------------
  // 5. Lighting Atmosphere Presets
  // -------------------------------------------------------------
  useEffect(() => {
    if (!dirLightRef.current || !ambientLightRef.current || !sceneRef.current) return

    if (lightingPreset === 'golden') {
      sceneRef.current.background = new THREE.Color(0x110f13)
      ambientLightRef.current.color.setHex(0xffe2c0)
      ambientLightRef.current.intensity = 0.5 * lightIntensity
      dirLightRef.current.color.setHex(0xffaa44)
      dirLightRef.current.intensity = 2.4 * lightIntensity
      dirLightRef.current.position.set(15, 6, 12)
    } else if (lightingPreset === 'daylight') {
      sceneRef.current.background = new THREE.Color(0x0c0d12)
      ambientLightRef.current.color.setHex(0xffffff)
      ambientLightRef.current.intensity = 0.8 * lightIntensity
      dirLightRef.current.color.setHex(0xffffff)
      dirLightRef.current.intensity = 2.0 * lightIntensity
      dirLightRef.current.position.set(10, 20, 10)
    } else if (lightingPreset === 'studio') {
      sceneRef.current.background = new THREE.Color(0x08080a)
      ambientLightRef.current.color.setHex(0xd0e0ff)
      ambientLightRef.current.intensity = 1.0 * lightIntensity
      dirLightRef.current.color.setHex(0xffffff)
      dirLightRef.current.intensity = 1.4 * lightIntensity
      dirLightRef.current.position.set(0, 15, 10)
    } else if (lightingPreset === 'night') {
      sceneRef.current.background = new THREE.Color(0x040406)
      ambientLightRef.current.color.setHex(0x152238)
      ambientLightRef.current.intensity = 0.3 * lightIntensity
      dirLightRef.current.color.setHex(0x4488ff)
      dirLightRef.current.intensity = 1.0 * lightIntensity
      dirLightRef.current.position.set(-10, 10, -10)
    }
  }, [lightingPreset, lightIntensity])

  // Toggle Ground Grid
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid
    }
  }, [showGrid])

  // Camera Presets
  function setCameraView(preset: CameraPreset) {
    if (!cameraRef.current || !controlsRef.current) return

    if (preset === 'perspective') {
      cameraRef.current.position.set(9, 7, 11)
      controlsRef.current.target.set(0, 1.5, 0)
    } else if (preset === 'top') {
      cameraRef.current.position.set(0, 18, 0.01)
      controlsRef.current.target.set(0, 0, 0)
    } else if (preset === 'front') {
      cameraRef.current.position.set(0, 2.5, 14)
      controlsRef.current.target.set(0, 1.5, 0)
    } else if (preset === 'side') {
      cameraRef.current.position.set(14, 2.5, 0)
      controlsRef.current.target.set(0, 1.5, 0)
    } else if (preset === 'isometric') {
      cameraRef.current.position.set(12, 12, 12)
      controlsRef.current.target.set(0, 1.5, 0)
    }
    controlsRef.current.update()
  }

  // -------------------------------------------------------------
  // 6. Viewport Capture -> Send to Exterior or Interior Studio
  // -------------------------------------------------------------
  function captureViewport(): string | null {
    if (!rendererRef.current) return null
    return rendererRef.current.domElement.toDataURL('image/png')
  }

  function handleSendToRender(mode: 'exterior' | 'interior') {
    const dataUrl = captureViewport()
    if (!dataUrl) {
      toast.error('Unable to capture 3D viewport')
      return
    }

    try {
      sessionStorage.setItem('renderly_captured_3d_viewport', dataUrl)
      sessionStorage.setItem('renderly_captured_model_name', customModelName || selectedModel)
      toast.success('3D Angle Captured! Transferring to Render Studio...')
      navigate(`/app/${mode}`)
    } catch {
      toast.error('Capture exceeded storage buffer size')
    }
  }

  function handleDownloadSnapshot() {
    const dataUrl = captureViewport()
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `renderly-3d-${selectedModel}-viewport.png`
    link.href = dataUrl
    link.click()
    toast.success('Downloaded 3D Viewport Snapshot')
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">3D Studio & Spatial Viewport</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <Sparkles className="size-3" />
              WebGL Core
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">
            Interactive 3D workspace. Upload models (.glb, .gltf, .obj) or explore presets, adjust lighting, and synthesize into photorealistic architectural renders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.obj"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white hover:bg-white/10 shadow-sm"
          >
            <Upload className="size-3.5" />
            <span>Upload 3D Model</span>
          </button>

          <button
            onClick={handleDownloadSnapshot}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
            title="Download PNG snapshot"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Save Image</span>
          </button>

          <button
            onClick={() => handleSendToRender('exterior')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:from-emerald-400 hover:to-teal-500"
          >
            <Building2 className="size-3.5" />
            <span>Render Exterior</span>
          </button>

          <button
            onClick={() => handleSendToRender('interior')}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:from-amber-400 hover:to-orange-500"
          >
            <Sofa className="size-3.5" />
            <span>Render Interior</span>
          </button>
        </div>
      </div>

      {/* Main 3D Viewport & Tooling Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* 3D Viewport Canvas Container */}
        <div
          className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#08080a] shadow-2xl transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[620px] lg:col-span-3'
          }`}
        >
          {/* WebGL Canvas */}
          <div ref={containerRef} className="size-full cursor-grab active:cursor-grabbing" />

          {/* Loading Indicator */}
          {isLoadingModel && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/80 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
                <RotateCw className="size-4 animate-spin text-emerald-400" />
                <span>Generating architectural geometry...</span>
              </div>
            </div>
          )}

          {/* Top Left Floating HUD: Camera Presets */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-white/10 bg-black/70 p-1.5 backdrop-blur-md">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Camera:
            </span>
            {[
              { id: 'perspective', label: '3/4 Angle' },
              { id: 'top', label: 'Top (Plan)' },
              { id: 'front', label: 'Front' },
              { id: 'side', label: 'Side' },
              { id: 'isometric', label: 'Isometric' },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => setCameraView(cam.id as any)}
                className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Top Right Floating HUD: Quick Viewport Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5">
            <button
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-colors ${
                isAutoRotating
                  ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-400'
                  : 'border-white/10 bg-black/70 text-neutral-300 hover:text-white'
              }`}
            >
              <RotateCw className={`size-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} />
              <span>Turntable</span>
            </button>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`rounded-xl border p-2 text-xs backdrop-blur-md ${
                showGrid
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/10 bg-black/70 text-neutral-400 hover:text-white'
              }`}
              title="Toggle Grid Ground"
            >
              <Grid className="size-3.5" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl border border-white/10 bg-black/70 p-2 text-xs text-neutral-300 backdrop-blur-md hover:text-white"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
          </div>

          {/* Bottom Left Controls Guide */}
          <div className="absolute bottom-4 left-4 hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-black/70 px-3.5 py-1.5 text-[11px] text-neutral-400 backdrop-blur-md">
            <Compass className="size-3.5 text-emerald-400" />
            <span>Orbit: Left Click · Pan: Right Click · Zoom: Wheel</span>
          </div>

          {/* Current Model Tag */}
          <div className="absolute bottom-4 right-4 rounded-xl border border-white/10 bg-black/70 px-3 py-1.5 text-[11px] font-mono text-neutral-300 backdrop-blur-md">
            Model: <span className="text-emerald-400 font-semibold">{customModelName || selectedModel.toUpperCase()}</span>
          </div>
        </div>

        {/* Right Sidebar: 3D Control Center */}
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl">
          {/* Section 1: Architectural 3D Scene Selector */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                1. Architectural Scene
              </label>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">Choose a procedural model or load your own:</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { id: 'villa', label: 'Modern Villa', desc: 'Cantilever & Pool' },
                { id: 'pavilion', label: 'Parametric', desc: 'Curved Canopy' },
                { id: 'tower', label: 'Skyscraper', desc: 'Glass Curtain Wall' },
                { id: 'interior', label: 'Loft Interior', desc: 'Open Living Space' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectPreset(m.id as any)}
                  className={`flex flex-col rounded-xl border p-2.5 text-left transition-all ${
                    selectedModel === m.id
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-white'
                      : 'border-white/10 bg-black/30 text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                  }`}
                >
                  <span className="text-xs font-semibold">{m.label}</span>
                  <span className="text-[10px] text-neutral-400">{m.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom File Button */}
            <div className="mt-2.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-medium transition-all ${
                  selectedModel === 'custom'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-dashed border-white/15 bg-black/20 text-neutral-400 hover:border-emerald-500/30 hover:text-white'
                }`}
              >
                <Upload className="size-3.5" />
                <span className="truncate max-w-[200px]">
                  {customModelName ? `Custom: ${customModelName}` : 'Load Custom .glb / .obj'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Material & Shading Mode */}
          <div className="border-t border-white/5 pt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              2. Material Shader
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {[
                { id: 'pbr', label: 'PBR Realistic' },
                { id: 'clay', label: 'Architectural Clay' },
                { id: 'wireframe', label: 'Blueprint Wireframe' },
                { id: 'gold', label: 'Showroom Gold' },
              ].map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setMaterialMode(mat.id as any)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    materialMode === mat.id
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-black/30 text-neutral-400 hover:text-white'
                  }`}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Atmosphere & Lighting */}
          <div className="border-t border-white/5 pt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              3. Lighting Atmosphere
            </label>
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {[
                { id: 'golden', label: 'Golden Hour' },
                { id: 'daylight', label: 'Noon Daylight' },
                { id: 'studio', label: 'Studio Diffuse' },
                { id: 'night', label: 'Dusk / Night' },
              ].map((light) => (
                <button
                  key={light.id}
                  onClick={() => setLightingPreset(light.id as any)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    lightingPreset === light.id
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-white/10 bg-black/30 text-neutral-400 hover:text-white'
                  }`}
                >
                  {light.label}
                </button>
              ))}
            </div>

            {/* Sun Intensity Slider */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] text-neutral-400">
                <span>Light Intensity</span>
                <span className="font-mono text-white">{lightIntensity.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.1"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-amber-500"
              />
            </div>
          </div>

          {/* Section 4: Camera Field of View (FOV) */}
          <div className="border-t border-white/5 pt-4">
            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-neutral-300">
              <span>Field of View (FOV)</span>
              <span className="font-mono text-emerald-400">{fov}°</span>
            </div>
            <input
              type="range"
              min="25"
              max="75"
              step="1"
              value={fov}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setFov(val)
                if (cameraRef.current) {
                  cameraRef.current.fov = val
                  cameraRef.current.updateProjectionMatrix()
                }
              }}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-neutral-400">
              <span>Telephoto (25°)</span>
              <span>Ultra-wide (75°)</span>
            </div>
          </div>

          {/* Quick Render Dispatch Info */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <Sparkles className="size-4" />
              <span>Synthesis Pipeline Ready</span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Adjust your 3D building angle, then click <strong>"Render Exterior"</strong> or <strong>"Render Interior"</strong> to synthesize a photorealistic architectural visualization.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

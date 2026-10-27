import {
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  Info,
  Layers,
  MapPin,
  Palette,
  Shield,
  Sparkles,
  Sun,
  UploadCloud,
  Users,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  BOUNDARY_WALL_OPTIONS,
  CAMERA_ANGLES,
  CAMERA_BODIES,
  CAMERA_LENSES,
  CINEMATIC_SCHOOLS,
  EXTERIOR_ARCHITECTURAL_STYLES,
  EXTERIOR_BUILDING_TYPES,
  EXTERIOR_PRIMARY_MOODS,
  EXTERIOR_TIMES_OF_DAY,
  HUMAN_PRESENCE_OPTIONS,
  INTERIOR_ACCENT_MATERIALS,
  INTERIOR_CAMERA_HEIGHTS,
  INTERIOR_FLOORING_MATERIALS,
  INTERIOR_LIGHTING_MOODS,
  INTERIOR_PERSPECTIVE_TYPES,
  INTERIOR_ROOM_TYPES,
  INTERIOR_WALL_MATERIALS,
  PROMPT_STYLES,
  SEASONS,
  STORYBOARD_SHOTS,
  VEHICLE_OPTIONS,
  WEATHER_CONDITIONS,
} from '@/lib/rendering-config'
import { cn } from '@/lib/utils'
import { toast } from '@/stores/toast-store'
import type { ExteriorRenderingSettings, InteriorRenderingSettings, RenderCategory } from '@/types'

interface RenderingOptionsPanelProps {
  mode: RenderCategory
  uploadedImage: string | null
  onUploadedImageSelect: (file: File) => void
  onUploadedImageClear: () => void
  exteriorSettings: ExteriorRenderingSettings
  onUpdateExterior: (settings: Partial<ExteriorRenderingSettings>) => void
  interiorSettings: InteriorRenderingSettings
  onUpdateInterior: (settings: Partial<InteriorRenderingSettings>) => void
  locationImage: string | null
  onLocationImageSelect: (file: File) => void
  onLocationImageClear: () => void
  livePrompt: string
}

export function RenderingOptionsPanel({
  mode,
  uploadedImage,
  onUploadedImageSelect,
  onUploadedImageClear,
  exteriorSettings,
  onUpdateExterior,
  interiorSettings,
  onUpdateInterior,
  locationImage,
  onLocationImageSelect,
  onLocationImageClear,
  livePrompt,
}: RenderingOptionsPanelProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    siteRef: false,
    buildingStyle: false,
    locationRegion: false,
    environmentAtmosphere: false,
    lifestyleVehicles: false,
    cameraStoryboard: false,
    specialInstructions: false,
    interiorRoom: false,
    interiorMaterials: false,
    interiorLighting: false,
    interiorCamera: false,
    interiorInstructions: false,
    promptPreview: false,
  })

  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const primaryFileInputRef = useRef<HTMLInputElement>(null)
  const locationFileInputRef = useRef<HTMLInputElement>(null)
  const [isDraggingPrimary, setIsDraggingPrimary] = useState(false)
  const [isDraggingLocation, setIsDraggingLocation] = useState(false)

  function toggleSection(sectionKey: string) {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  function handleCopyPrompt() {
    if (!livePrompt) return
    navigator.clipboard.writeText(livePrompt)
    setCopiedPrompt(true)
    toast.success('Structured prompt copied to clipboard!')
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  function toggleStoryboardShot(shotTitle: string) {
    const current = exteriorSettings.storyboardShots || []
    if (current.includes(shotTitle)) {
      onUpdateExterior({ storyboardShots: current.filter((s) => s !== shotTitle) })
    } else {
      onUpdateExterior({ storyboardShots: [...current, shotTitle] })
    }
  }

  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* ============================================================== */}
      {/* EXTERIOR RENDERING WORKFLOW (exterior.txt) */}
      {/* ============================================================== */}
      {mode === 'exterior' && (
        <>
          {/* Section 1: Reference Images & Environmental Site Notes */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('siteRef')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Compass className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    1. Reference Images (Structural & Location)
                  </h4>
                  <p className="text-xs text-muted">
                    Structural image locks building architecture; optional location image guides surroundings
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                {uploadedImage && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Structural Image Attached
                  </span>
                )}
                {locationImage && (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
                    Location Image Attached
                  </span>
                )}
                {collapsedSections.siteRef ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.siteRef && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Structural Reference Image */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Structural Reference Image</span>
                        <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase">
                          Primary
                        </span>
                      </span>
                      <span className="text-[11px] font-normal text-muted">Preserves 100% massing & openings</span>
                    </label>

                    <input
                      ref={primaryFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onUploadedImageSelect(e.target.files[0])
                        }
                      }}
                    />

                    {!uploadedImage ? (
                      <div
                        onClick={() => primaryFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDraggingPrimary(true)
                        }}
                        onDragLeave={() => setIsDraggingPrimary(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDraggingPrimary(false)
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            onUploadedImageSelect(e.dataTransfer.files[0])
                          }
                        }}
                        className={cn(
                          'group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                          isDraggingPrimary
                            ? 'border-accent bg-accent/15 scale-[0.99]'
                            : 'border-border/80 bg-background/40 hover:border-accent/60 hover:bg-background/80',
                        )}
                      >
                        <UploadCloud className="size-6 text-accent group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-foreground">
                          Upload Structural Building Image
                        </span>
                        <span className="text-[10px] text-muted max-w-xs">
                          3D model screenshot, SketchUp/Revit export, or massing photo (PNG, JPG, WebP)
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                        <img
                          src={uploadedImage}
                          alt="Structural Reference"
                          className="size-16 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div className="flex flex-1 flex-col justify-between overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate">
                            Structural Architecture Locked
                          </p>
                          <span className="text-[11px] text-emerald-400 font-medium">
                            1:1 geometry & silhouette retention
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => primaryFileInputRef.current?.click()}
                              className="text-[11px] text-accent hover:underline font-medium"
                            >
                              Replace
                            </button>
                            <span className="text-muted text-[10px]">·</span>
                            <button
                              type="button"
                              onClick={onUploadedImageClear}
                              className="text-[11px] text-red-400 hover:underline font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Location Reference Image */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>Location Reference Image</span>
                        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-normal text-muted">
                          Optional
                        </span>
                      </span>
                      <span className="text-[11px] font-normal text-muted">Guides climate & landscape</span>
                    </label>

                    <input
                      ref={locationFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onLocationImageSelect(e.target.files[0])
                        }
                      }}
                    />

                    {!locationImage ? (
                      <div
                        onClick={() => locationFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDraggingLocation(true)
                        }}
                        onDragLeave={() => setIsDraggingLocation(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDraggingLocation(false)
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            onLocationImageSelect(e.dataTransfer.files[0])
                          }
                        }}
                        className={cn(
                          'group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center cursor-pointer transition-all',
                          isDraggingLocation
                            ? 'border-accent bg-accent/15 scale-[0.99]'
                            : 'border-border/80 bg-background/40 hover:border-accent/60 hover:bg-background/80',
                        )}
                      >
                        <UploadCloud className="size-6 text-muted group-hover:text-accent transition-colors" />
                        <span className="text-xs font-medium text-foreground">
                          Upload Site / Neighborhood Photo
                        </span>
                        <span className="text-[10px] text-muted max-w-xs">
                          Informs environment, road texture & vegetation without altering building design
                        </span>
                      </div>
                    ) : (
                      <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                        <img
                          src={locationImage}
                          alt="Location Reference"
                          className="size-16 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div className="flex flex-1 flex-col justify-between overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate">
                            Environmental Context Active
                          </p>
                          <span className="text-[11px] text-accent font-medium">
                            Guides surrounding site & atmosphere
                          </span>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => locationFileInputRef.current?.click()}
                              className="text-[11px] text-accent hover:underline font-medium"
                            >
                              Replace
                            </button>
                            <span className="text-muted text-[10px]">·</span>
                            <button
                              type="button"
                              onClick={onLocationImageClear}
                              className="text-[11px] text-red-400 hover:underline font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Structural Notes & Location Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Structural Notes <span className="font-normal text-muted">(Massing, Facade, Roof, Proportions)</span>
                    </label>
                    <input
                      type="text"
                      value={exteriorSettings.structuralNotes || ''}
                      onChange={(e) => onUpdateExterior({ structuralNotes: e.target.value })}
                      placeholder="e.g. 2-story massing, flat cantilevered roof, floor-to-ceiling glass, teak louvers"
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Location Notes <span className="font-normal text-muted">(Landscape, Road, Climate, Vegetation)</span>
                    </label>
                    <input
                      type="text"
                      value={exteriorSettings.locationNotes || ''}
                      onChange={(e) => onUpdateExterior({ locationNotes: e.target.value })}
                      placeholder="e.g. Wet asphalt road with reflection, lush Kerala coconut palms, tropical lawn"
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Building Type, Architectural Style & Prompt Style */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('buildingStyle')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    2. Building Type & Architectural Style
                  </h4>
                  <p className="text-xs text-muted">
                    Full catalog of 23 building types and regional architectural vernaculars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="text-xs font-medium text-accent">
                  {exteriorSettings.buildingType} · {exteriorSettings.architecturalStyle}
                </span>
                {collapsedSections.buildingStyle ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.buildingStyle && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Building Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Building Type</label>
                    <select
                      value={exteriorSettings.buildingType || 'Modern Villa'}
                      onChange={(e) => onUpdateExterior({ buildingType: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {EXTERIOR_BUILDING_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Architectural Style */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Architectural Style</label>
                    <select
                      value={exteriorSettings.architecturalStyle || 'Tropical Modern'}
                      onChange={(e) => onUpdateExterior({ architecturalStyle: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {EXTERIOR_ARCHITECTURAL_STYLES.map((style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prompt Style (Concise, Detailed, Conceptual, Cinematic) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Prompt Synthesis Style</label>
                    <select
                      value={exteriorSettings.promptStyle || 'Detailed'}
                      onChange={(e) =>
                        onUpdateExterior({
                          promptStyle: e.target.value as 'Concise' | 'Detailed' | 'Conceptual' | 'Cinematic',
                        })
                      }
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {PROMPT_STYLES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label} — {p.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Location and Region */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('locationRegion')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    3. Location & Geographical Region
                  </h4>
                  <p className="text-xs text-muted">
                    Regional climate, local vegetation context, and community tier
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="text-xs font-medium text-foreground/80">
                  {exteriorSettings.countryRegion || 'India – Kerala'}
                </span>
                {collapsedSections.locationRegion ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.locationRegion && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Country / State / Region</label>
                    <input
                      type="text"
                      value={exteriorSettings.countryRegion || ''}
                      onChange={(e) => onUpdateExterior({ countryRegion: e.target.value })}
                      placeholder="e.g. India – Kerala, Dubai – UAE, Bali – Indonesia"
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Area / Premium Community</label>
                    <input
                      type="text"
                      value={exteriorSettings.areaCommunity || ''}
                      onChange={(e) => onUpdateExterior({ areaCommunity: e.target.value })}
                      placeholder="e.g. Waterfront Enclave, Palm Jumeirah, High-Range Estate"
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">District / Exact Place</label>
                    <input
                      type="text"
                      value={exteriorSettings.districtPlace || ''}
                      onChange={(e) => onUpdateExterior({ districtPlace: e.target.value })}
                      placeholder="e.g. Kochi, Wayanad Hills, Trivandrum"
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Mood, Time of Day, Season, Weather & Cinematic School */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('environmentAtmosphere')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Sun className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    4. Mood, Weather, Season & Cinematic Style
                  </h4>
                  <p className="text-xs text-muted">
                    34 aesthetic moods, Lubezki & Deakins cinematographic schools, and weather conditioning
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="text-xs font-medium text-foreground/80">
                  {exteriorSettings.timeOfDay} · {exteriorSettings.weather}
                </span>
                {collapsedSections.environmentAtmosphere ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.environmentAtmosphere && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Time of Day */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Time of Day</label>
                    <select
                      value={exteriorSettings.timeOfDay || 'Golden Hour'}
                      onChange={(e) => onUpdateExterior({ timeOfDay: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {EXTERIOR_TIMES_OF_DAY.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Primary Mood */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Primary Mood</label>
                    <select
                      value={exteriorSettings.primaryMood || 'Ultra Photorealistic'}
                      onChange={(e) => onUpdateExterior({ primaryMood: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {EXTERIOR_PRIMARY_MOODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cinematic School */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Cinematic School</label>
                    <select
                      value={exteriorSettings.cinematicSchool || 'None'}
                      onChange={(e) => onUpdateExterior({ cinematicSchool: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {CINEMATIC_SCHOOLS.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Season */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Season</label>
                    <select
                      value={exteriorSettings.season || 'All Season / Dry'}
                      onChange={(e) => onUpdateExterior({ season: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {SEASONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Weather */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Weather Condition</label>
                    <select
                      value={exteriorSettings.weather || 'Clear Sky'}
                      onChange={(e) => onUpdateExterior({ weather: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {WEATHER_CONDITIONS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Human Presence, Vehicles & Boundary Wall */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('lifestyleVehicles')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Users className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    5. Human Presence, Vehicles & Boundary Wall
                  </h4>
                  <p className="text-xs text-muted">
                    Only appears when selected; select None to forbid unwanted figures or cars
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="text-xs font-medium text-foreground/80">
                  {exteriorSettings.humanPresence !== 'None' ? exteriorSettings.humanPresence : 'No People'} ·{' '}
                  {exteriorSettings.vehicles !== 'None' ? exteriorSettings.vehicles : 'No Cars'}
                </span>
                {collapsedSections.lifestyleVehicles ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.lifestyleVehicles && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Human Presence */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Human Scale & Presence</label>
                    <select
                      value={exteriorSettings.humanPresence || 'None'}
                      onChange={(e) => onUpdateExterior({ humanPresence: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {HUMAN_PRESENCE_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vehicles */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Parked / Passing Vehicle</label>
                    <select
                      value={exteriorSettings.vehicles || 'None'}
                      onChange={(e) => onUpdateExterior({ vehicles: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {VEHICLE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Boundary Wall */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Boundary Wall Treatment</label>
                    <select
                      value={exteriorSettings.boundaryWall || 'Auto'}
                      onChange={(e) => onUpdateExterior({ boundaryWall: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {BOUNDARY_WALL_OPTIONS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Camera, Optics & Creative Storyboard Shots */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('cameraStoryboard')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Camera className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    6. Camera Bodies, Lenses & 15 Storyboard Shots
                  </h4>
                  <p className="text-xs text-muted">
                    Hasselblad & Phase One metadata optics + 15 creative architectural angles
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                  {(exteriorSettings.storyboardShots || []).length} Shots Active
                </span>
                {collapsedSections.cameraStoryboard ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.cameraStoryboard && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                {/* Camera Equipment Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Camera Body Metadata</label>
                    <select
                      value={exteriorSettings.cameraBody || 'Hasselblad X2D 100C'}
                      onChange={(e) => onUpdateExterior({ cameraBody: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {CAMERA_BODIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Focal Lens Profile</label>
                    <select
                      value={exteriorSettings.cameraLens || '35mm Wide'}
                      onChange={(e) => onUpdateExterior({ cameraLens: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {CAMERA_LENSES.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Main Camera Angle</label>
                    <select
                      value={exteriorSettings.cameraAngle || 'Eye Level'}
                      onChange={(e) => onUpdateExterior({ cameraAngle: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {CAMERA_ANGLES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-accent/5 p-2.5 text-[11px] text-muted border border-accent/20">
                  <Info className="size-4 text-accent shrink-0" />
                  <span>
                    Camera body and lens selections guide photographic optics and color grade metadata. The 3D model geometry remains 100% locked.
                  </span>
                </div>

                {/* 15 Creative Storyboard Shots */}
                <div className="flex flex-col gap-2 pt-1">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Creative Storyboard Shots (exterior.txt)</span>
                    <span className="text-[11px] font-normal text-muted">Select shot framing style</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {STORYBOARD_SHOTS.map((shot) => {
                      const isSelected = (exteriorSettings.storyboardShots || []).some(
                        (s) => s.includes(shot.code) || s === `${shot.code} — ${shot.title}`,
                      )
                      return (
                        <button
                          key={shot.id}
                          type="button"
                          onClick={() => toggleStoryboardShot(`${shot.code} — ${shot.title}`)}
                          className={cn(
                            'group flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all',
                            isSelected
                              ? 'border-accent bg-accent/15 ring-1 ring-accent'
                              : 'border-border bg-background/50 hover:border-border-strong hover:bg-background',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 grid size-5 shrink-0 place-items-center rounded border text-[10px] font-bold',
                              isSelected
                                ? 'border-accent bg-accent text-white'
                                : 'border-border text-muted group-hover:border-accent/60',
                            )}
                          >
                            {isSelected ? <Check className="size-3" /> : shot.code.replace('SHOT ', '')}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {shot.code} — {shot.title}
                            </span>
                            <span className="text-[10px] text-muted line-clamp-1">
                              {shot.description}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Special Architectural Instructions (Locked 100%) */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('specialInstructions')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    7. Special Architectural Instructions
                  </h4>
                  <p className="text-xs text-muted">
                    Guarantees 100% locked geometry, materials, roofline, openings, and road positions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  Locked 100%
                </span>
                {collapsedSections.specialInstructions ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.specialInstructions && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={exteriorSettings.specialInstructions || ''}
                  onChange={(e) => onUpdateExterior({ specialInstructions: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  placeholder="Keep architecture 100% locked. Do not change geometry, materials, roofline, openings, facade design, road, footpath, or landscape position."
                />
                <span className="text-[10px] text-muted">
                  Default: "Keep architecture 100% locked. Do not change geometry, materials, roofline, openings, facade design, road, footpath, or landscape position."
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* INTERIOR RENDERING WORKFLOW (interior.txt) */}
      {/* ============================================================== */}
      {mode === 'interior' && (
        <>
          {/* Section 1: Room Reference Image & CAD Artifact Removal */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('interiorRoom')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    1. Room Reference Image & CAD Artifact Removal
                  </h4>
                  <p className="text-xs text-muted">
                    Upload room blockout or photo; cleanup raw SketchUp black viewport outlines
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                {uploadedImage && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Room Image Attached
                  </span>
                )}
                <span className="text-xs font-medium text-accent">
                  {interiorSettings.roomType}
                </span>
                {collapsedSections.interiorRoom ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.interiorRoom && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                {/* Primary Interior Room Reference Image */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Interior Room Reference Image</span>
                      <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold text-accent uppercase">
                        Primary
                      </span>
                    </span>
                    <span className="text-[11px] font-normal text-muted">Preserves room geometry, walls, and ceiling height</span>
                  </label>

                  {!uploadedImage ? (
                    <div
                      onClick={() => primaryFileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingPrimary(true)
                      }}
                      onDragLeave={() => setIsDraggingPrimary(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingPrimary(false)
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          onUploadedImageSelect(e.dataTransfer.files[0])
                        }
                      }}
                      className={cn(
                        'group flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                        isDraggingPrimary
                          ? 'border-accent bg-accent/15 scale-[0.99]'
                          : 'border-border/80 bg-background/40 hover:border-accent/60 hover:bg-background/80',
                      )}
                    >
                      <UploadCloud className="size-6 text-accent group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-foreground">
                        Upload Interior Room Viewport / Photo
                      </span>
                      <span className="text-[10px] text-muted max-w-sm">
                        SketchUp room blockout, white clay model, or existing interior room photo (PNG, JPG, WebP)
                      </span>
                    </div>
                  ) : (
                    <div className="relative flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                      <img
                        src={uploadedImage}
                        alt="Interior Room Reference"
                        className="size-16 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="flex flex-1 flex-col justify-between overflow-hidden">
                        <p className="text-xs font-semibold text-foreground truncate">
                          Interior Room Reference Locked
                        </p>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          1:1 room geometry, wall boundaries & perspective locked
                        </span>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => primaryFileInputRef.current?.click()}
                            className="text-[11px] text-accent hover:underline font-medium"
                          >
                            Replace
                          </button>
                          <span className="text-muted text-[10px]">·</span>
                          <button
                            type="button"
                            onClick={onUploadedImageClear}
                            className="text-[11px] text-red-400 hover:underline font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Interior Space Type</label>
                    <select
                      value={interiorSettings.roomType || 'Living Room & Salon'}
                      onChange={(e) => onUpdateInterior({ roomType: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {INTERIOR_ROOM_TYPES.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-3 sm:pt-5">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={interiorSettings.removeSketchupOutlines !== false}
                        onChange={(e) => onUpdateInterior({ removeSketchupOutlines: e.target.checked })}
                        className="size-4 rounded border-border bg-background text-accent accent-accent"
                      />
                      <span>Eliminate SketchUp / CAD Wireframe Black Viewport Lines</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Material Realism (Flooring, Walls, Accents) */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('interiorMaterials')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Palette className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    2. Interior Material Realism & Textures
                  </h4>
                  <p className="text-xs text-muted">
                    PBR flooring, lime-wash / fluted wall treatments, and architectural hardware
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                {collapsedSections.interiorMaterials ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.interiorMaterials && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Flooring Material */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Flooring Finish</label>
                    <select
                      value={interiorSettings.flooringMaterial || 'Original Model Flooring'}
                      onChange={(e) => onUpdateInterior({ flooringMaterial: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {INTERIOR_FLOORING_MATERIALS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Wall Material */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Wall Treatment</label>
                    <select
                      value={interiorSettings.wallMaterial || 'Original Model Wall Finishes'}
                      onChange={(e) => onUpdateInterior({ wallMaterial: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {INTERIOR_WALL_MATERIALS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Accent Materials */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Hardware & Accents</label>
                    <select
                      value={interiorSettings.accentMaterial || 'Brushed Warm Brass / Bronze'}
                      onChange={(e) => onUpdateInterior({ accentMaterial: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {INTERIOR_ACCENT_MATERIALS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Lighting & Global Illumination */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('interiorLighting')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Sun className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    3. Indoor Illumination & Global Light Bounce
                  </h4>
                  <p className="text-xs text-muted">
                    Indirect light bounce, soft penumbra falloff, and natural ambient occlusion
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <span className="text-xs font-medium text-foreground/80">
                  {interiorSettings.lightingMood}
                </span>
                {collapsedSections.interiorLighting ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.interiorLighting && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Lighting Atmosphere Profile</label>
                  <select
                    value={interiorSettings.lightingMood || 'Soft Natural Daylight'}
                    onChange={(e) => onUpdateInterior({ lightingMood: e.target.value })}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                  >
                    {INTERIOR_LIGHTING_MOODS.map((light) => (
                      <option key={light} value={light}>
                        {light}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Camera Height & Spatial Composition */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('interiorCamera')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Camera className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    4. Camera Height & Spatial Perspective
                  </h4>
                  <p className="text-xs text-muted">
                    Preserves original crop, viewpoint height, and two-point vertical architectural alignment
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                {collapsedSections.interiorCamera ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.interiorCamera && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Camera Height</label>
                    <select
                      value={interiorSettings.cameraHeight || 'Eye Level (approx 1.5m / 5ft)'}
                      onChange={(e) => onUpdateInterior({ cameraHeight: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {INTERIOR_CAMERA_HEIGHTS.map((ch) => (
                        <option key={ch} value={ch}>
                          {ch}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-foreground">Perspective Alignment</label>
                    <select
                      value={interiorSettings.perspectiveType || 'Preserve Original Viewpoint'}
                      onChange={(e) => onUpdateInterior({ perspectiveType: e.target.value })}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none"
                    >
                      {INTERIOR_PERSPECTIVE_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {pt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Special Interior Instructions */}
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/50 backdrop-blur-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('interiorInstructions')}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-8 place-items-center rounded-lg bg-accent/15 text-accent">
                  <Shield className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    5. Special Architectural Room Constraints
                  </h4>
                  <p className="text-xs text-muted">
                    Locks room geometry, walls, and ceiling height without hardcoded presets
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted">
                {collapsedSections.interiorInstructions ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </div>
            </button>

            {!collapsedSections.interiorInstructions && (
              <div className="border-t border-border/50 p-4 pt-3 flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={interiorSettings.specialInstructions || ''}
                  onChange={(e) => onUpdateInterior({ specialInstructions: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
                  placeholder="Preserve room geometry, wall boundaries, ceiling height, and window/door openings 100% locked. Enhance materials and lighting with physically plausible realism."
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* LIVE ARCHITECTURAL PROMPT PREVIEW (Connected to AI Generator) */}
      {/* ============================================================== */}
      <div className="overflow-hidden rounded-2xl border border-accent/40 bg-accent/[0.04] backdrop-blur-md transition-all shadow-sm">
        <div className="flex items-center justify-between p-3.5 px-4 bg-accent/10 border-b border-accent/20">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-4 text-accent" />
            <span className="text-xs font-semibold text-foreground">
              Live Architectural AI Prompt Preview
            </span>
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
              Active Parameters Connected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyPrompt}
              className="h-7 px-2.5 text-xs text-muted hover:text-foreground"
            >
              {copiedPrompt ? (
                <>
                  <Check className="size-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy</span>
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => toggleSection('promptPreview')}
              className="text-muted hover:text-foreground"
            >
              {collapsedSections.promptPreview ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronUp className="size-4" />
              )}
            </button>
          </div>
        </div>

        {!collapsedSections.promptPreview && (
          <div className="p-4 flex flex-col gap-2">
            <p className="text-xs text-foreground/90 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-border/50 whitespace-pre-wrap select-all max-h-36 overflow-y-auto">
              {livePrompt}
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted pt-1">
              <span>
                {mode === 'exterior'
                  ? 'Combines building type, regional style, weather, optics & structural lock'
                  : 'Combines room geometry preservation, PBR materials, global bounce & CAD outline cleanup'}
              </span>
              <span className="text-accent font-medium">Auto-formatted for AI Engine</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

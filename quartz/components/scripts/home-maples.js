import {
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  Object3D,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three"

// One triangular paper facet per outline edge. Alternating mountain and valley
// folds radiate from the base of the five lobes; the stem is a folded sliver.
const hub = [0, -0.36, 0.13]
const rightEdge = [
  [0.09, -0.52, 0.02],
  [0.56, -0.45, -0.04],
  [0.49, -0.22, 0.03],
  [1.02, 0.04, 0.25],
  [0.55, 0.13, -0.07],
  [0.89, 0.69, 0.3],
  [0.54, 0.58, 0.04],
  [0.34, 0.36, -0.08],
  [0.27, 0.78, 0.04],
  [0.165, 0.67, -0.025],
]
const tip = [0, 1.13, 0.32]
const outline = [...rightEdge, tip, ...rightEdge.map(([x, y, z]) => [-x, y, z]).reverse()]
const stemTip = [0.06, -0.94, 0.06]
const contacts = [...outline, hub, stemTip]
const shadowHalfSize = 64 / 48
const shadowCorners = [
  [-shadowHalfSize, -shadowHalfSize, 0],
  [shadowHalfSize, -shadowHalfSize, 0],
  [-shadowHalfSize, shadowHalfSize, 0],
  [shadowHalfSize, shadowHalfSize, 0],
]
const lightColors = [0xb84e36, 0xc87b3d, 0xbf994e, 0xaa494b, 0xb3663b]
const darkColors = [0xce6749, 0xd68d50, 0xc3a263, 0xb75954, 0xbb8053]
const groundTilt = (26 * Math.PI) / 180

function makeMaple() {
  const positions = []
  for (let i = 0; i < outline.length; i++) {
    positions.push(...hub, ...outline[i], ...outline[(i + 1) % outline.length])
  }
  const left = [-0.036, -0.515, 0.029]
  const right = [0.036, -0.515, 0.029]
  positions.push(...left, ...stemTip, ...right, ...left, ...right, ...hub)
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function makeShadow(outline) {
  const image = document.createElement("canvas")
  image.width = image.height = 128
  const ctx = image.getContext("2d")
  ctx.filter = "blur(3px)"
  ctx.fillStyle = "white"
  ctx.beginPath()
  for (const [x, y] of outline) ctx.lineTo(64 + x * 48, 64 - y * 48)
  ctx.closePath()
  ctx.fill()
  return new CanvasTexture(image)
}

// Ground positions are fractions of the viewport, with the reading area left clear.
const scatter = [
  [0.12, 0.13, 21, -0.8],
  [0.51, 0.105, 16, 1.1],
  [0.8, 0.22, 41, -0.55],
  [0.93, 0.39, 20, 2.8],
  [0.67, 0.44, 26, 0.65],
  [0.86, 0.66, 57, 1.1],
  [0.7, 0.84, 34, -1.25],
  [0.49, 0.92, 19, 1.5],
  [0.14, 0.84, 26, -2.5],
  [0.29, 0.22, 16, 0.25],
  [0.74, 0.72, 20, -2.8],
  [0.32, 0.78, 17, 1.9],
]
const flights = [
  { from: [0.26, -0.1], to: [0.39, 0.2], size: 29, duration: 7.2, phase: 0.41 },
  { from: [1.06, 0.12], to: [0.78, 0.53], compactY: 0.28, size: 37, duration: 8.4, phase: 0.78 },
  { from: [0.68, -0.08], to: [0.6, 0.25], size: 21, duration: 9.1, phase: 0.57 },
  { from: [0.46, 1.08], to: [0.59, 0.74], size: 23, duration: 6.1, phase: 0.18 },
]

export function mountMaples(canvas) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  })
  renderer.setClearColor(0, 0)
  const scene = new Scene()
  const camera = new PerspectiveCamera(42, 1, 1, 2000)
  const viewNormal = new Vector3()
  const groundPlane = new Plane(new Vector3(0, 0, 1), 0)
  const raycaster = new Raycaster()
  const ndc = new Vector2()
  const projected = new Vector3()
  const groundHit = new Vector3()

  // Layout anchors use viewport fractions from the top left. Physics and
  // shadows stay in ground coordinates, with z measuring height above it.
  function groundAt(u, v, out) {
    ndc.set(2 * u - 1, 1 - 2 * v)
    raycaster.setFromCamera(ndc, camera)
    return raycaster.ray.intersectPlane(groundPlane, out)
  }
  const sunlight = new DirectionalLight(0xfff1de, 1.65)
  sunlight.position.set(-0.55, 0.7, 1)
  scene.add(sunlight, new AmbientLight(0xfff4e4, 1.48))
  const shadowTexture = makeShadow(outline)
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
  let width = 1,
    height = 1,
    sizeScale = 1
  let frame = 0,
    lastTick = 0,
    wakeTimer = 0
  let disposed = false

  // The canopy photograph encodes shadow as dark gray. Fade its margins in
  // ground space so the outline stays soft through perspective and resizing.
  const canopyMaterial = new ShaderMaterial({
    uniforms: {
      mask: { value: null },
      ink: { value: new Color() },
      strength: { value: 0 },
    },
    vertexShader: `
      varying vec2 groundUv;
      void main() {
        groundUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D mask;
      uniform vec3 ink;
      uniform float strength;
      varying vec2 groundUv;
      void main() {
        vec2 edge = min(groundUv, 1.0 - groundUv);
        float reach = length((groundUv - vec2(0.83, 0.87)) * vec2(0.94, 1.05));
        float feather = smoothstep(0.0, 0.12, min(edge.x, edge.y))
                      * (1.0 - smoothstep(0.46, 1.0, reach));
        float shade = 1.0 - texture2D(mask, groundUv).g;
        gl_FragColor = vec4(ink, shade * feather * strength);
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
  })
  const canopy = new Mesh(new PlaneGeometry(1, 1), canopyMaterial)
  canopy.renderOrder = -2
  canopy.visible = false
  scene.add(canopy)
  const canopyTexture = new TextureLoader().load(
    new URL("./home-canopy-shadow-b.webp", import.meta.url).href,
    (texture) => {
      if (disposed) return
      canopyMaterial.uniforms.mask.value = texture
      canopy.visible = true
      render()
    },
  )

  // Per-instance RGBA keeps both the paper tint and height-dependent shadows
  // in two draw calls, including while a few leaves are fading out.
  const capacity = scatter.length + flights.length
  function makeBatch(geometry, material) {
    const colors = new InstancedBufferAttribute(new Float32Array(capacity * 4).fill(1), 4)
    colors.setUsage(DynamicDrawUsage)
    geometry.setAttribute("color", colors)
    const batch = new InstancedMesh(geometry, material, capacity)
    batch.instanceMatrix.setUsage(DynamicDrawUsage)
    batch.frustumCulled = false
    scene.add(batch)
    return batch
  }
  const paperBatch = makeBatch(
    makeMaple(),
    new MeshLambertMaterial({
      vertexColors: true,
      flatShading: true,
      side: DoubleSide,
      transparent: true,
      forceSinglePass: true,
      alphaTest: 0.01,
    }),
  )
  const shadows = makeBatch(
    new PlaneGeometry(2 * shadowHalfSize, 2 * shadowHalfSize),
    new MeshBasicMaterial({
      map: shadowTexture,
      vertexColors: true,
      color: 0x493327,
      transparent: true,
      depthWrite: false,
    }),
  )
  shadows.renderOrder = -1
  const shadowPose = new Object3D()
  function makeLeaf(index, size, colorIndex, path = null) {
    const mesh = new Object3D()
    mesh.rotation.order = "ZXY"
    return {
      mesh,
      index,
      size,
      colorIndex,
      path,
      fade: 1,
      seed: 1.3 + index * 2.6,
      age: path ? path.phase * path.duration : 0,
      stage: path ? "fall" : "rest",
      restUntil: Infinity,
      displaced: false,
      vx: 0,
      vy: 0,
      vz: 0,
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      windX: 0,
      windY: 0,
      windLift: 0,
    }
  }
  const ground = scatter.map(([, , size], i) => makeLeaf(i, size, i % lightColors.length))
  const moving = flights.map((path, i) => ({
    ...makeLeaf(ground.length + i, path.size, [1, 0, 2, 3][i], path),
    from: new Vector3(),
    to: new Vector3(),
  }))
  const leaves = [...ground, ...moving]
  const contact = new Vector3()
  const pivotBefore = new Vector3()
  const pivotAfter = new Vector3()
  const surface = canvas.parentElement
  const readingElements = surface.querySelectorAll(
    ".garden-site-logo, .c-welcome > span, .maple-intro p, .maple-entries a, .maple-footer > *",
  )
  let readingRects = []
  const viewProjection = new Matrix4()
  const poseProjection = new Matrix4()

  function measureReadingArea() {
    const bounds = canvas.getBoundingClientRect()
    readingRects = Array.from(readingElements, (element) => {
      const rect = element.getBoundingClientRect()
      return {
        left: rect.left - bounds.left,
        right: rect.right - bounds.left,
        top: rect.top - bounds.top,
        bottom: rect.bottom - bounds.top,
      }
    })
  }

  // Fade the whole silhouette before its nearest edge reaches the text.
  // The ground shadow has a separate footprint while a leaf is airborne.
  function readingOpacity(pose, points) {
    poseProjection.multiplyMatrices(viewProjection, pose.matrix)
    let left = Infinity,
      right = -Infinity,
      top = Infinity,
      bottom = -Infinity
    for (const [x, y, z] of points) {
      projected.set(x, y, z).applyMatrix4(poseProjection)
      const sx = ((projected.x + 1) * width) / 2
      const sy = ((1 - projected.y) * height) / 2
      left = Math.min(left, sx)
      right = Math.max(right, sx)
      top = Math.min(top, sy)
      bottom = Math.max(bottom, sy)
    }
    let closestSquared = Infinity
    for (const rect of readingRects) {
      const dx = Math.max(rect.left - right, left - rect.right, 0)
      const dy = Math.max(rect.top - bottom, top - rect.bottom, 0)
      closestSquared = Math.min(closestSquared, dx * dx + dy * dy)
    }
    return MathUtils.smoothstep(Math.sqrt(closestSquared), 4, 32)
  }

  function lowestPoint(mesh) {
    mesh.updateMatrix()
    const m = mesh.matrix.elements
    let lowest = Infinity
    for (const [x, y, z] of contacts) {
      const elevation = m[2] * x + m[6] * y + m[10] * z
      if (elevation < lowest) {
        lowest = elevation
        contact.set(x, y, z)
      }
    }
    return lowest
  }
  function syncPose(leaf) {
    const { mesh, index, fade } = leaf
    mesh.updateMatrix()
    paperBatch.setMatrixAt(index, mesh.matrix)
    const paperVisibility = readingOpacity(mesh, contacts)
    paperBatch.geometry.attributes.color.setW(index, fade * paperVisibility)
    const lift = Math.max(0, mesh.position.z)
    shadowPose.position.set(mesh.position.x + lift * 0.54, mesh.position.y - lift * 0.68, -0.6)
    shadowPose.rotation.z = mesh.rotation.z
    const size = mesh.scale.x * (1 + lift * 0.0015)
    shadowPose.scale.set(
      size * Math.max(0.36, Math.abs(Math.cos(mesh.rotation.y))),
      size * Math.max(0.34, Math.abs(Math.cos(mesh.rotation.x))),
      1,
    )
    shadowPose.updateMatrix()
    shadows.setMatrixAt(index, shadowPose.matrix)
    const shadowVisibility = Math.min(paperVisibility, readingOpacity(shadowPose, shadowCorners))
    shadows.geometry.attributes.color.setW(
      index,
      (0.26 * fade * shadowVisibility) / (1 + lift * 0.025),
    )
  }
  function setFallPose(leaf) {
    const { mesh, path, seed, age } = leaf
    const t = Math.min(1, age / path.duration)
    const flutter = age * 2.3 + seed
    mesh.position.lerpVectors(leaf.from, leaf.to, t)
    mesh.position.x += Math.sin(flutter * 0.65) * 25 * sizeScale
    mesh.position.y += Math.cos(flutter * 0.67) * 13 * sizeScale
    mesh.position.z = (1 - t) * 170 * sizeScale
    mesh.rotation.set(
      0.72 * Math.sin(flutter),
      0.92 * Math.cos(flutter * 0.79),
      seed + age * 0.37 + 0.42 * Math.sin(flutter * 0.62),
      "ZXY",
    )
  }
  // A sample sets the local air speed. Integrating it in the animation loop
  // keeps the impulse independent of the mouse's event reporting rate.
  let pointer = null
  function clearPointer() {
    pointer = null
  }
  function pointerWind(event) {
    if (event.pointerType !== "mouse" || reduced.matches || document.hidden) return
    const bounds = canvas.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    groundAt(x / bounds.width, y / bounds.height, groundHit)
    const previous = pointer
    pointer = { x, y, gx: groundHit.x, gy: groundHit.y, time: event.timeStamp }
    if (!previous) return
    const elapsed = (event.timeStamp - previous.time) / 1000
    const dx = x - previous.x,
      dy = y - previous.y
    const distance = Math.hypot(dx, dy)
    if (elapsed <= 0 || elapsed > 0.18 || distance < 0.15) return
    const speed = Math.min(1450, distance / elapsed)
    const vx = ((pointer.gx - previous.gx) * speed) / distance
    const vy = ((pointer.gy - previous.gy) * speed) / distance
    let touched = false
    for (const leaf of leaves) {
      if (leaf.stage === "fade") continue
      const p = leaf.mesh.position
      projected.copy(p).project(camera)
      const offsetX = ((projected.x + 1) * bounds.width) / 2 - previous.x
      const offsetY = ((1 - projected.y) * bounds.height) / 2 - previous.y
      // Sweep the segment as well as its endpoint so a quick flick can't skip a leaf.
      const t = Math.max(0, Math.min(1, (offsetX * dx + offsetY * dy) / (distance * distance)))
      const radius = 108 * sizeScale + leaf.mesh.scale.x * 0.4
      const distanceSquared = (offsetX - dx * t) ** 2 + (offsetY - dy * t) ** 2
      if (distanceSquared >= radius * radius) continue
      const weight = (1 - distanceSquared / (radius * radius)) ** 2 / (1 + Math.max(0, p.z) * 0.003)
      if (speed * weight < 3) continue
      // At leaf height the same two pointer rays span a shorter ground-parallel
      // segment. Add lift along the screen normal, toward the viewer.
      const depthScale = 1 - p.z / camera.position.z
      const lift = speed * weight * 1.5
      leaf.windX = vx * depthScale * weight + viewNormal.x * lift
      leaf.windY = vy * depthScale * weight + viewNormal.y * lift
      leaf.windLift = viewNormal.z * lift
      leaf.displaced = true
      leaf.stage = "gust"
      leaf.age = 0
      touched = true
    }
    if (touched) resume()
  }
  function stepGust(leaf, dt) {
    const { mesh } = leaf
    const drag = Math.exp(-2.2 * dt)
    leaf.vx = (leaf.vx + leaf.windX * dt) * drag
    leaf.vy = (leaf.vy + leaf.windY * dt) * drag
    leaf.vz = Math.min(
      135 * sizeScale,
      (leaf.vz + (leaf.windLift - 255 * sizeScale) * dt) * Math.exp(-0.8 * dt),
    )
    // Tilt around the paper's local axes in response to the screen-space gust.
    const c = Math.cos(mesh.rotation.z),
      s = Math.sin(mesh.rotation.z)
    leaf.spinX = (leaf.spinX + (leaf.windY * c - leaf.windX * s) * 0.021 * dt) * drag
    leaf.spinY = (leaf.spinY - (leaf.windX * c + leaf.windY * s) * 0.021 * dt) * drag
    mesh.rotation.x += leaf.spinX * dt
    mesh.rotation.y += leaf.spinY * dt
    mesh.rotation.z += leaf.spinZ * dt
    mesh.position.x += leaf.vx * dt
    mesh.position.y += leaf.vy * dt
    mesh.position.z += leaf.vz * dt
    const decay = Math.exp(-dt / 0.11)
    leaf.windX *= decay
    leaf.windY *= decay
    leaf.windLift *= decay
    const floor = 0.15 - lowestPoint(mesh)
    if (mesh.position.z <= floor && leaf.vz <= 0) {
      mesh.position.z = floor
      leaf.vz = 0
      leaf.stage = "roll"
      leaf.age = 0
    }
  }
  function step(leaf, dt, now) {
    const { mesh } = leaf
    if (leaf.stage === "rest") {
      if (now < leaf.restUntil) return
      leaf.stage = "fade"
      leaf.age = 0
    }
    leaf.age += dt
    if (leaf.stage === "gust") {
      stepGust(leaf, dt)
    } else if (leaf.stage === "fall") {
      const oldX = mesh.position.x,
        oldY = mesh.position.y,
        oldZ = mesh.position.z
      const oldPitch = mesh.rotation.x,
        oldRoll = mesh.rotation.y,
        oldYaw = mesh.rotation.z
      setFallPose(leaf)
      leaf.vx = (mesh.position.x - oldX) / dt
      leaf.vy = (mesh.position.y - oldY) / dt
      leaf.vz = (mesh.position.z - oldZ) / dt
      leaf.spinX = (mesh.rotation.x - oldPitch) / dt
      leaf.spinY = (mesh.rotation.y - oldRoll) / dt
      leaf.spinZ = (mesh.rotation.z - oldYaw) / dt
      const bottom = lowestPoint(mesh)
      if (mesh.position.z + bottom <= 0.15 || leaf.age >= leaf.path.duration) {
        mesh.position.z = 0.15 - bottom
        leaf.vz = 0
        leaf.stage = "roll"
        leaf.age = 0
      }
    } else if (leaf.stage === "roll") {
      // Rock around the touching edge; the spring and ground friction damp the motion.
      lowestPoint(mesh)
      pivotBefore.copy(contact).applyMatrix4(mesh.matrix)
      leaf.spinX += (-19 * mesh.rotation.x - 4.6 * leaf.spinX) * dt
      leaf.spinY += (-19 * mesh.rotation.y - 4.6 * leaf.spinY) * dt
      mesh.rotation.x += leaf.spinX * dt
      mesh.rotation.y += leaf.spinY * dt
      mesh.rotation.z += leaf.spinZ * dt
      mesh.updateMatrix()
      pivotAfter.copy(contact).applyMatrix4(mesh.matrix)
      mesh.position.x += pivotBefore.x - pivotAfter.x + leaf.vx * dt
      mesh.position.y += pivotBefore.y - pivotAfter.y + leaf.vy * dt
      const friction = Math.exp(-3.6 * dt)
      leaf.vx *= friction
      leaf.vy *= friction
      leaf.spinZ *= friction
      mesh.position.z = 0.15 - lowestPoint(mesh)
      if (leaf.age > 2.6) {
        leaf.stage = "rest"
        leaf.vx = leaf.vy = leaf.spinX = leaf.spinY = leaf.spinZ = 0
        leaf.restUntil = leaf.path ? now + 6500 + (leaf.seed % 7) * 760 : Infinity
      }
    } else {
      leaf.fade = Math.max(0, 1 - leaf.age / 1.5)
      if (leaf.fade === 0) {
        leaf.stage = "fall"
        leaf.age = 0
        leaf.seed += 0.65
        leaf.displaced = false
        leaf.fade = 1
        setFallPose(leaf)
      }
    }
    syncPose(leaf)
  }

  function render() {
    paperBatch.instanceMatrix.needsUpdate = true
    paperBatch.geometry.attributes.color.needsUpdate = true
    shadows.instanceMatrix.needsUpdate = true
    shadows.geometry.attributes.color.needsUpdate = true
    renderer.render(scene, camera)
  }
  function pause() {
    cancelAnimationFrame(frame)
    clearTimeout(wakeTimer)
    frame = wakeTimer = lastTick = 0
    clearPointer()
  }
  function resume() {
    if (!disposed && !document.hidden && !reduced.matches && !frame) {
      clearTimeout(wakeTimer)
      frame = requestAnimationFrame(tick)
    }
  }
  function tick(now) {
    frame = 0
    if (!lastTick) lastTick = now
    const elapsed = now - lastTick
    const interval = width <= 680 ? 1000 / 30 : 1000 / 60
    if (elapsed + 0.5 >= interval) {
      lastTick = now
      for (const leaf of leaves) step(leaf, Math.min(elapsed / 1000, 0.05), now)
      render()
      if (leaves.every((leaf) => leaf.stage === "rest")) {
        lastTick = 0
        wakeTimer = window.setTimeout(
          resume,
          Math.max(0, Math.min(...moving.map((leaf) => leaf.restUntil)) - now),
        )
        return
      }
    }
    resume()
  }
  function resize() {
    const oldWidth = width
    const oldCamera = camera.clone()
    width = Math.max(1, canvas.clientWidth)
    height = Math.max(1, canvas.clientHeight)
    sizeScale = Math.min(1.2, Math.max(0.53, Math.min(width / 1150, height / 690)))
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width <= 680 ? 1.25 : 1.5))
    renderer.setSize(width, height, false)
    // Rotating the view about the corner-to-corner diagonal keeps that line
    // fixed. The camera sits on the lower-right side and looks back at center.
    const axis = new Vector3(width, height, 0).normalize()
    camera.quaternion.setFromAxisAngle(axis, groundTilt)
    viewNormal.set(0, 0, 1).applyQuaternion(camera.quaternion)
    const distance = height / (2 * Math.tan((camera.fov * Math.PI) / 360))
    camera.position.set(width / 2, height / 2, 0).addScaledVector(viewNormal, distance)
    camera.aspect = width / height
    camera.far = 4 * distance + 512
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    measureReadingArea()
    groundAt(0.81, 0.15, canopy.position)
    canopy.position.z = -1
    const canopyWidth = Math.min(width * 1.08, height * 1.55)
    canopy.scale.set(canopyWidth, canopyWidth * 0.75, 1)
    for (const leaf of moving) {
      const { path } = leaf
      groundAt(path.from[0], path.from[1], leaf.from)
      groundAt(path.to[0], width <= 680 ? (path.compactY ?? path.to[1]) : path.to[1], leaf.to)
    }
    for (const leaf of leaves) {
      leaf.mesh.scale.setScalar(leaf.size * sizeScale)
      if (!leaf.path && !leaf.displaced) {
        const [u, v, , yaw] = scatter[leaf.index]
        const x = width <= 680 && v > 0.35 && v < 0.6 ? 0.96 : u
        groundAt(x, v, leaf.mesh.position)
        leaf.mesh.rotation.set(0.06 * Math.sin(leaf.index), 0.09 * Math.cos(leaf.index), yaw, "ZXY")
        leaf.mesh.position.z = 0.15 - lowestPoint(leaf.mesh)
      } else if (leaf.stage === "fall") setFallPose(leaf)
      else {
        const p = leaf.mesh.position
        projected.set(p.x, p.y, 0).project(oldCamera)
        const u = (projected.x + 1) / 2
        let v = (1 - projected.y) / 2
        if (!leaf.displaced && leaf.path?.compactY && width <= 680 !== oldWidth <= 680) {
          const offset = leaf.path.compactY - leaf.path.to[1]
          v += width <= 680 ? offset : -offset
        }
        groundAt(u, v, groundHit)
        p.x = groundHit.x
        p.y = groundHit.y
        const floor = 0.15 - lowestPoint(leaf.mesh)
        leaf.mesh.position.z = leaf.stage === "gust" ? Math.max(floor, leaf.mesh.position.z) : floor
      }
      syncPose(leaf)
    }
    render()
    clearPointer()
  }
  function motionChanged() {
    pause()
    paperBatch.count = shadows.count = reduced.matches ? ground.length : leaves.length
    render()
    resume()
  }
  function themeChanged() {
    const dark = document.documentElement.getAttribute("saved-theme") === "dark"
    canopyMaterial.uniforms.ink.value.setHex(dark ? 0x010302 : 0x35443a)
    canopyMaterial.uniforms.strength.value = dark ? 0.8 : 0.32
    const tint = new Color()
    const colors = paperBatch.geometry.attributes.color
    for (const leaf of leaves) {
      tint.set((dark ? darkColors : lightColors)[leaf.colorIndex])
      colors.setXYZ(leaf.index, tint.r, tint.g, tint.b)
    }
    render()
  }
  const visibilityChanged = () => (document.hidden ? pause() : resume())
  const observer = new ResizeObserver((entries) => {
    if (entries.some(({ target }) => target === canvas)) {
      resize()
      return
    }
    measureReadingArea()
    for (const leaf of leaves) syncPose(leaf)
    render()
  })
  observer.observe(canvas)
  for (const element of readingElements) observer.observe(element)
  const theme = new MutationObserver(themeChanged)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["saved-theme"] })
  document.addEventListener("visibilitychange", visibilityChanged)
  surface.addEventListener("pointermove", pointerWind, { passive: true })
  surface.addEventListener("pointerleave", clearPointer)
  window.addEventListener("blur", clearPointer)
  reduced.addEventListener("change", motionChanged)
  resize()
  themeChanged()
  motionChanged()

  return () => {
    disposed = true
    pause()
    observer.disconnect()
    theme.disconnect()
    reduced.removeEventListener("change", motionChanged)
    document.removeEventListener("visibilitychange", visibilityChanged)
    surface.removeEventListener("pointermove", pointerWind)
    surface.removeEventListener("pointerleave", clearPointer)
    window.removeEventListener("blur", clearPointer)
    for (const batch of [paperBatch, shadows]) {
      batch.dispose()
      batch.geometry.dispose()
      batch.material.dispose()
    }
    canopy.geometry.dispose()
    canopyMaterial.dispose()
    canopyTexture.dispose()
    shadowTexture.dispose()
    renderer.dispose()
    renderer.forceContextLoss()
  }
}

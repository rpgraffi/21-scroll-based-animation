import './style.css'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import { BufferGeometry } from 'three'
import gsap from 'gsap'

/**
 * Debug
 */
const gui = new dat.GUI()

const parameters = {
    materialColor: '#ffeded'
}

gui
    .addColor(parameters, 'materialColor')
    .onChange(() => {
        material.color.set(parameters.materialColor)
        particleMaterial.color.set(parameters.materialColor)
    })

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Texture Loader
const textureLoader = new THREE.TextureLoader()
const toonGradientTexture3 = textureLoader.load('/textures/gradients/3.jpg')
const toonGradientTexture5 = textureLoader.load('/textures/gradients/5.jpg')
toonGradientTexture3.magFilter = THREE.NearestFilter
toonGradientTexture5.magFilter = THREE.NearestFilter
// console.log(toonGradientTexture3);

/**
 * Objects
 */
// Constants
const objectsDistance = -5
// Materials
const material = new THREE.MeshToonMaterial({ color: parameters.materialColor, gradientMap: toonGradientTexture3 })
// Meshes
const mesh1 = new THREE.Mesh(
    new THREE.TorusBufferGeometry(1, .4, 16, 60),
    material
)
const mesh2 = new THREE.Mesh(
    new THREE.ConeBufferGeometry(1, 2, 32),
    material
)
const mesh3 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16),
    material
)

mesh1.position.y = objectsDistance * 0
mesh2.position.y = objectsDistance * 1
mesh3.position.y = objectsDistance * 2

mesh1.position.x = 2
mesh2.position.x = -2
mesh3.position.x = 2

scene.add(mesh1, mesh2, mesh3)

const sectionMeshes = [mesh1, mesh2, mesh3]

/**
 * Particles
 */
const particleCount = 200
const positions = new Float32Array(particleCount * 3)

for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    
    const size = 10
    
    // Long version
    // const randomX = Math.random() * size
    // const randomY = Math.random() * size
    // const randomZ = Math.random() * size
    
    // positions[i3 + 0] = randomX
    // positions[i3 + 1] = randomY
    // positions[i3 + 2] = randomZ
    
    // Short Version
    positions[i * 3 + 0] = (Math.random() - .5 ) * size
    positions[i * 3 + 1] = -objectsDistance * .4 - Math.random() * -objectsDistance * sectionMeshes.length
    positions[i * 3 + 2] = (Math.random() - .5 ) * size
    
}

const particlesGeometry = new THREE.BufferGeometry() 
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const particleMaterial = new THREE.PointsMaterial({
    color: '#ffffff',
    sizeAttenuation: true,
    size: .03
})

const particles = new THREE.Points(particlesGeometry, particleMaterial)
scene.add(particles)


/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
directionalLight.position.set(1, 1, 0)

scene.add(directionalLight)


/**
 * Sizes
 */
 var body = document.body,
 html = document.documentElement;
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,

    wholeHeight: Math.max( body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight )
}

console.log(sizes.wholeHeight);

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Group
const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Scroll
 */
let scrollY = window.scrollY // Scroll Position in Pixel
let currentSection = 0


window.addEventListener('scroll', () => {
    scrollY = window.scrollY

    const newSection = Math.round(scrollY / sizes.height)
    // console.log(newSection);

    if (newSection != currentSection) {
        currentSection = newSection
        // console.log('changed to: ', currentSection);
        gsap.to(
            sectionMeshes[currentSection].rotation,
            {
                duration: 3,
                ease: 'expo.out',
                x: '+=6',
                y: '+=3',
                z: '+=1.5'

            }
        )
    }

    // Change Material
    var colorScrollValue = scrollY / (sizes.wholeHeight - sizes.height)
    console.log(colorScrollValue);
    material.color.setRGB(colorScrollValue, 1-colorScrollValue, 1)

})

/**
 * Cursor
 */
const cursor = {}
cursor.x = 0
cursor.y = 0

window.addEventListener('mousemove', (event)=> {
    // mouse movement from 
    cursor.x = (event.clientX / sizes.width  -.5) * 2
    cursor.y = (event.clientY / sizes.height -.5) * 2
    // console.log(cursor);
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    // console.log(deltaTime);

    // Animate Camera
    camera.position.y = scrollY * (objectsDistance/sizes.height)

    const parallaxX = cursor.x
    const parallaxY = - cursor.y
    
    // Smoothing the Parallax                                 Smoothing Factor & Support Diffrent frecuency screens
    cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * .1 * deltaTime * 5
    cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * .1 * deltaTime * 5

    // Animate meshes
    for (const mesh of sectionMeshes) {
        mesh.rotation.x += deltaTime * .1
        mesh.rotation.y += deltaTime * .12
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
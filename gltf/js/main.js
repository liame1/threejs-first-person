import * as THREE from 'three';
// Import add-ons
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ~~~~~ GLOBAL VARIABLES
let scene, camera, renderer, excavator;
let sceneContainer = document.querySelector("#scene-container");
let mixer;

// ~~~~~ ANIMATION GLOBAL VARIABLES
let action, spinAction;


function init() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    sceneContainer.appendChild(renderer.domElement);
    // document.body.appendChild(renderer.domElement);

    // ~~~~~ INITIATE ADD ONS :
    new OrbitControls(camera, renderer.domElement);
    const loader = new GLTFLoader(); // to load 3d models

    // ~~~~~ CREATE GEOMETRY :
    
    // const material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
    
    // ~~~~~ ADD TEXTURE :
    
    // ~~~~~ LIGHTS :
    const light = new THREE.DirectionalLight(0x223300, 20);
        light.position.set(0,1,2);
        scene.add(light);
    const light2 = new THREE.DirectionalLight(0x00ffff, 20);
        light.position.set(0,1,2);
        scene.add(light2);

    
    // ~~~~~ LOAD gtlf FILE :
    loader.load('assets/Transit-01.gltf', function (gltf){
        excavator = gltf.scene;
        scene.add( excavator );
        excavator.scale.set(1,1,1);
        excavator.position.set(0, -11, 0);
        excavator.rotation.y = 2.4;

        mixer = new THREE.AnimationMixer(excavator);
        const clips = gltf.animations;

        // ~~~~~ PLAY SPECIFIC ANIMATIONS : (Empty.002Action + Cylinder.050Action) :
        // const clip = THREE.AnimationClip.findByName(clips, 'Empty.002Action');
        // action = mixer.clipAction(clip);
        // action.play();

        const spin = THREE.AnimationClip.findByName(clips, 'Train-CompleteAction.001');
        spinAction = mixer.clipAction(spin);
        // spinAction.play();

        // ~~~~~ PLAY ALL ANIMATIONS :
        // clips.forEach(function(clip) {
        //     const action = mixer.clipAction(clip);
        //     action.play();

        // })
    })

    // ~~~~~ CAMERA POSITION :
    camera.position.z = 30;
    camera.position.x = 1;
    camera.position.y = 0;

}

// ~~~~~ EVENT LISTENERS :

let mouseIsDown = false;

document.querySelector("body").addEventListener("mousedown", () => {
    spinAction.play();
    spinAction.paused = false;
    mouseIsDown = true;
    console.log("mousedown");
})
document.querySelector("body").addEventListener("mouseup", () => {
    mouseIsDown = false;
    spinAction.paused = true;
    console.log("mouseup");
})
document.querySelector("body").addEventListener("mousemove", () => {
    if(mouseIsDown == true) {
        console.log("mousemove");
    }
})
// ~~~~~ SCROLL CAMERA ANIMATION :
function moveCamera() {
    // ~~~ distance from top :
    const top = document.body.getBoundingClientRect().top;
    // * added existing camera position + scroll multipliers
    camera.position.z = 30 + top * 0.01;
    camera.position.x = 1 + top * 0.001;
}
// ~~~ executes function on scroll :
document.body.onscroll=moveCamera;


// ~~~~~ ANIMATION LOOP :
const clock = new THREE.Clock();
function animate() {
    
    requestAnimationFrame(animate);

    mixer.update(clock.getDelta());



    // ~~~~~ ALWAYS END ANIMATION LOOP W/ RENDERER
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
}

window.addEventListener('resize', onWindowResize, false);


init();
animate();
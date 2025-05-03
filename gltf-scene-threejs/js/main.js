import * as THREE from 'three';
// Import add-ons
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; 
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ~~~~~ GLOBAL VARIABLES
let scene, camera, renderer, station;
let sceneContainer = document.querySelector("#scene-container");
let mixer;

// ~~~~~ ANIMATION GLOBAL VARIABLES
let action;


function init() {

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(50, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    sceneContainer.appendChild(renderer.domElement);
    // document.body.appendChild(renderer.domElement);

    // ~~~~~ INITIATE ADD ONS :
    // new OrbitControls(camera, renderer.domElement);

    const loader = new GLTFLoader(); // to load 3d models

    
    // ~~~~~ LIGHTS :
    const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 2.5 );
	light.position.set( 0.5, 1, 0.75 );
	scene.add( light );

    
    // ~~~~~ LOAD gtlf FILE :
    loader.load('assets/Transit-01.gltf', function (gltf){
        station = gltf.scene;
        scene.add( station );
        station.scale.set(1,1,1);
        station.position.set(0, 0, 0);
        station.rotation.y = 0;

        mixer = new THREE.AnimationMixer(station);
        const clips = gltf.animations;

        // ~~~~~ PLAY SPECIFIC ANIMATIONS :
        const clip = THREE.AnimationClip.findByName(clips, 'Train-CompleteAction.001');
        action = mixer.clipAction(clip);
        action.play();

    })

    // ~~~~~ CAMERA POSITION :
    camera.position.z = -15;
    camera.position.x = 0;
    camera.position.y = 3;
    camera.lookAt(0, 2, 0);

}

// ~~~~~ EVENT LISTENERS :


// ~~~~~ SCROLL CAMERA ANIMATION :
// function moveCamera() {
//     // ~~~ distance from top :
//     const top = document.body.getBoundingClientRect().top;
//     // * added existing camera position + scroll multipliers
//     camera.position.z = 30 + top * 0.01;
//     camera.position.x = 1 + top * 0.001;
// }
// // ~~~ executes function on scroll :
// document.body.onscroll=moveCamera;


// ~~~~~ ANIMATION LOOP :

let move;
const moveFinal = 14;

const clock = new THREE.Clock();
function animate() {

    move += 0.1;
    if(move < moveFinal) {
        camera.position.z = move;
        renderer.render(scene,camera);
    }

    
    requestAnimationFrame(animate);

    mixer.update(clock.getDelta());



    // ~~~~~ ALWAYS END ANIMATION LOOP W/ RENDERER
    renderer.render(scene, camera);
}

window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}


init();
animate();
/* globals Stats, dat, AMI*/

// standard global letiables
import {getSeriesObjPathBySeriesKy} from "./utils/StudyService";

let controls;
let threeD;
let renderer;
let stats;
let camera;
let scene;
let vrHelper;
let lut;
let ready = false;

const url = window.location.href;
//Getting Series ID from url
const seriesId = url.split('/')[3]
console.log("Our 3D series ID",seriesId)
//Getting token from url
const result = url.lastIndexOf('/')
const token = url.substring(result + 1)
//Setting token to local Storage
window.localStorage.setItem("jwt",token)


let objList = []

getSeriesObjPathBySeriesKy(seriesId).then(obj => {

    obj.forEach(o => {
        const imgPath = "https://" + o;
        objList.push(imgPath);
    });

});

const myStack = {
    lut: 'random',
    opacity: 'random',
    steps: 256,
    alphaCorrection: 0.5,
    interpolation: 1
};

/**
 * Handle mouse down event
 */
function onMouseDown() {
    if (vrHelper && vrHelper.uniforms) {
        vrHelper.uniforms.uSteps.value = Math.floor(myStack.steps / 2);
        vrHelper.interpolation = 0;
    }
}

/**
 * Handle mouse up event
 */
function onMouseUp() {
    if (vrHelper && vrHelper.uniforms) {
        vrHelper.uniforms.uSteps.value = myStack.steps;
        vrHelper.interpolation = myStack.interpolation;
    }
}

/**
 * Handle window resize event
 */
function onWindowResize() {
    // update the camera
    camera.aspect = threeD.offsetWidth / threeD.offsetHeight;
    camera.updateProjectionMatrix();

    // notify the renderer of the size change
    renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
}

/**
 * Build GUI
 */
function buildGUI() {
    const gui = new dat.GUI({
        autoPlace: false
    });

    const customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    const stackFolder = gui.addFolder('Settings');
    const lutUpdate = stackFolder.add(myStack, 'lut', lut.lutsAvailable());
    lutUpdate.onChange(function (value) {
        lut.lut = value;
        vrHelper.uniforms.uTextureLUT.value.dispose();
        vrHelper.uniforms.uTextureLUT.value = lut.texture;
    });
    // init LUT
    lut.lut = myStack.lut;
    vrHelper.uniforms.uTextureLUT.value.dispose();
    vrHelper.uniforms.uTextureLUT.value = lut.texture;

    const opacityUpdate = stackFolder.add(myStack, 'opacity', lut.lutsAvailable('opacity'));
    opacityUpdate.onChange(function (value) {
        lut.lutO = value;
        vrHelper.uniforms.uTextureLUT.value.dispose();
        vrHelper.uniforms.uTextureLUT.value = lut.texture;
    });

    const stepsUpdate = stackFolder.add(myStack, 'steps', 0, 512).step(1);
    stepsUpdate.onChange(function (value) {
        if (vrHelper.uniforms) {
            vrHelper.uniforms.uSteps.value = value;
        }
    });

    const alphaCorrrectionUpdate = stackFolder.add(myStack, 'alphaCorrection', 0, 1).step(0.01);
    alphaCorrrectionUpdate.onChange(function (value) {
        if (vrHelper.uniforms) {
            vrHelper.uniforms.uAlphaCorrection.value = value;
        }
    });

    stackFolder.add(vrHelper, 'interpolation', 0, 1).step(1);

    stackFolder.open();
}

/**
 * Init the scene
 */
function init() {
    /**
     * Rendering loop
     */
    function animate() {
        // render
        controls.update();

        if (ready) {
            renderer.render(scene, camera);
        }

        stats.update();

        // request new frame
        requestAnimationFrame(function () {
            animate();
        });
    }

    // renderer
    threeD = document.getElementById('r3d');
    renderer = new THREE.WebGLRenderer({
        alpha: true
    });
    renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
    threeD.appendChild(renderer.domElement);

    // stats
    stats = new Stats();
    threeD.appendChild(stats.domElement);

    // scene
    scene = new THREE.Scene();

    // camera
    camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 0.1, 100000);
    camera.position.x = 150;
    camera.position.y = 400;
    camera.position.z = -350;
    camera.up.set(-0.42, 0.86, 0.26);

    // controls
    controls = new AMI.TrackballControl(camera, threeD);
    controls.rotateSpeed = 5.5;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;

    threeD.addEventListener('mousedown', onMouseDown, false);
    threeD.addEventListener('mouseup', onMouseUp, false);
    window.addEventListener('resize', onWindowResize, false);

    // start rendering loop
    animate();
}

function Render3D() {
// var file = 'https://cdn.rawgit.com/FNNDSC/data/master/nifti/eun_brain/eun_uchar_8.nii.gz';
//     const file = ['https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36444280',
//         'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36444336',
//         'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36444322',
//         'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36444308',
//         'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36444294']


    let loader = new AMI.VolumeLoader(threeD);
    loader.load(objList).then(function () {
        const series = loader.data[0].mergeSeries(loader.data)[0];
        loader.free();
        loader = null;
        // get first stack from series
        const stack = series.stack[0];

        vrHelper = new AMI.VolumeRenderingHelper(stack);
        // scene
        scene.add(vrHelper);

        // CREATE LUT
        lut = new AMI.LutHelper('my-tf');
        lut.luts = AMI.LutHelper.presetLuts();
        lut.lutsO = AMI.LutHelper.presetLutsO();
        // update related uniforms
        vrHelper.uniforms.uTextureLUT.value = lut.texture;
        vrHelper.uniforms.uLut.value = 1;

        // update camrea's and interactor's target
        const centerLPS = stack.worldCenter();
        camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        camera.updateProjectionMatrix();
        controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

        // create GUI
        buildGUI();

        ready = true;
    });

}

// init threeJS...
init();
// Rendering the view..
setTimeout(Render3D, 1000)
// Render3D();


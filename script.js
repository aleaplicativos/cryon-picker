class World {
    constructor() {
        this.items = [];
    }
    addToScene(scene) {
        this.items.forEach(crayon => {
            scene.add(crayon.mesh);
        });
    }
    animate() {
        this.items.forEach(crayon => {
            crayon.animate();
        });
    }
    addItem(item) {
        this.items.push(item);
    }
}

const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 32);
const coneGeometry = new THREE.CylinderGeometry(.3, 1, 1, 32);

class Crayon {
    constructor(color, position) {
        this.color = color;
        this.position = position || new THREE.Vector3(0, 0, 0);
        this.initialPosition = new THREE.Vector3(0, this.position.y, 0);
        this.animationPosition = this.initialPosition.add(new THREE.Vector3(0, 20, 0));
        this.generateMesh(color);
        this.animationState = 'idle';
        this.active = false;
    }
    generateMesh() {
        this.mesh = new THREE.Group();

        const labelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const phongMaterial = new THREE.MeshPhongMaterial({ color: this.color });

        const cylinder = new THREE.Mesh(cylinderGeometry, phongMaterial);
        cylinder.scale.set(1, 14, 1);
        cylinder.world = this;

        const label = new THREE.Mesh(cylinderGeometry, labelMaterial);
        label.scale.set(1.05, 12, 1.05);
        label.position.set(0, 0, 0);
        label.world = this;


        const cone = new THREE.Mesh(coneGeometry, phongMaterial);
        cone.scale.set(.9, 2, 1);
        cone.position.set(0, 8, 0);
        cone.world = this;

        this.mesh.add(cone);

        this.mesh.add(label);
        this.mesh.add(cylinder);
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    }
    animate() {
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    
        if(this.animationState == 'idle') {
            this.position.y = this.initialPosition.y;
        }
        if(this.animationState == 'active') {
            this.position.y += 3;
            if(this.position.y >= this.animationPosition.y) {
                this.animationState = 'selected';
            }
        }
    }
    stertAnimation() {
        if(this.animationState == 'idle') {
            this.animationState = 'active';
        }
        if(this.animationState == 'selected') {
            this.animationState = 'idle';
        }
    }
}

let raycaster;
const pointer = new THREE.Vector2();
pointer.x = undefined
pointer.y = undefined

function onPointerMove( event ) {

	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    
}


let camera, scene, renderer,
    geometry, material, mesh, backgroundPlane,
    world;

let cameraPositionInc = 0;

const threeArea = document.getElementById('three-area');

let backgroundMaterial = new THREE.MeshPhongMaterial( {color: 0x333333} );


init();
animate(); 

function init() {

    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize( threeArea.offsetWidth, threeArea.offsetHeight );
    renderer.setClearColor( 0x000000, 0 ); // the default
    renderer.setPixelRatio( window.devicePixelRatio );

    threeArea.appendChild( renderer.domElement );

    scene = new THREE.Scene();
 
    camera = new THREE.PerspectiveCamera( 75, threeArea.offsetWidth / threeArea.offsetHeight, 0.1, 1000 	);
    camera.position.y = 40;
    camera.position.x = 20;

    camera.lookAt(0, 25, 0);
    scene.add( camera );

    const light = new THREE.PointLight( 0xfffffff, 1, 10000 );
    light.position.set( 50, 50, 50 );
    scene.add( light );

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry( 1000, 1000, 32 ),
        backgroundMaterial,
    );
    plane.rotation.y = Math.PI / 2;
    plane.position.x = -50
    scene.add( plane );

    const plane2 = new THREE.Mesh(
        new THREE.PlaneGeometry( 1000, 1000, 32 ),
        backgroundMaterial
    );
    plane2.rotation.x = -Math.PI / 2;
    scene.add( plane2 );
    

    let ambientLight = new THREE.AmbientLight( 0x555555 ); // soft white light
    scene.add( ambientLight );

    
    world = new World();

    for(let i = -4; i < 4; i++) {
        for(let j = -4; j < 4; j++) {
            let redIndex = (i + 4) + (j + 4)*i/10;
            let greenIndex = (j + 4) + (i + 4)*j/10;
            let blueIndex = (i + 4) + (j + 4) * (i + 4) * (j / 10);

            let red = redIndex / 8;
            let green = greenIndex / 8;
            let blue = blueIndex / 8;

            let color = new THREE.Color(red, green, blue);

            const crayon = new Crayon(color,
                new THREE.Vector3(i * 2 , -i*2, j * 2));
           
            world.addItem(crayon);
        }
    }


    world.addToScene(scene);

    raycaster = new THREE.Raycaster();
  
}


let lastSelection;

function animate() {
    requestAnimationFrame( animate );
    

    world.animate();

    raycaster.setFromCamera( pointer, camera );

    // console.log(raycaster.intersectObjects( scene.children, true ))

    raycaster.intersectObjects( scene.children, true ).forEach( function ( intersect ) {
        if(mouseDown && clickState) {
            // console.log(intersect.object.world.color)
            if(intersect.object.world.animationState != "active") {
                intersect.object.world.stertAnimation();
                console.log(intersect.object.world.color);
                if(!lastSelection) {
                    lastSelection = intersect;
                }else{
                    if(lastSelection.animationState == "selected"){
                        lastSelection.animationState = "idle";
                    }
                }
                
            }
            if(intersect.object.world.animationState != "selected"){
                backgroundMaterial.color = intersect.object.world.color;
                lastSelection = intersect.object.world;
            }
            clickState = false;
        }
    } );

    renderer.render( scene, camera );
    
};


window.addEventListener( 'pointermove', onPointerMove );

let mouseDown = false;
let mouseUp = true;
let clickState = false;

window.addEventListener('mousedown', function(event) {
    mouseDown = true;
    mouseUp = false;
    clickState = true;
}, true);

window.addEventListener('mouseup', function(event) {
    mouseDown = false;
    mouseUp = true;
    clickState = false;
}, true);


window.addEventListener('resize', function(event) {
    renderer.setSize(threeArea.offsetWidth, threeArea.offsetHeight);
    camera.aspect = threeArea.offsetWidth / threeArea.offsetHeight;
    camera.updateProjectionMatrix();
}, true);
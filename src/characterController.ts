import { Scene, TransformNode, Mesh, ArcRotateCamera, Vector3, ShadowGenerator, Quaternion, UniversalCamera, Observable, Ray, AnimationGroup, Axis, Space } from "@babylonjs/core";


export class Player extends TransformNode {
    public camera: UniversalCamera;
    public scene: Scene;
    private _input;

    //Player
    public mesh: Mesh; //outer collisionbox of player
    // private meshRotation: Vector3;

    //Camera
    private _camRoot: TransformNode;
    private _yTilt: TransformNode;
    
    // animation trackers
    private _currentAnim: AnimationGroup = null;
    private _prevAnim: AnimationGroup;
    private _isFalling: boolean = false;
    private _jumped: boolean = false;

    //const values
    private static readonly PLAYER_SPEED: number = 0.45;
    private static readonly JUMP_FORCE: number = 0.4;
    private static readonly GRAVITY: number = -2.5;
    // private static readonly DASH_FACTOR: number = 2.5;
    // private static readonly DASH_TIME: number = 10; //how many frames the dash lasts
    private static readonly DOWN_TILT: Vector3 = new Vector3(0.8290313946973066, 0, 0);
    private static readonly ORIGINAL_TILT: Vector3 = new Vector3(0.5934119456780721, 0, 0);
    // public dashTime: number = 0;

    //player movement vars
    private _deltaTime: number;
    private _h: any;
    private _v: any;

    private _moveDirection: Vector3;
    private _inputAmt: number;

    //dashing
    // private _dashPressed: boolean;
    // private _canDash: boolean = true;
    
    //gravity, ground detection, jumping
    private _gravity: Vector3 = new Vector3();
    private _lastGroundPos: Vector3 = Vector3.Zero(); // keep track of the last grounded position
    private _grounded: boolean;
    private _jumpCount: number = 1;

    //player variables
    public lanternsLit: number = 1; //num lanterns lit
    public totalLanterns: number;
    public win: boolean = false; //whether the game is won
    

    // //sparkler
    // public sparkler: ParticleSystem; // sparkler particle system
    // public sparkLit: boolean = true;
    // public sparkReset: boolean = false;

    // //moving platforms
    // public _raisePlatform: boolean;

    //observables
    public onRun = new Observable();
    private _camPos: Vector3;

    constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
        super("player", scene);
        this.scene = scene;

        this.mesh = assets.mesh;
        this.mesh.parent = this;
        this._setupPlayerCamera();
        // this.meshRotation = this.mesh.rotation;

        shadowGenerator.addShadowCaster(assets.mesh); //the player mesh will cast shadows

        this._input = input; //inputs we will get from inputController.ts
    }

    public activatePlayerCamera(): UniversalCamera {
        this.scene.registerBeforeRender(() => {
    
            this._beforeRenderUpdate();
            // this._updateCamera();
    
        })
        return this.camera;
    }

    private _setupPlayerCamera() {
        //our actual camera that's pointing at our root's position
        this.camera = new UniversalCamera("cam", new Vector3(0, 2, 0).addInPlace(this.mesh.position), this.scene);
        this.camera.rotation = new Vector3(0, Math.PI, 0);
        this.camera.fov = 0.43;
        this.camera.parent = this.mesh;

        this.scene.activeCamera = this.camera;
        return this.camera;
    }

    private _updateFromControls(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;


        this._h = this._input.horizontal; //right, x
        this._v = this._input.vertical; //fwd, z

        //--MOVEMENTS BASED ON CAMERA (as it rotates)--
        let fwd = this.mesh.forward;
        let right = this.mesh.right;
        let correctedVertical = fwd.scaleInPlace(this._v);
        let correctedHorizontal = right.scaleInPlace(this._h);

        //movement based off of camera's view
        let move = correctedHorizontal.addInPlace(correctedVertical)

        //clear y so that the character doesnt fly up, normalize for next step, taking into account whether we've DASHED or not
        this._moveDirection = new Vector3((move).normalize().x, 0, (move).normalize().z);

        //clamp the input value so that diagonal movement isn't twice as fast
        let inputMag = Math.abs(this._h) + Math.abs(this._v);
        if (inputMag < 0) {
            this._inputAmt = 0;
        } else if (inputMag > 1) {
            this._inputAmt = 1;
        } else {
            this._inputAmt = inputMag;
        }
        //final movement that takes into consideration the inputs
        this._moveDirection = this._moveDirection.scaleInPlace(this._inputAmt * Player.PLAYER_SPEED);

        // //rotation based on input & the camera angle
        // let angle = Math.atan2(this._input.horizontalAxis, this._input.verticalAxis);
        // // angle += this._camRoot.rotation.y;
        // let targ = Quaternion.FromEulerAngles(0, angle, 0);
        // this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targ, 10 * this._deltaTime);

        //rotation based on mousemove
        //check if there is movement to determine if rotation is needed
        if (this._input.mouseCurrentPosition.length() == 0) {//if there's no input detected, prevent rotation and keep player in same rotation
            return;
        }
        // currentToLast.addInPlace(this.mesh.rotation);
        this.mesh.rotate(new Vector3(1, 0, 0), this._input.mouseCurrentPosition._x / Math.PI, Space.LOCAL);
        this.mesh.rotate(new Vector3(0, 1, 0), this._input.mouseCurrentPosition._y / Math.PI, Space.LOCAL);
        let rotationInEuler = this.mesh.rotationQuaternion.toEulerAngles();
        if (rotationInEuler._x > 1) rotationInEuler._x = 1;
        else if (rotationInEuler._x < -1) rotationInEuler._x = -1;
        this.mesh.rotationQuaternion = Quaternion.FromEulerVector(new Vector3(rotationInEuler._x, rotationInEuler._y, 0))
        console.log(this.mesh.rotationQuaternion.toEulerAngles());
        this._input.mouseCurrentPosition = new Vector3(0, 0, 0);
    }

    //--GROUND DETECTION--
    //Send raycast to the floor to detect if there are any hits with meshes below the character
    private _floorRaycast(offsetx: number, offsetz: number, raycastlen: number): Vector3 {
        //position the raycast from bottom center of mesh
        let raycastFloorPos = new Vector3(this.mesh.position.x + offsetx, this.mesh.position.y + 0.5, this.mesh.position.z + offsetz);
        let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

        //defined which type of meshes should be pickable
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        let pick = this.scene.pickWithRay(ray, predicate);

        if (pick.hit) { //grounded
            return pick.pickedPoint;
        } else { //not grounded
            return Vector3.Zero();
        }
    }

    private _isGrounded(): boolean {
        //dashing reset
        // this._canDash = true; //the ability to dash
        //reset sequence(needed if we collide with the ground BEFORE actually completing the dash duration)
        // this.dashTime = 0;
        // this._dashPressed = false;
        if (this._floorRaycast(0, 0, 0.6).equals(Vector3.Zero())) {
            return false;
        } else {
            return true;
        }
    }

    private _checkSlope(): boolean {

        //only check meshes that are pickable and enabled (specific for collision meshes that are invisible)
        let predicate = function (mesh) {
            return mesh.isPickable && mesh.isEnabled();
        }

        //4 raycasts outward from center
        let raycast = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z + .25);
        let ray = new Ray(raycast, Vector3.Up().scale(-1), 1.5);
        let pick = this.scene.pickWithRay(ray, predicate);

        let raycast2 = new Vector3(this.mesh.position.x, this.mesh.position.y + 0.5, this.mesh.position.z - .25);
        let ray2 = new Ray(raycast2, Vector3.Up().scale(-1), 1.5);
        let pick2 = this.scene.pickWithRay(ray2, predicate);

        let raycast3 = new Vector3(this.mesh.position.x + .25, this.mesh.position.y + 0.5, this.mesh.position.z);
        let ray3 = new Ray(raycast3, Vector3.Up().scale(-1), 1.5);
        let pick3 = this.scene.pickWithRay(ray3, predicate);

        let raycast4 = new Vector3(this.mesh.position.x - .25, this.mesh.position.y + 0.5, this.mesh.position.z);
        let ray4 = new Ray(raycast4, Vector3.Up().scale(-1), 1.5);
        let pick4 = this.scene.pickWithRay(ray4, predicate);

        if (pick.hit && !pick.getNormal().equals(Vector3.Up())) {
            if(pick.pickedMesh.name.includes("stair")) { 
                return true; 
            }
        } else if (pick2.hit && !pick2.getNormal().equals(Vector3.Up())) {
            if(pick2.pickedMesh.name.includes("stair")) { 
                return true; 
            }
        }
        else if (pick3.hit && !pick3.getNormal().equals(Vector3.Up())) {
            if(pick3.pickedMesh.name.includes("stair")) { 
                return true; 
            }
        }
        else if (pick4.hit && !pick4.getNormal().equals(Vector3.Up())) {
            if(pick4.pickedMesh.name.includes("stair")) { 
                return true; 
            }
        }
        return false;
    }

    private _updateGroundDetection(): void {
        this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

        //if not grounded
        if (!this._isGrounded()) {
            //if the body isnt grounded, check if it's on a slope and was either falling or walking onto it
            if (this._checkSlope() && this._gravity.y <= 0) {
                console.log("slope")
                //if you are considered on a slope, you're able to jump and gravity wont affect you
                this._gravity.y = 0;
                this._jumpCount = 1;
                this._grounded = true;
            } else {
                //keep applying gravity
                this._gravity = this._gravity.addInPlace(Vector3.Up().scale(this._deltaTime * Player.GRAVITY));
                this._grounded = false;
            }
        }

        //limit the speed of gravity to the negative of the jump power
        if (this._gravity.y < -Player.JUMP_FORCE) {
            this._gravity.y = -Player.JUMP_FORCE;
        }

        //cue falling animation once gravity starts pushing down
        if (this._gravity.y < 0 && this._jumped) { //todo: play a falling anim if not grounded BUT not on a slope
            this._isFalling = true;
        }

        //update our movement to account for jumping
        this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));

        if (this._isGrounded()) {
            this._gravity.y = 0;
            this._grounded = true;
            //keep track of last known ground position
            this._lastGroundPos.copyFrom(this.mesh.position);

            this._jumpCount = 1;

            //jump & falling animation flags
            this._jumped = false;
            this._isFalling = false;

        }

        //Jump detection
        if (this._input.jumpKeyDown && this._jumpCount > 0) {
            this._gravity.y = Player.JUMP_FORCE;
            this._jumpCount--;

            //jumping and falling animation flags
            // this._jumped = true;
            // this._isFalling = false;
            // this._jumpingSfx.play();
        }

    }

    private _beforeRenderUpdate(): void {
        this._updateFromControls();
        //move our mesh
        this._updateGroundDetection();
    }
}

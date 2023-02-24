import { Mesh, Scene, ShadowGenerator, TransformNode, UniversalCamera, Vector3 } from "@babylonjs/core";

export class Player extends TransformNode {
    public scene: Scene;
    private _input;
    private _canvas: HTMLCanvasElement;
    
    //Player
    public mesh: Mesh;
    
    //Camera
    private camera: UniversalCamera;

    constructor(canvas: HTMLCanvasElement, assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
        super("player", scene);
        this.scene = scene;
        this._canvas = canvas;
        
        this._setupPlayerCamera();
        
        this.mesh = assets.mesh;
        this.mesh.parent = this.camera;

        shadowGenerator.addShadowCaster(assets.mesh); //the player mesh will cast shadows

        // this._input = input; //inputs we will get from inputController.ts
    }
    private _setupPlayerCamera() {
        this.camera = new UniversalCamera("cam", new Vector3(0, 1.3, 0).addInPlace(this.position), this.scene);
        this.camera.applyGravity = true;
        this.camera.checkCollisions = true;

        this.camera.attachControl(this._canvas);
        
        return this.camera;
    }

    public getCamera() {
        return this.camera;
    }
}
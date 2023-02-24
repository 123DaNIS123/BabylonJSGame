import { Scene, MeshBuilder, Vector3 } from "@babylonjs/core";
export class Environment {
    private _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;
        this._scene.collisionsEnabled = true;
        this._scene.gravity = new Vector3(0, -0.15, 0);
    }

    public async load() {
        var ground = MeshBuilder.CreateBox("ground", { size: 24 }, this._scene);
        ground.scaling = new Vector3(1,.02,1);
        ground.checkCollisions = true;
    }
}

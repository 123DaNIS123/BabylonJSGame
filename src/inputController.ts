import { Scene, ActionManager, ExecuteCodeAction, Scalar, Vector3, IMouseEvent, PointerInput } from "@babylonjs/core";

export class PlayerInput{
    private scene: Scene;
    private canvas: HTMLCanvasElement;
    
    public inputMap: any;
    //simple movement
    public vertical: number = 0;
    public horizontal: number = 0;
     //tracks whether or not there is movement in that axis
    public verticalAxis: number = 0;
    public horizontalAxis: number = 0;
    //mouse
    public mouseCurrentPosition = new Vector3(0, 0, 0);
    public mouseSensitivity = 0.01 // default
    // public mouseLastPosition = new Vector3(0, 0, 0);

    //jumping
    public jumpKeyDown: boolean = false;
    
    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        scene.actionManager = new ActionManager(scene);
    
        this.inputMap = {};
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        canvas.addEventListener("click", event => {
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            if(canvas.requestPointerLock) {
              canvas.requestPointerLock();
            }
          }, false);
        canvas.addEventListener("mousemove", (evt) => {
            this.mouseCurrentPosition = new Vector3(-evt.movementY*this.mouseSensitivity, evt.movementX*this.mouseSensitivity);
        })
        // let pointerlockchange = function () {
        //     var controlEnabled = document.pointerLockElement || false;
            
        //     if (!controlEnabled) {
        //         this.isLocked = false;
        //     } else {
        //         this.isLocked = true;
        //     }
        // };
        // scene.onPointerObservable.add((evt) => {
        //     if (this.isLocked){
        //         console.log(evt.event, "!!!!!")
        //         this.mouseLastPosition = this.mouseCurrentPosition;
        //         this.mouseCurrentPosition = new Vector3(evt.event.movementY/512, evt.event.movementX/512);
        //     }
        // });
    
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    private _updateFromKeyboard(): void {
        if (this.inputMap["s"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
    
        } else if (this.inputMap["w"]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
        } else {
            this.vertical = 0;
        }
    
        if (this.inputMap["d"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
    
        } else if (this.inputMap["a"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
        }
        else {
            this.horizontal = 0;
        }
        
        //Jump Checks (SPACE)
        if (this.inputMap[" "]) {
            this.jumpKeyDown = true;
        } else {
            this.jumpKeyDown = false;
        }
    }
}

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
    public mouseLastPosition = new Vector3(0, 0, 0);
    public isLocked = false;

    //jumping
    public jumpKeyDown: boolean = false;
    
    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.scene = scene;
        scene.actionManager = new ActionManager(scene);
        const mouseEvent = {
        } as IMouseEvent;
    
        this.inputMap = {};
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
            this.inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.onPointerDown = function (evt) {
            if (!this.isLocked) {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
                if (canvas.requestPointerLock){
                    canvas.requestPointerLock();
                }
            }
        }
        let pointerlockchange = function () {
            var controlEnabled = document.pointerLockElement || false;
            
            if (!controlEnabled) {
                this.isLocked = false;
            } else {
                this.isLocked = true;
            }
        };
        scene.onPointerObservable.add((evt) => {
            console.log(evt.event, "!!!!!")
            this.mouseLastPosition = this.mouseCurrentPosition;
            this.mouseCurrentPosition = new Vector3(evt.event.movementY/512, evt.event.movementX/512);
        });
    
        scene.onBeforeRenderObservable.add(() => {
            this._updateFromKeyboard();
        });
    }

    private _updateFromKeyboard(): void {
        if (this.inputMap["ArrowUp"]) {
            this.vertical = Scalar.Lerp(this.vertical, 1, 0.2);
            this.verticalAxis = 1;
    
        } else if (this.inputMap["ArrowDown"]) {
            this.vertical = Scalar.Lerp(this.vertical, -1, 0.2);
            this.verticalAxis = -1;
        } else {
            this.vertical = 0;
            this.verticalAxis = 0;
        }
    
        if (this.inputMap["ArrowLeft"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, -1, 0.2);
            this.horizontalAxis = -1;
    
        } else if (this.inputMap["ArrowRight"]) {
            this.horizontal = Scalar.Lerp(this.horizontal, 1, 0.2);
            this.horizontalAxis = 1;
        }
        else {
            this.horizontal = 0;
            this.horizontalAxis = 0;
        }
        
        //Jump Checks (SPACE)
        if (this.inputMap[" "]) {
            this.jumpKeyDown = true;
        } else {
            this.jumpKeyDown = false;
        }
    }
}

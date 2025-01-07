export class SceneController {
    nextCalled = false;
    backCalled = false;
    leaveCalled = false;
    jumpToStep = null

    next() {
        this.nextCalled = true;
    }

    back() {
        this.backCalled = true;
    }

    leave() {
        this.leaveCalled = true
    }
     jumpTo (step) {
      this.jumpToStep = step
    }
}


export interface CurrentSceneStatus {
  nextStep?: number
    endSession?: boolean
}


export class AdvancedScene<T> {
  constructor (
    public id,
    public handlers,
    public allowedEvents
  ) {
  }

  async run (ctx, step) {
    const controller = new SceneController()
      const handler = this.handlers[step]

      if (!handler) {
         throw new Error(`No handler for step ${step} in scene ${this.id}`)
      }

    await handler(ctx, controller)
    let currentStatus = { nextStep: step }

    if (controller.jumpToStep !== null) {
        currentStatus = { nextStep: controller.jumpToStep }
    } else if (controller.nextCalled) {
       currentStatus = {
          nextStep: step + 1
        }
     } else if(controller.backCalled){
       currentStatus = {
        nextStep: step - 1
      }
     }

     if (controller.leaveCalled) {
        currentStatus = {
          nextStep: undefined,
          endSession: true
        }
      }

      return currentStatus
  }
  }

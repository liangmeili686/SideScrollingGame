export const states = {
    STANDING_RIGHT: 1,
    STANDING_LEFT: 0,
    RUNNING_RIGHT: 3,
    RUNNING_LEFT: 2,
}

class State {
    constructor(state){
        this.state = state;
    }
}

export class StandingRight extends State {
    constructor(player){
        super('STANDING RIGHT');
        this.player = player;
    }
    enter(){
        this.player.frameY = 0;
    }
    handleInput(input){
        if (input.includes('ArrowLeft')) this.player.setState(states.RUNNING_LEFT);
        else if (input.includes('ArrowRight')) this.player.setState(states.RUNNING_RIGHT);
    }
}
export class StandingLeft extends State {
    constructor(player){
        super('STANDING LEFT');
        this.player = player;
    }
    enter(){
        this.player.frameY = 1;
    }
    handleInput(input){
        if (input.includes('ArrowRight')) this.player.setState(states.RUNNING_RIGHT);
        else if (input.includes('ArrowLeft')) this.player.setState(states.RUNNING_LEFT);
    }
}
export class RunningRight extends State {
    constructor(player){
        super('RUNNING RIGHT');
        this.player = player;
    }
    enter(){
        this.player.frameY = 6;
    }
    handleInput(input){
        if (!input.includes('ArrowRight')) this.player.setState(states.STANDING_RIGHT);
        else if (input.includes('ArrowLeft')) this.player.setState(states.RUNNING_LEFT);
    }
}
export class RunningLeft extends State {
    constructor(player){
        super('RUNNING LEFT');
        this.player = player;
    }
    enter(){
        this.player.frameY = 7;
    }
    handleInput(input){
        if (!input.includes('ArrowLeft')) this.player.setState(states.STANDING_LEFT);
        else if (input.includes('ArrowRight')) this.player.setState(states.RUNNING_RIGHT);
    }
}
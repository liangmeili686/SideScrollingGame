export class InputHandler {
    constructor(){
        this.keys = [];
        this.shootingMode = false;
        const normalizeKey = (key) => {
            if (key === 'w') return 'ArrowUp';
            if (key === 'a') return 'ArrowLeft';
            if (key === 'd') return 'ArrowRight';
            if (key === 's') return 'ArrowDown';
            return key;
        };
        window.addEventListener('keydown', e => {
            const normKey = normalizeKey(e.key);
            if ((normKey === 'ArrowDown' ||
                normKey === 'ArrowUp' ||
                normKey === 'ArrowLeft' ||
                normKey === 'ArrowRight')
                && this.keys.indexOf(normKey) === -1){
                this.keys.push(normKey);
            }
        });
        window.addEventListener('keyup', e => {
            const normKey = normalizeKey(e.key);
            if (normKey === 'ArrowDown' ||
                normKey === 'ArrowUp' ||
                normKey === 'ArrowLeft' ||
                normKey === 'ArrowRight'){
                this.keys.splice(this.keys.indexOf(normKey), 1);
            }
        });
        window.addEventListener('click', e =>{
            this.shootingMode = true;
        });
    }
}
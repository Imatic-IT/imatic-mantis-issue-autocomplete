import debounce from 'lodash/debounce';

export class InputHandler {
    private readonly inputs: HTMLInputElement[];
    private readonly onInput: (event: Event) => void;

    constructor(inputNames: string[], onInput: (event: Event) => void) {
        this.inputs = inputNames.flatMap(name => Array.from(document.querySelectorAll(`input[name="${name}"]`)) as HTMLInputElement[]);
        this.onInput = debounce(onInput, 300);
        this.init();
    }

    private init(): void {
        this.inputs.forEach(input => {
            input.addEventListener('input', this.onInput);
        });
    }

    public destroy(): void {
        this.inputs.forEach(input => {
            input.removeEventListener('input', this.onInput);
        });
    }
}

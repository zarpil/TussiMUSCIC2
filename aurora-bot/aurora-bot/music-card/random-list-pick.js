export class RandomPicker {
    constructor(array) {
        this.original = [...array];
        this.reset();
    }

    reset() {
        this.pool = [...this.original];
        this.shuffle(this.pool);
        this.index = 0;
    }

    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.secureRandom() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    secureRandom() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] / (0xFFFFFFFF + 1);
    }

    getNext() {
        if (this.index >= this.pool.length) {
            this.reset();
        }
        return this.pool[this.index++];
    }
}
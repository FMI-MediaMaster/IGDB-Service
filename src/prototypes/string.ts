declare global {
    interface String {
        toASCII(): string;
    }
}

String.prototype.toASCII = function (): string {
    return this
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{ASCII}]/gu, '')
};

export {};

export function keydown(char: string) {
    const init = { key: char, keyCode: '68' };
    return new KeyboardEvent('keydown', init);
}
import { FunctionsUsingCSI, KindOfEraseInDisplay, KindOfEraseInLine } from './functions-using-csi';

describe('CsiFunction', () => {
  let csi = FunctionsUsingCSI;
  it('insertBlank' ,() => {
    expect(csi.insertBlank(3)).toBeTruthy('\x9b3@');
  })
  it('cursorUp()', () => {
    expect(csi.cursorUp(3)).toBeTruthy('\x9b3A');
  })
  it('cursorDown()', () => {
    expect(csi.cursorDown(3)).toBeTruthy('\x9b3B');
  })
  it('cursorForward()', () => {
    expect(csi.cursorForward(3)).toBeTruthy('\x9b3C');
  })
  it('cursorBackward()', () => {
    expect(csi.cursorBackward(3)).toBeTruthy('\x9b3D');
  })
  it('cursorNextLine()', () => {
    expect(csi.cursorNextLine(3)).toBeTruthy('\x9b3E');
  })
  it('cursorPrecedingLine()', () => {
    expect(csi.cursorPrecedingLine(3)).toBeTruthy('\x9b3F');
  })
  it('cursorColumn()', () => {
    expect(csi.cursorColumn(3)).toBeTruthy('\x9b9G');
  })
  it('cursorPosition()', () => {
    expect(csi.cursorPosition(2,2)).toBeTruthy('\x9b2;2H');
  })
  it('eraseInDisplay()', () => {
    expect(csi.eraseInDisplay(KindOfEraseInDisplay.Above)).toBeTruthy('\x9b1J');
    expect(csi.eraseInDisplay(KindOfEraseInDisplay.All)).toBeTruthy('\x9b2J');
    expect(csi.eraseInDisplay(KindOfEraseInDisplay.Below)).toBeTruthy('\x9b0J');
    expect(csi.eraseInDisplay(KindOfEraseInDisplay.SavedLines)).toBeTruthy('\x9b3J');
  })
  it('eraseSelectiveThingsInDisplay()', () => {
    expect(csi.eraseSelectiveThingsInDisplay(KindOfEraseInDisplay.Above)).toBeTruthy('\x9b?1J');
    expect(csi.eraseSelectiveThingsInDisplay(KindOfEraseInDisplay.All)).toBeTruthy('\x9b?2J');
    expect(csi.eraseSelectiveThingsInDisplay(KindOfEraseInDisplay.Below)).toBeTruthy('\x9b?0J');
    expect(csi.eraseSelectiveThingsInDisplay(KindOfEraseInDisplay.SavedLines)).toBeTruthy('\x9b?3J');
  })
  it('eraseInLine()', () => {
    expect(csi.eraseInLine(KindOfEraseInLine.Right)).toBeTruthy('\x9b0K');
    expect(csi.eraseInLine(KindOfEraseInLine.Left)).toBeTruthy('\x9b1K');
    expect(csi.eraseInLine(KindOfEraseInLine.All)).toBeTruthy('\x9b2K');

  })
  it('eraseSelectiveThingsInLine()', () => {
    expect(csi.eraseSelectiveThingsInLine(KindOfEraseInLine.Right)).toBeTruthy('\x9b?0K');
    expect(csi.eraseSelectiveThingsInLine(KindOfEraseInLine.Left)).toBeTruthy('\x9b?1K');
    expect(csi.eraseSelectiveThingsInLine(KindOfEraseInLine.All)).toBeTruthy('\x9b?2K');
  })
  it('insertLines()', () => {
    expect(csi.insertLines(2)).toBeTruthy('\x9b2L');
  })
  it('deleteLines()', () => {
    expect(csi.deleteLines(2)).toBeTruthy('\x9b2M');
  })
  it('deleteCharacter()', () => {
    expect(csi.deleteCharacter(2)).toBeTruthy('\x9b2P');
  })
  it('scrollUpLines()', () => {
    expect(csi.scrollUpLines(2)).toBeTruthy('\x9b2S');
  })
  it('scrollDownLines()', () => {
    expect(csi.scrollDownLines(2)).toBeTruthy('\x9b2T');
  })
  it('eraseCharacters()', () => {
    expect(csi.eraseCharacters(2)).toBeTruthy('\x9b2X');
  })
});

import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { NgTerminalComponent } from './ng-terminal.component';
import { GlobalStyleComponent } from './global-style/global-style.component';
import { ResizableModule } from 'angular-resizable-element';
import { Subject } from 'rxjs';
import { keydown } from './test-util'
import { FunctionsUsingCSI, KindOfEraseInDisplay, KindOfEraseInLine } from './functions-using-csi';

describe('NgTerminalComponent', () => {
  let component: NgTerminalComponent;
  let fixture: ComponentFixture<NgTerminalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgTerminalComponent, GlobalStyleComponent ],
      imports: [ ResizableModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('underlying', () => {
    expect(component.underlying).toBeDefined("underlying doesn't exist.")
  });

  it('write()', fakeAsync(() =>{
    const dummy = "dummy data"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    expect(term.getSelection().trim()).toEqual(dummy);
  }));

  it("make a scroll in xterm-viewport with write(newlines)", fakeAsync(() => {
    const term = fixture.componentInstance.terminalDiv.nativeElement as HTMLElement;
    component._displayOption = {fixedGrid:{rows: 4, cols: 4}};
    fixture.detectChanges();
    tick(1000);
    
    component.write('\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
    fixture.detectChanges();
    tick(1000);
    const viewPort = term.querySelector('.xterm-viewport');
    const height = viewPort.clientHeight;
    const scrollHeight = viewPort.scrollHeight;
    expect(scrollHeight).toBeGreaterThan(height);
  }))

  it('keyInput', (doneFn) => {
    let arr = ['h','i','!','\n']
    let result = [];
    component.keyInput.subscribe((char) => {
      result.push(char);
      if(arr.length == result.length){
        expect(arr.join('')).toEqual(result.join(''));
        doneFn();
      }
    });

    const terminalEventConsumer = fixture.componentInstance.terminalDiv.nativeElement.getElementsByTagName('textarea')[0];
    arr.forEach((v) => {
      terminalEventConsumer.dispatchEvent(keydown(v));
    });
  });

  it("@Output('keyInputEmitter')", (doneFn) => {
    let arr = ['h','i','!','\n']  
    let result = [];
    component.keyInputEmitter.subscribe((char) => {
      result.push(char);
      if(arr.length == result.length){
        expect(arr.join('')).toEqual(result.join(''));
        doneFn();
      }
    });

    const terminalEventConsumer = fixture.componentInstance.terminalDiv.nativeElement.getElementsByTagName('textarea')[0];
    arr.forEach((v) => {
      terminalEventConsumer.dispatchEvent(keydown(v));
    });
  });

  it("@Input('dataSource')", fakeAsync(() => {
    let arr = ['h','i','!','\n']
    let result = [];
    let dataSource = new Subject<string>();
    let spy: jasmine.Spy = spyOn(component, 'write').and.callThrough();

    component._dataSource = dataSource;
    arr.forEach((char) => dataSource.next(char));
    tick(100);
    expect(spy.calls.count()).toBe(4);
    arr.forEach((ch) => {
      expect(component.write).toHaveBeenCalledWith(ch);
    })
  }))
  
  it('this.term.dispose()', () => {
    const disposeSpy = spyOn(component.underlying, 'dispose').and.callThrough();
    expect(disposeSpy.calls.count()).toBe(0);
    fixture.destroy();
    expect(disposeSpy.calls.count()).toBe(1);
  })
});

describe('DisplayOption', () => {
  let component: NgTerminalComponent;
  let fixture: ComponentFixture<NgTerminalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgTerminalComponent, GlobalStyleComponent ],
      imports: [ ResizableModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it("@Input('displayOption')", () => {
    const term = fixture.componentInstance.terminalDiv.nativeElement;
    const beforeWidth = term.clientWidth;
    const beforeHeight = term.clientHeight;
    component._displayOption = {fixedGrid:{rows: 4, cols: 4}};
    fixture.detectChanges();
    
    const afterWidth = term.clientWidth;
    const afterHeight = term.clientHeight;
    
    expect(afterWidth).toBeLessThan(beforeWidth);
    expect(afterHeight).toBeLessThan(beforeHeight);
  })

  it('should decrease div size after changing fixedSize', () => {
    const term = fixture.componentInstance.terminalDiv.nativeElement;
    const beforeWidth = term.clientWidth;
    const beforeHeight = term.clientHeight;
    component.setDisplayOption({fixedGrid:{rows: 4, cols: 4}});
    fixture.detectChanges();
    
    const afterWidth = term.clientWidth;
    const afterHeight = term.clientHeight;
    
    expect(afterWidth).toBeLessThan(beforeWidth);
    expect(afterHeight).toBeLessThan(beforeHeight);
  })

  it('should increase div size after changing fixedSize', () => {
    const term = fixture.componentInstance.terminalDiv.nativeElement;
    component.setDisplayOption({fixedGrid:{rows: 4, cols: 4}});
    fixture.detectChanges();
    const beforeWidth = term.clientWidth;
    const beforeHeight = term.clientHeight;
    
    component.setDisplayOption({fixedGrid:{rows: 100, cols: 100}});
    fixture.detectChanges();
    const afterWidth = term.clientWidth;
    const afterHeight = term.clientHeight;
    
    expect(afterWidth).toBeGreaterThan(beforeWidth);
    expect(afterHeight).toBeGreaterThan(beforeHeight);
  })

  it('isDraggableOnEdgeActivated', () => {
    component.setDisplayOption({activateDraggableOnEdge: { minWidth: 100, minHeight: 100 }});
    expect(component.isDraggableOnEdgeActivated).toBe(true);
  })

  it('validatorFactory()', () => {
    component.setDisplayOption({activateDraggableOnEdge:{minHeight:100, minWidth:100}});
    let res1 = component.validatorFactory()({rectangle:{left: undefined, top: undefined, bottom: undefined, right: undefined, width: 99, height: 99}, edges: undefined})
    expect(res1).toBeFalsy('it must be false because it is smaller than minimum size');
    let res2 = component.validatorFactory()({rectangle:{left: undefined, top: undefined, bottom: undefined, right: undefined, width: 100, height: 100}, edges: undefined})
    expect(res2).toBeTruthy('it must be true because it is bigger than minimum size');
    let res3 = component.validatorFactory()({rectangle:{left: undefined, top: undefined, bottom: undefined, right: undefined, width: 200, height: 200}, edges: undefined})
    expect(res3).toBeTruthy('it must be true because it is bigger than minimum size');
  });
});

describe('NgTerminalComponent before opening', () => {
  let component: NgTerminalComponent;
  let fixture: ComponentFixture<NgTerminalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgTerminalComponent, GlobalStyleComponent ],
      imports: [ ResizableModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgTerminalComponent);
    component = fixture.componentInstance;
  });

  it("@Input('displayOption')", () => {
    component._displayOption = {
      fixedGrid: {
        cols: 100,
        rows: 15
      },
      activateDraggableOnEdge: {
        minHeight: 100,
        minWidth: 100
      }
    };
    
    fixture.detectChanges();
  })
});

describe('NgTerminalComponent with CSI functions', () => {
  let component: NgTerminalComponent;
  let fixture: ComponentFixture<NgTerminalComponent>;
  let csiFunction = FunctionsUsingCSI;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgTerminalComponent, GlobalStyleComponent ],
      imports: [ ResizableModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('write(cursorBackward) write(insertBlank)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(1) + csiFunction.insertBlank(1);
    const expectedResult = "dummy dat a"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(cursorColumn)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorColumn(1) + 'gummy'
    const expectedResult = "gummy data"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(cursorDown)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorColumn(1) + csiFunction.cursorDown(1) + 'gummy'
    const expectedResult = "dummy data\r?\ngummy"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(term.getSelection().trim()).toMatch(expectedResult);
  }));

  it('write(cursorForward)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorForward(1) + 'gummy'
    const expectedResult = "dummy data gummy"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(cursorNextLine)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorNextLine(1) + 'gummy'
    const expectedResult = "dummy data\r?\ngummy"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(term.getSelection().trim()).toMatch(expectedResult);
  }));

  it('write(cursorPosition)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorPosition(2,2) + 'gummy'
    const expectedResult = "dummy data\r?\n gummy"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(term.getSelection().trim()).toMatch(expectedResult);
  }));

  it('write(cursorPrecedingLine)', fakeAsync(() =>{
    const dummy = "dummy data\n\n\n" + csiFunction.cursorPrecedingLine(2) + 'gummy'
    const expectedResult = "dummy data\r?\ngummy"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(term.getSelection().trim()).toMatch(expectedResult);
  }));

  it('write(cursorUp)', fakeAsync(() =>{
    const dummy = "dummy data\r\n" + csiFunction.cursorForward(1) + csiFunction.cursorUp(1) + 'z'
    const expectedResult = "dzmmy data"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(deleteCharacter)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(4) + csiFunction.deleteCharacter(2)
    const expectedResult = "dummy ta"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(deleteLines)', fakeAsync(() =>{
    const dummy = "dummy data\r\ndata\r\ndata" + csiFunction.cursorPrecedingLine(1) + csiFunction.deleteLines(1)
    const expectedResult = "dummy data\r?\ndata"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(term.getSelection().trim()).toMatch(expectedResult);
  }));

  it('write(eraseCharacters)', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(4) + csiFunction.eraseCharacters(2);
    const expectedResult = "dummy   ta"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(eraseInDisplay(KindOfEraseInDisplay.All))', fakeAsync(() =>{
    const dummy = "dummy data\r\ndata\r\ndata" + csiFunction.eraseInDisplay(KindOfEraseInDisplay.All);
    const expectedResult = ""
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(eraseInDisplay(KindOfEraseInDisplay.Above))', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(2) + csiFunction.eraseInDisplay(KindOfEraseInDisplay.Above);
    const expectedResult = "a"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(eraseInDisplay(KindOfEraseInDisplay.Below))', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(2) + csiFunction.eraseInDisplay(KindOfEraseInDisplay.Below);
    const expectedResult = "dummy da"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(eraseInDisplay(KindOfEraseInDisplay.Left))', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(2) + csiFunction.eraseInLine(KindOfEraseInLine.Left)
    const expectedResult = "a"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(eraseInDisplay(KindOfEraseInDisplay.Right))', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(2) + csiFunction.eraseInLine(KindOfEraseInLine.Right)
    const expectedResult = "dummy da"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(eraseInDisplay(KindOfEraseInDisplay.All))', fakeAsync(() =>{
    const dummy = "dummy data" + csiFunction.cursorBackward(2) + csiFunction.eraseInLine(KindOfEraseInLine.All)
    const expectedResult = ""
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(insertBlank', fakeAsync(() =>{
    const dummy = "dummy data2" + csiFunction.cursorBackward(1) + csiFunction.insertBlank(3);
    const expectedResult = "dummy data   2"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(expectedResult).toEqual(term.getSelection().trim());
  }));

  it('write(insertLines)', fakeAsync(() =>{
    const dummy = "dummy data\r\ndata" + csiFunction.cursorColumn(1) +  csiFunction.insertLines(2)
    const expectedResult = "dummy data\r?\n\r?\n\r?\ndata"
    component.write(dummy);
    
    const term = component.underlying;
    term.selectAll();
    tick(100);
    console.log(term.getSelection().trim());
    expect(term.getSelection().trim()).toMatch(expectedResult);
  }));
});
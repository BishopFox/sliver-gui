import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy, AfterViewInit } from '@angular/core';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { NgTerminal } from './ng-terminal';
import { Subject, Observable, Subscription, combineLatest } from 'rxjs';
import { DisplayOption } from './display-option';
import { ResizeEvent } from 'angular-resizable-element';


@Component({
  selector: 'ng-terminal',
  templateUrl: './ng-terminal.component.html',
  styleUrls: ['./ng-terminal.component.scss']
})
export class NgTerminalComponent implements OnInit, AfterViewInit, AfterViewChecked, NgTerminal, OnDestroy {
  
  // @Input() id: string;
  @Input() terminal: Terminal;
  @Input() scrollback: number = Number.MAX_VALUE;

  private fitAddon: FitAddon;
  private keyInputSubject: Subject<string> = new Subject<string>();
  private keyEventSubject = new Subject<{ key: string; domEvent: KeyboardEvent; }>();
  private termSnippetSubject = new Subject<() => void>();
  private afterViewInitSubject = new Subject<void>();

  private keyInputSubjectSubscription: Subscription;
  private keyEventSubjectSubscription: Subscription;
  private termSnippetSubscription: Subscription;
  private h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  private displayOption: DisplayOption = {};
  private dataSource: Observable<string>;
  private dataSourceSubscription: Subscription;
  terminalStyle: object = {};

  @Input('dataSource')
  set _dataSource(ds) {
    if (this.dataSourceSubscription != null) {
      this.dataSourceSubscription.unsubscribe();
    }
    this.dataSource = ds;
    this.dataSourceSubscription = this.dataSource.subscribe((data) => {
      this.write(data);
    })
  }
  get _dataSource() {
    return this.dataSource;
  }

  @Input('displayOption')
  set _displayOption(opt: DisplayOption) {
    this.setDisplayOption(opt);
  }

  @Input('style')
  set _style(opt: any) {
    this.setStyle(opt);
  }

  @Output('keyInput')
  keyInputEmitter = new EventEmitter<string>();

  @Output('keyEvent')
  keyEventEmitter = new EventEmitter<{ key: string; domEvent: KeyboardEvent; }>();

  @ViewChild('terminal', { static: true })
  terminalDiv: ElementRef;

  constructor() {
    this.termSnippetSubscription = combineLatest([this.termSnippetSubject, this.afterViewInitSubject]).subscribe(([snippet]) => {
      snippet();
    });
  }

  private observableSetup() {
    this.terminal.onData((input) => {
      this.keyInputSubject.next(input);
    });
    this.terminal.onKey(e => {
      this.keyEventSubject.next(e);
    })
    this.keyInputSubjectSubscription = this.keyInputSubject.subscribe((data) => {
      this.keyInputEmitter.emit(data);
    })
    this.keyEventSubjectSubscription = this.keyEventSubject.subscribe((e) => {
      this.keyEventEmitter.emit(e);
    });
    this.afterViewInitSubject.next();
  }

  /**
   * set block or inline-block to #terminal for fitting client or outer element
   */
  private setTerminalBlock(isBlock: boolean) {
    if (isBlock)
      this.terminalStyle['display'] = 'block';
    else
      this.terminalStyle['display'] = 'inline-block';
  }

  /**
   * set dimensions
   */
  private setTerminalDimensions(left: number, top: number, width: number, height: number) {
    this.terminalStyle['left'] = left ? `${left}px` : undefined;
    this.terminalStyle['top'] = top ? `${top}px` : undefined;
    this.terminalStyle['width'] = width ? `${width}px` : undefined;
    this.terminalStyle['height'] = height ? `${height}px` : undefined;
  }

  /**
   * remove dimensions
   */
  private removeTerminalDimensions() {
    this.terminalStyle['left'] = undefined;
    this.terminalStyle['top'] = undefined;
    this.terminalStyle['width'] = undefined;
    this.terminalStyle['height'] = undefined;
  }

  setStyle(styleObject: any) {
    Object.assign(this.terminalStyle, styleObject);
  }

  ngOnInit() {

  }

  /**
   * When a dimension of div changes, fit a terminal in div.
   */
  ngAfterViewChecked() {
    let dims = this.fitAddon.proposeDimensions();
    if (isNaN(dims.rows) || dims.rows == Infinity || isNaN(dims.cols) || dims.cols == Infinity) {
      this.terminal.resize(10, 10);
    } else if (!this.displayOption.fixedGrid) {
      this.fitAddon.fit();
    } else {
      this.terminal.resize(this.displayOption.fixedGrid.cols, this.displayOption.fixedGrid.rows);
      let xtermScreen = this.terminal.element.getElementsByClassName('xterm-screen')[0];
      let scrollArea = this.terminal.element.getElementsByClassName('xterm-scroll-area')[0];
      let terminal = this.terminal.element;
      const contentWidth = xtermScreen.clientWidth;
      const scrollWidth = terminal.clientWidth - scrollArea.clientWidth;
      this.setTerminalDimensions(undefined, undefined, contentWidth + scrollWidth, undefined);
    }
  }

  /**
   * It creates new terminal in #terminal.
   */
  ngAfterViewInit() {
    this.fitAddon = new FitAddon();
    if (!this.terminal) {
      this.terminal = new Terminal({ scrollback: this.scrollback });
    }
    this.terminal.open(this.terminalDiv.nativeElement);
    this.terminal.loadAddon(this.fitAddon);
    this.observableSetup();
  }

  /**
   * clean all resources
   */
  ngOnDestroy(): void {
    this.keyInputSubjectSubscription?.unsubscribe();
    this.dataSourceSubscription?.unsubscribe();
    this.keyEventSubjectSubscription?.unsubscribe();
    this.termSnippetSubscription?.unsubscribe();
  }

  write(chars: string | Uint8Array) {
    this.terminal.write(chars);
  }

  setDisplayOption(opt: DisplayOption) {
    if (opt) {
      if (opt.fixedGrid != null) {
        console.debug("resizable will be ignored.");
        this.setTerminalBlock(false);
        this.removeTerminalDimensions();
      } else {
        this.setTerminalBlock(true);
      }
      this.displayOption = opt;
    } else
      console.warn(`A falsy option is not allowed`);
  }

  get keyInput(): Observable<string> {
    return this.keyInputSubject;
  }

  get keyEventInput(): Observable<{ key: string; domEvent: KeyboardEvent; }> {
    return this.keyEventSubject;
  }

  get underlying(): Terminal {
    return this.terminal;
  }

  get isDraggableOnEdgeActivated() {
    return this.displayOption.activateDraggableOnEdge != undefined && this.displayOption.fixedGrid == undefined;
  }

  /**
   * After user coordinate dimensions of terminal, it's called.
   * @param left 
   * @param top 
   * @param width 
   * @param height 
   */
  onResizeEnd(left: number, top: number, width: number, height: number): void {
    this.setTerminalDimensions(left, top, width, height);
  }

  /**
   * Before onResizeEnd is called, it valiates dimensions to change.
   * @param re dimension to be submitted from resizable stuff
   */
  validatorFactory(): (re: ResizeEvent) => boolean {
    const comp = this;
    return (re: ResizeEvent) => {
      const displayOption = comp.displayOption;
      if (displayOption.activateDraggableOnEdge) {
        let left = re.rectangle.left, top = re.rectangle.top, width = re.rectangle.width, height = re.rectangle.height;
        if ((width < displayOption.activateDraggableOnEdge.minWidth) || (height < displayOption.activateDraggableOnEdge.minHeight)) {
          return false;
        } else return true;
      }
    }
  }
}

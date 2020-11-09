import { sprintf } from 'sprintf-js';

export class Colors {

    // Basic
    static readonly Black = "\u001b[30;1m";
    static readonly Red = "\u001b[31;1m";
    static readonly Green = "\u001b[32;1m";
    static readonly Yellow = "\u001b[33;1m";
    static readonly Blue = "\u001b[34;1m";
    static readonly Magenta = "\u001b[35;1m";
    static readonly Cyan = "\u001b[36;1m";
    static readonly White = "\u001b[37;1m";
    static readonly Reset = "\u001b[0m";

    // Clear
    static readonly ClearLine = "\u001b[%dK";

    // Direction
    static readonly Up = "\u001b[%dA";
    static readonly Down = "\u001b[%dB";
    static readonly Right = "\u001b[%dC";
    static readonly Left = "\u001b[%dD";

    // Style
    static readonly Bold = "\u001b[1m";
    static readonly Underline = "\u001b[4m";
    static readonly Reversed = "\u001b[7m";

    // Macros
    static readonly INFO = Colors.Bold+Colors.Cyan+"[*] "+Colors.Reset;
    static readonly WARN = Colors.Bold+Colors.Red+"[!] "+Colors.Reset;

    static clearEndOfLine() {
        return sprintf(this.ClearLine,  0);
    }

    static clearStartOfLine() {
        return sprintf(this.ClearLine, 1);
    }

    static clearEntireLine() {
        return sprintf(this.ClearLine, 2);
    }

    static upN(n: number) {
        return sprintf(this.Up, n);
    }

    static downN(n: number) {
        return sprintf(this.Down, n);
    }

    static leftN(n: number) {
        return sprintf(this.Left, n);
    }

    static rightN(n: number) {
        return sprintf(this.Right, n);
    }

}
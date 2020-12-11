/**
 * options for dimensions of terminal.
 * fixedGrid has high priority than activateDraggableOnEdge's
 */
export interface DisplayOption{
    fixedGrid?: {rows: number, cols: number};
    activateDraggableOnEdge?: {
        minWidth: number,
        minHeight: number
    }
}
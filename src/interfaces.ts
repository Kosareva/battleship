export type Board = number[][];

export enum Player {
    PLAYER = 'player',
    COMPUTER = 'computer'
}

export type Boards = {
    [key in Player]: Board;
};

export interface ComputerMove {
    playerBoard: Board;
    hits: {};
}

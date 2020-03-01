export type Board = number[][];

export enum Player {
    PLAYER = 'player',
    COMPUTER = 'computer'
}

export type Boards = {
    [key in Player]: [string, Board];
};

export interface ComputerMove {
    playerBoard: number[];
    hits: {};
}

import {Board, Boards, Player} from './interfaces';
import {EMPTY, GAME_SIZE, NUMBER_OF_SHIP_PARTS} from './constants';
import {concat, fromEvent, interval, noop, of, pipe} from 'rxjs';
import {filter, map, scan, take, tap} from 'rxjs/operators';

// TODO: rename col to cell wherever needed

/*
rows: [
 [col, col, col],
 [col, col, col],
 [col, col, col],
]
  y     y     y     y
x x1y1  x1y2  x1y3  x1y4
x x2y1  x2y1  x2y1  x2y1
x x3y1  x3y1  x3y1  x3y1
x x4y1  x4y1  x4y1  x4y1
 */

const board = [
    ['x1y1', 'x1y2', 'x1y3', 'x1y4'],
    ['x2y1', 'x2y2', 'x2y3', 'x2y4'],
    ['x3y1', 'x3y2', 'x3y3', 'x3y4'],
    ['x4y1', 'x4y2', 'x4y3', 'x4y4'],
];

// ship = 1
// x = 1
// y = 1

const isThereEnoughSpaceForNextMove = (
    board: Board,
    ship: number,
    x: number,
    y: number
) => {
    const row = [...board[x]]; // ['x2y1', 'x2y2', 'x2y3', 'x2y4']
    row[y] = ship; // ['x2y1', 1, 'x2y3', 'x2y4']
    const col = board.map(r => r.filter((c, i) => i === y)[0]); // use find instead
    // [                   [
    //   ['x1y2'],          'x1y2',
    //   ['x2y2'],    =>    'x2y2',
    //   ['x3y2'],          'x3y2',
    //   ['x4y2'],          'x4y2',
    // ]                   ]
    col[x] = ship; // col[1] = 1
    // [
    //  'x1y2',
    //   1,
    //  'x3y2',
    //  'x4y2',
    // ]

    const shipStartInCol = col.indexOf(ship); // 1
    const shipEndInCol = col.lastIndexOf(ship); // 1
    const shipStartInRow = row.indexOf(ship); // 1
    const shipEndInRow = row.lastIndexOf(ship); // 1

    // checks for available space for a ship
    const checkSpace = (arr, start, end) => {
        const startIndex = arr.lastIndexOf(
            (e, i) => e !== EMPTY && e !== ship && i < start
        ); // TODO: bug? always returns -1
        const endIndex = arr.findIndex(
            (e, i) => e !== EMPTY && e !== ship && i > end
        );
        const room = arr.slice(startIndex + 1, endIndex);
        return room.length >= ship;
    };

    return shipStartInCol !== shipEndInCol
        ? checkSpace(col, shipStartInCol, shipEndInCol)
        : shipStartInRow !== shipEndInRow
            ? checkSpace(row, shipStartInRow, shipEndInRow)
            : true;

};

// change to take row or col
const getTwoValidMoves = (row: number[], ship: number): [number, number] => [
    row.indexOf(ship) - 1,
    row.lastIndexOf(ship) + 1
];

const getValidMoves = (
    expectedPlayer: Player,
    boards: Boards,
    ship: number,
    // what does name needed for?
    [name, x, y]
): any[] => {
    const board = boards[expectedPlayer];
    const rowIndex = board.findIndex(r => r.some(c => c === ship));
    if (!isThereEnoughSpaceForNextMove(board, ship, x, y)) {
        return [];
    }
    if (rowIndex >= 0) {
        const row = board[rowIndex];
        const colIndex = row.findIndex(c => c === ship);

        const isHorizontal = row[colIndex - 1] === ship || row[colIndex + 1] === ship;
        if (isHorizontal) {
            const [left, right] = getTwoValidMoves(row, ship);
            return [
                {x: rowIndex, y: left},
                {x: rowIndex, y: right},
            ];
        }

        const isVertical =
            (board[rowIndex - 1] ? board[rowIndex - 1][colIndex] === ship : false) ||
            (board[rowIndex + 1] ? board[rowIndex + 1][colIndex] === ship : false);
        if (isVertical) {
            // use get by col index instead of filter
            const [up, down] = getTwoValidMoves(
                board.map(r => r.filter((c, j) => j === colIndex)[0]),
                ship
            );
            return [
                {x: up, y: colIndex},
                {x: down, y: colIndex},
            ];
        }

        return [
            {x: rowIndex, y: colIndex - 1},
            {x: rowIndex, y: colIndex + 1},
            {x: rowIndex - 1, y: colIndex},
            {x: rowIndex + 1, y: colIndex},
        ];

    }

    return [
        {x: x, y: y}
    ];

};

const isCellEmpty = (boards: Boards, [name, x, y]): boolean => boards[name][x][y] === EMPTY;

const areSpacesAroundCellEmpty = (boards: Boards, [name, x, y]): boolean => (board =>
    (board[x - 1] && board[x - 1][y] === EMPTY) ||
    (board[x + 1] && board[x + 1][y] === EMPTY) ||
    board[x][y - 1] === EMPTY ||
    board[x][y + 1] === EMPTY)(boards[name]);

const canMove = (
    expectedPlayer: Player,
    boards: Boards,
    ship: number,
    [name, x, y]
): boolean => {
    if (!isCellEmpty(boards, [name, x, y]) || name !== expectedPlayer) {
        return false;
    }

    const validMoves = getValidMoves(expectedPlayer, boards, ship, [name, x, y]);
    const isValidMove = validMoves.some(e => e.x === x && e.y === y);

    return isValidMove;
};

// RXJS

// player as Player, not string
const addShips$ = (player: Player, boards: Boards) =>
    pipe(
        map((e: string) => e.split(',')),
        filter(e => e.length === 3),
        map(e => [e[0], parseInt(e[1]), parseInt(e[2])]),
        scan(
            (a, coords: any) => (
                (a.validMove =
                        a.shipPartsLeft > 0
                            ? canMove(player, boards, a.ship, coords)
                            : isCellEmpty(boards, coords) &&
                            (a.ship - 1 === 1 || areSpacesAroundCellEmpty(boards, coords))
                ),
                    a.validMove
                        ? a.shipPartsLeft > 0
                        ? (a.shipPartsLeft -= 1)
                        : ((a.ship = a.ship - 1), (a.shipPartsLeft = a.ship - 1))
                        : noop,
                    (a.coords = coords),
                    a
            ),
            {
                ship: 5,
                shipPartsLeft: 5,
                coords: [],
                validMove: true,
            }
        ), // scan
        filter(({validMove}) => validMove),
        map(
            ({ship, coords}) => (
                (boards[player][coords[1]][coords[2]] = ship), boards
            )
        ),
        paintBoards,
        take(NUMBER_OF_SHIP_PARTS)
    );

const playerSetup$ = (boards: Boards) =>
    fromEvent(document, 'click')
        .pipe(
            validClicks$,
            addShips$(Player.PLAYER, boards)
        );

const computerSetup$ = (boards: Boards) =>
    interval()
        .pipe(
            tap(i => (i % 70 === 0 ? (playerScoreContainer.innerHTML += '.') : noop)),
            map(_ => `${Player.COMPUTER}, ${random()}, ${random()}`),
            addShips$(Player.COMPUTER, boards)
        );

const info$ = (container: HTMLElement, text: string) =>
    of({})
        .pipe(
            tap(_ => (container.innerHTML = text))
        );

const createBoard = () =>
    Array(GAME_SIZE)
        .fill(EMPTY)
        .map(_ => Array(GAME_SIZE).fill(EMPTY));

export const emptyBoards$ = of({});

export const setup$ = (boards: Boards) =>
    concat(
        info$(computerScoreContainer, 'Setup your board!'),
        playerSetup$(boards),
        info$(playerScoreContainer, 'Computer setting up!'),
        computerSetup$(boards)
    );

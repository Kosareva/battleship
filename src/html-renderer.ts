import { EMPTY, HIT, MISS, NUMBER_OF_SHIP_PARTS } from './constants';
import { Board, Boards, Player } from './interfaces';
import { BehaviorSubject, pipe } from 'rxjs';
import { computerScore$ } from './game';
import { tap } from 'rxjs/operators';

const byId = (id: string): HTMLElement => document.getElementById(id);
export const computerScoreContainer = byId('computer_score');
export const playerScoreContainer = byId('player_score');

const playerCells = (cell: number): string | number =>
    cell !== EMPTY ? (cell === MISS ? 'o' : cell === HIT ? 'x' : cell) : '_';
const computerCells = (cell: number): string =>
    cell === HIT || cell === MISS ? (cell === MISS ? 'o' : 'x') : '_';

export const paintBoard = (
    container: HTMLElement,
    playerName: string,
    board: Board,
) => (
    (container.innerHTML = ''),
        board.forEach((r, i) =>
            r.forEach(
                (c, j) =>
                    (container.innerHTML += `
                <div id=${playerName},${i},${j}
                style="float: left; margin-left: 5px">
                ${playerName === Player.PLAYER ? playerCells(c) : computerCells(c)}
                </div>`),
                (container.innerHTML += '<br/>')
            )
        ),
        (container.innerHTML += '<br/><br/>')
);

export const paintShipsInfo = (scoreSubject: BehaviorSubject<any>) =>
    Object.keys(scoreSubject.value.ships).reduce(
        (a, c) => ((a += `<b>${c} </b>: ${scoreSubject.value.ships[c]} | `), a),
        ''
    );

export const paintScores = (
    computerScore: BehaviorSubject<any>,
    playerScore: BehaviorSubject<any>
) => ((c: HTMLElement, p: HTMLElement) => (
    (c.innerHTML = ''),
        (c.innerHTML += 'Computer score: ' + computerScore.value.score + '<br/>'),
        paintShipsInfo(computerScore),
        (c.innerHTML += 'Ships: ' + paintShipsInfo(computerScore)),
        (p.innerHTML = ''),
        (p.innerHTML += 'Player score: ' + playerScore.value.score + '<br/>'),
        (p.innerHTML += 'Ships: ' + paintShipsInfo(playerScore))
))(computerScoreContainer, playerScoreContainer);

export const paintBoards = (boards: Boards) => (
    (console.log(boards)),
        paintBoard(byId('player_board'), Player.PLAYER, boards[Player.PLAYER]),
        paintBoard(byId('computer_board'), Player.COMPUTER, boards[Player.COMPUTER])
);

export const paintBoards$ = pipe<any, any>(tap(paintBoards));

export const displayGameOver = (computerScore: BehaviorSubject<any>) => () => {
    const gameOverText = `GAME OVER,
        ${
        computerScore.value.score === NUMBER_OF_SHIP_PARTS
            ? 'Computer'
            : 'Player'
    }
        won`;
    playerScoreContainer.innerHTML = gameOverText;
    computerScoreContainer.innerHTML = gameOverText;
};

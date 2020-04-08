import { emptyBoards$, setup$ } from './setup';
import { displayGameOver, paintBoards$ } from './html-renderer';
import { finalize, switchMap, takeWhile, tap } from 'rxjs/operators';
import { Boards } from './interfaces';
import { concat, merge } from 'rxjs';
import { computerScore$, isNotGameOver, playerScore$, shots$ } from './game';

const game$ = emptyBoards$
    .pipe(
        tap(res => console.log(res)),
        paintBoards$,
        switchMap((boards: Boards) =>
            concat(
                setup$(boards),
                shots$(boards)
            ).pipe(
                takeWhile(isNotGameOver),
                finalize(displayGameOver(computerScore$))
            )
        )
    );

merge(game$, computerScore$, playerScore$).subscribe();

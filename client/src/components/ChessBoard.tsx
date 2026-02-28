import { useCallback, useMemo, useState } from 'react'
import type { Board, CastlingRights, Coord, PieceColor } from '../types/chess'
import { getLegalMoves } from '../types/chess'
import './ChessBoard.css'

const PIECE_SYMBOLS: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
}

interface ChessBoardProps {
  board: Board
  turn: PieceColor
  castlingRights?: CastlingRights
  lastMove?: { from: Coord; to: Coord } | null
  aiFlash?: { from: Coord; to: Coord } | null
  onMove?: (from: Coord, to: Coord) => void
  disabled?: boolean
  checkedColor?: PieceColor | null
}

export default function ChessBoard({
  board,
  turn,
  castlingRights,
  lastMove = null,
  aiFlash = null,
  onMove,
  disabled = false,
  checkedColor = null,
}: ChessBoardProps) {
  const [selected, setSelected] = useState<Coord | null>(null)

  const legalMoves = useMemo(() => {
    if (!selected) return new Set<string>()
    const moves = getLegalMoves(board, selected, turn, castlingRights)
    return new Set(moves.map(([r, c]) => `${r}-${c}`))
  }, [board, castlingRights, selected, turn])

  const handleSquareClick = useCallback(
    (row: number, col: number) => {
      if (disabled) return
      const coord: Coord = [row, col]
      const key = `${row}-${col}`

      if (selected) {
        const [sr, sc] = selected
        if (sr === row && sc === col) {
          setSelected(null)
          return
        }
        if (legalMoves.has(key)) {
          onMove?.(selected, coord)
          setSelected(null)
          return
        }
      }

      const piece = board[row][col]
      if (piece && piece.color === turn) setSelected(coord)
      else setSelected(null)
    },
    [board, disabled, legalMoves, onMove, selected, turn]
  )

  const isLastMoveSquare = lastMove
    ? (r: number, c: number) =>
        (lastMove.from[0] === r && lastMove.from[1] === c) ||
        (lastMove.to[0] === r && lastMove.to[1] === c)
    : () => false

  return (
    <div className="chess-board-wrap">
      <div className="chess-board-glow" />
      <div className="chess-board" role="grid" aria-label="Chess board">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 1
            const isSelected =
              selected !== null &&
              selected[0] === rowIndex &&
              selected[1] === colIndex
            const isLegal = legalMoves.has(`${rowIndex}-${colIndex}`)
            const isLast = isLastMoveSquare(rowIndex, colIndex)
            const isAiFlash = aiFlash
              ? (aiFlash.from[0] === rowIndex && aiFlash.from[1] === colIndex) ||
                (aiFlash.to[0] === rowIndex && aiFlash.to[1] === colIndex)
              : false
            const isCheckedKing =
              checkedColor !== null &&
              piece &&
              piece.color === checkedColor &&
              piece.kind === 'K'

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                className={[
                  'square',
                  isLight ? 'square--light' : 'square--dark',
                  isSelected && 'square--selected',
                  isLegal && 'square--legal',
                  isLast && 'square--last',
                  isAiFlash && 'square--ai-flash',
                  isCheckedKing && 'square--check',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                aria-label={
                  piece
                    ? `${piece.color === 'w' ? 'White' : 'Black'} ${piece.kind} at ${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`
                    : `Empty square ${String.fromCharCode(97 + colIndex)}${8 - rowIndex}`
                }
              >
                <span className="square-coord square-coord--file">
                  {colIndex === 0 ? 8 - rowIndex : ''}
                </span>
                <span className="square-coord square-coord--rank">
                  {rowIndex === 7 ? String.fromCharCode(97 + colIndex) : ''}
                </span>
                {isLegal && !board[rowIndex][colIndex] && (
                  <span className="square-dot" aria-hidden />
                )}
                {isLegal && board[rowIndex][colIndex] && (
                  <span className="square-capture" aria-hidden />
                )}
                {piece && (
                  <span
                    className={`piece piece--${piece.color}`}
                    data-kind={piece.kind}
                  >
                    {PIECE_SYMBOLS[`${piece.color}${piece.kind}`]}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

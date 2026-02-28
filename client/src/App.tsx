import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Board, CastlingRights, Coord, PieceColor } from './types/chess'
import { createInitialBoard, getLegalMoves, isCheckmate, isInCheck, isStalemate } from './types/chess'
import ChessBoard from './components/ChessBoard'
import './App.css'

export default function App() {
  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [turn, setTurn] = useState<PieceColor>('w')
  const [lastMove, setLastMove] = useState<{ from: Coord; to: Coord } | null>(null)
  const [aiFlash, setAiFlash] = useState<{ from: Coord; to: Coord } | null>(null)
  const [castlingRights, setCastlingRights] = useState<CastlingRights>({
    w: { k: true, q: true },
    b: { k: true, q: true },
  })
  const agentColor: PieceColor = 'b'
  const aiMoveDelayMs = 1500

  const inCheck = isInCheck(board, turn)
  const checkmate = isCheckmate(board, turn, castlingRights)
  const stalemate = isStalemate(board, turn, castlingRights)

  const allLegalMoves = useMemo(() => {
    const moves: Array<{ from: Coord; to: Coord }> = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (!piece || piece.color !== turn) continue
        const legal = getLegalMoves(board, [r, c], turn, castlingRights)
        for (const to of legal) moves.push({ from: [r, c], to })
      }
    }
    return moves
  }, [board, castlingRights, turn])

  const handleMove = useCallback((from: Coord, to: Coord) => {
    setBoard((prev) => {
      const next = prev.map((row) => [...row])
      const [fr, fc] = from
      const [tr, tc] = to
      const piece = next[fr][fc]
      if (!piece) return prev

      if (piece.kind === 'K' && Math.abs(tc - fc) === 2) {
        const rookFromCol = tc > fc ? 7 : 0
        const rookToCol = tc > fc ? tc - 1 : tc + 1
        next[tr][rookToCol] = next[tr][rookFromCol]
        next[tr][rookFromCol] = null
      }

      next[tr][tc] = piece
      next[fr][fc] = null

      if (piece.kind === 'P' && (tr === 0 || tr === 7)) {
        next[tr][tc] = { color: piece.color, kind: 'Q' }
      }

      return next
    })

    setCastlingRights((prev) => {
      const next = {
        w: { ...prev.w },
        b: { ...prev.b },
      }
      const [fr, fc] = from
      const [tr, tc] = to
      const movingPiece = board[fr][fc]
      const captured = board[tr][tc]

      if (movingPiece?.kind === 'K') {
        next[movingPiece.color].k = false
        next[movingPiece.color].q = false
      }
      if (movingPiece?.kind === 'R') {
        if (movingPiece.color === 'w' && fr === 7 && fc === 0) next.w.q = false
        if (movingPiece.color === 'w' && fr === 7 && fc === 7) next.w.k = false
        if (movingPiece.color === 'b' && fr === 0 && fc === 0) next.b.q = false
        if (movingPiece.color === 'b' && fr === 0 && fc === 7) next.b.k = false
      }
      if (captured?.kind === 'R') {
        if (captured.color === 'w' && tr === 7 && tc === 0) next.w.q = false
        if (captured.color === 'w' && tr === 7 && tc === 7) next.w.k = false
        if (captured.color === 'b' && tr === 0 && tc === 0) next.b.q = false
        if (captured.color === 'b' && tr === 0 && tc === 7) next.b.k = false
      }
      return next
    })

    setLastMove({ from, to })
    setTurn((t) => (t === 'w' ? 'b' : 'w'))
  }, [board])

  useEffect(() => {
    if (turn !== agentColor) return
    if (checkmate || stalemate) return
    if (allLegalMoves.length === 0) return
    const choice = allLegalMoves[Math.floor(Math.random() * allLegalMoves.length)]
    setAiFlash({ from: choice.from, to: choice.to })
    let clearTimer: number | undefined
    const moveTimer = window.setTimeout(() => {
      handleMove(choice.from, choice.to)
      clearTimer = window.setTimeout(() => setAiFlash(null), 450)
    }, aiMoveDelayMs)
    return () => {
      window.clearTimeout(moveTimer)
      if (clearTimer) window.clearTimeout(clearTimer)
    }
  }, [agentColor, allLegalMoves, checkmate, handleMove, stalemate, turn])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Chess<span className="app-title-accent">Ai</span></h1>
        <p className="app-turn">
          {turn === 'w' ? 'White' : 'Black'} to move
        </p>
        {checkmate && (
          <p className="app-status">Checkmate. {turn === 'w' ? 'Black' : 'White'} wins.</p>
        )}
        {!checkmate && stalemate && (
          <p className="app-status">Stalemate. Draw.</p>
        )}
        {!checkmate && !stalemate && inCheck && (
          <p className="app-status">Check.</p>
        )}
      </header>
      <main className="app-main">
        <ChessBoard
          board={board}
          turn={turn}
          castlingRights={castlingRights}
          lastMove={lastMove}
          aiFlash={aiFlash}
          onMove={handleMove}
          disabled={checkmate || stalemate || turn === agentColor}
          checkedColor={inCheck ? turn : null}
        />
      </main>
      <footer className="app-footer">
        <p>May the best agent win.</p>
      </footer>
    </div>
  )
}

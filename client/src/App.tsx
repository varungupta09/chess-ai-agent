import { useCallback, useState } from 'react'
import type { Board, Coord, PieceColor } from './types/chess'
import { createInitialBoard } from './types/chess'
import ChessBoard from './components/ChessBoard'
import './App.css'

export default function App() {
  const [board, setBoard] = useState<Board>(createInitialBoard)
  const [turn, setTurn] = useState<PieceColor>('w')
  const [lastMove, setLastMove] = useState<{ from: Coord; to: Coord } | null>(null)

  const handleMove = useCallback((from: Coord, to: Coord) => {
    setBoard((prev) => {
      const next = prev.map((row) => [...row])
      const [fr, fc] = from
      const [tr, tc] = to
      const piece = next[fr][fc]
      if (!piece) return prev
      next[tr][tc] = piece
      next[fr][fc] = null
      return next
    })
    setLastMove({ from, to })
    setTurn((t) => (t === 'w' ? 'b' : 'w'))
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Chess<span className="app-title-accent">Ai</span></h1>
        <p className="app-turn">
          {turn === 'w' ? 'White' : 'Black'} to move
        </p>
      </header>
      <main className="app-main">
        <ChessBoard
          board={board}
          turn={turn}
          lastMove={lastMove}
          onMove={handleMove}
        />
      </main>
      <footer className="app-footer">
        <p>May the best agent win.</p>
      </footer>
    </div>
  )
}

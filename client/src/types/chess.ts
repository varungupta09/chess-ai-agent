export type PieceColor = 'w' | 'b'
export type PieceKind = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'

export interface Piece {
  color: PieceColor
  kind: PieceKind
}

export type Square = Piece | null
export type Board = (Square)[][]  // [row][col], row 0 = top (white back rank)

export type Coord = [number, number]  // [row, col]

export function coordToKey([r, c]: Coord): string {
  return `${r}-${c}`
}

export function keyToCoord(key: string): Coord {
  const [r, c] = key.split('-').map(Number)
  return [r, c]
}

export function createInitialBoard(): Board {
  const back = (color: PieceColor): Square[] => [
    { color, kind: 'R' },
    { color, kind: 'N' },
    { color, kind: 'B' },
    { color, kind: 'Q' },
    { color, kind: 'K' },
    { color, kind: 'B' },
    { color, kind: 'N' },
    { color, kind: 'R' },
  ]
  const pawns = (color: PieceColor): Square[] =>
    Array(8).fill(null).map(() => ({ color, kind: 'P' }))
  const empty = (): Square[] => Array(8).fill(null)

  return [
    back('b'),
    pawns('b'),
    empty(),
    empty(),
    empty(),
    empty(),
    pawns('w'),
    back('w'),
  ]
}

export function getLegalMoves(board: Board, from: Coord, turn: PieceColor): Coord[] {
  const [r, c] = from
  const piece = board[r]?.[c]
  if (!piece || piece.color !== turn) return []

  const moves: Coord[] = []
  const add = (nr: number, nc: number) => {
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) moves.push([nr, nc])
  }

  switch (piece.kind) {
    case 'P': {
      const dir = piece.color === 'w' ? -1 : 1
      const startRow = piece.color === 'w' ? 6 : 1
      if (!board[r + dir]?.[c]) {
        add(r + dir, c)
        if (r === startRow && !board[r + 2 * dir]?.[c]) add(r + 2 * dir, c)
      }
      for (const dc of [-1, 1]) {
        const cap = board[r + dir]?.[c + dc]
        if (cap && cap.color !== piece.color) add(r + dir, c + dc)
      }
      break
    }
    case 'N': {
      for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])
        add(r + dr, c + dc)
      break
    }
    case 'K': {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) add(r + dr, c + dc)
      break
    }
    case 'R':
    case 'Q': {
      for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        let nr = r + dr, nc = c + dc
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          add(nr, nc)
          if (board[nr][nc]) break
          nr += dr; nc += dc
        }
      }
      if (piece.kind === 'Q') {
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          let nr = r + dr, nc = c + dc
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            add(nr, nc)
            if (board[nr][nc]) break
            nr += dr; nc += dc
          }
        }
      }
      break
    }
    case 'B':
      for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
        let nr = r + dr, nc = c + dc
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          add(nr, nc)
          if (board[nr][nc]) break
          nr += dr; nc += dc
        }
      }
      break
    default:
      break
  }

  return moves.filter(([nr, nc]) => {
    const target = board[nr][nc]
    return !target || target.color !== piece.color
  })
}

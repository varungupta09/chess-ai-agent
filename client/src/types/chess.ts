export type PieceColor = 'w' | 'b'
export type PieceKind = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P'

export interface Piece {
  color: PieceColor
  kind: PieceKind
}

export type Square = Piece | null
export type Board = (Square)[][]  // [row][col], row 0 = top (white back rank)

export type Coord = [number, number]  // [row, col]

export interface CastlingRights {
  w: { k: boolean; q: boolean }
  b: { k: boolean; q: boolean }
}

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

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice())
}

function applyMove(board: Board, from: Coord, to: Coord): Board {
  const next = cloneBoard(board)
  const [fr, fc] = from
  const [tr, tc] = to
  const piece = next[fr][fc]
  if (!piece) return next

  next[tr][tc] = piece
  next[fr][fc] = null

  if (piece.kind === 'K' && Math.abs(tc - fc) === 2) {
    const rookFromCol = tc > fc ? 7 : 0
    const rookToCol = tc > fc ? tc - 1 : tc + 1
    next[tr][rookToCol] = next[tr][rookFromCol]
    next[tr][rookFromCol] = null
  }

  if (piece.kind === 'P' && (tr === 0 || tr === 7)) {
    next[tr][tc] = { color: piece.color, kind: 'Q' }
  }
  return next
}

function getPseudoLegalMoves(board: Board, from: Coord): Coord[] {
  const [r, c] = from
  const piece = board[r]?.[c]
  if (!piece) return []

  const moves: Coord[] = []
  const add = (nr: number, nc: number) => {
    if (inBounds(nr, nc)) moves.push([nr, nc])
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
        while (inBounds(nr, nc)) {
          add(nr, nc)
          if (board[nr][nc]) break
          nr += dr; nc += dc
        }
      }
      if (piece.kind === 'Q') {
        for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
          let nr = r + dr, nc = c + dc
          while (inBounds(nr, nc)) {
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
        while (inBounds(nr, nc)) {
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

function findKing(board: Board, color: PieceColor): Coord | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece && piece.color === color && piece.kind === 'K') return [r, c]
    }
  }
  return null
}

function isSquareAttacked(board: Board, target: Coord, byColor: PieceColor): boolean {
  const [tr, tc] = target
  const dir = byColor === 'w' ? -1 : 1

  for (const dc of [-1, 1]) {
    const pr = tr - dir
    const pc = tc - dc
    if (inBounds(pr, pc)) {
      const pawn = board[pr][pc]
      if (pawn && pawn.color === byColor && pawn.kind === 'P') return true
    }
  }

  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const nr = tr + dr
    const nc = tc + dc
    if (!inBounds(nr, nc)) continue
    const knight = board[nr][nc]
    if (knight && knight.color === byColor && knight.kind === 'N') return true
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = tr + dr
      const nc = tc + dc
      if (!inBounds(nr, nc)) continue
      const king = board[nr][nc]
      if (king && king.color === byColor && king.kind === 'K') return true
    }
  }

  const rookDirs: Coord[] = [[-1,0],[1,0],[0,-1],[0,1]]
  for (const [dr, dc] of rookDirs) {
    let nr = tr + dr
    let nc = tc + dc
    while (inBounds(nr, nc)) {
      const piece = board[nr][nc]
      if (piece) {
        if (piece.color === byColor && (piece.kind === 'R' || piece.kind === 'Q')) return true
        break
      }
      nr += dr
      nc += dc
    }
  }

  const bishopDirs: Coord[] = [[-1,-1],[-1,1],[1,-1],[1,1]]
  for (const [dr, dc] of bishopDirs) {
    let nr = tr + dr
    let nc = tc + dc
    while (inBounds(nr, nc)) {
      const piece = board[nr][nc]
      if (piece) {
        if (piece.color === byColor && (piece.kind === 'B' || piece.kind === 'Q')) return true
        break
      }
      nr += dr
      nc += dc
    }
  }

  return false
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color)
  if (!kingPos) return false
  const enemy: PieceColor = color === 'w' ? 'b' : 'w'
  return isSquareAttacked(board, kingPos, enemy)
}

function wouldLeaveKingInCheck(board: Board, from: Coord, to: Coord, color: PieceColor): boolean {
  const next = applyMove(board, from, to)
  return isInCheck(next, color)
}

export function getLegalMoves(
  board: Board,
  from: Coord,
  turn: PieceColor,
  castlingRights?: CastlingRights
): Coord[] {
  const [r, c] = from
  const piece = board[r]?.[c]
  if (!piece || piece.color !== turn) return []

  const moves = getPseudoLegalMoves(board, from)

  if (piece.kind === 'K' && castlingRights) {
    const rights = castlingRights[turn]
    const backRank = turn === 'w' ? 7 : 0
    if (r === backRank && c === 4 && !isInCheck(board, turn)) {
      if (rights.k) {
        const rook = board[backRank][7]
        const empty1 = !board[backRank][5]
        const empty2 = !board[backRank][6]
        if (rook && rook.color === turn && rook.kind === 'R' && empty1 && empty2) {
          const passSafe = !isSquareAttacked(board, [backRank, 5], turn === 'w' ? 'b' : 'w') &&
            !isSquareAttacked(board, [backRank, 6], turn === 'w' ? 'b' : 'w')
          if (passSafe) moves.push([backRank, 6])
        }
      }
      if (rights.q) {
        const rook = board[backRank][0]
        const empty1 = !board[backRank][1]
        const empty2 = !board[backRank][2]
        const empty3 = !board[backRank][3]
        if (rook && rook.color === turn && rook.kind === 'R' && empty1 && empty2 && empty3) {
          const passSafe = !isSquareAttacked(board, [backRank, 3], turn === 'w' ? 'b' : 'w') &&
            !isSquareAttacked(board, [backRank, 2], turn === 'w' ? 'b' : 'w')
          if (passSafe) moves.push([backRank, 2])
        }
      }
    }
  }

  return moves.filter((to) => !wouldLeaveKingInCheck(board, from, to, turn))
}

export function hasAnyLegalMove(
  board: Board,
  color: PieceColor,
  castlingRights?: CastlingRights
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== color) continue
      if (getLegalMoves(board, [r, c], color, castlingRights).length > 0) return true
    }
  }
  return false
}

export function isCheckmate(board: Board, color: PieceColor, castlingRights?: CastlingRights): boolean {
  return isInCheck(board, color) && !hasAnyLegalMove(board, color, castlingRights)
}

export function isStalemate(board: Board, color: PieceColor, castlingRights?: CastlingRights): boolean {
  return !isInCheck(board, color) && !hasAnyLegalMove(board, color, castlingRights)
}

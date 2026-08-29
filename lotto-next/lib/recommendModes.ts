import type { RecommendMode } from '@/types/lotto'

// Single source of truth for everything mode-specific that more than one layer
// needs (server route, generators, recommender UI, results UI). Importable from
// client code — keep it free of generators/DB code.

export interface ModeOdds {
  // P(at least one game on the slip matches 3+), all exact over C(45,6) draws.
  // These are LAYOUT-specific: re-enumerate if `games` ever changes.
  slip: number        // this mode's layout
  independent: number // same number of independent random games
  single: number      // one game
}

export interface ModeConfig {
  key: RecommendMode
  label: string
  desc: string
  games: number       // games returned per recommendation (1 = single game)
  maxExclude: number  // 45 - 6 * games for disjoint layouts; 38 for single games
  odds?: ModeOdds     // only for multi-game (slip) modes
}

const SINGLE_MAX_EXCLUDE = 38
// A Korean lotto slip physically holds 5 games (A–E) = 5,000원. Hard ceiling
// for a disjoint layout is 7 games (45 / 6); do not add a larger mode.
export const TARGET5_GAMES = 5
export const TARGET5_MAX_EXCLUDE = 45 - 6 * TARGET5_GAMES

export const MODE_CONFIGS: ModeConfig[] = [
  {
    key: 'stats', label: '통계 기반', games: 1, maxExclude: SINGLE_MAX_EXCLUDE,
    desc: '자주 나온 번호와 최근 보너스 번호를 피하고, 저빈도·중간 빈도 번호를 섞어 추천합니다.',
  },
  {
    key: 'exception', label: '제외 기반', games: 1, maxExclude: SINGLE_MAX_EXCLUDE,
    desc: '통계 기반 규칙에 더해 8회차 전 당첨 번호에서 하나를 골라 변화를 줍니다.',
  },
  {
    key: 'random', label: '랜덤', games: 1, maxExclude: SINGLE_MAX_EXCLUDE,
    desc: '1~45에서 완전 무작위로 6개를 뽑습니다.',
  },
  {
    key: 'target5', label: '5등 노리기', games: TARGET5_GAMES, maxExclude: TARGET5_MAX_EXCLUDE,
    desc: '5게임(5,000원) 한 장의 30개 번호를 서로 겹치지 않게 짜서, 5등(3개 일치) 당첨 확률을 가장 높이는 배치예요.',
    // Exact enumeration over all 8,145,060 draws (see lib/recommend.ts).
    odds: { slip: 11.87, independent: 11.36, single: 2.38 },
  },
]

export const MODE_KEYS = MODE_CONFIGS.map(m => m.key) as readonly RecommendMode[]

export function isRecommendMode(v: string): v is RecommendMode {
  return (MODE_KEYS as readonly string[]).includes(v)
}

export function modeConfig(mode: RecommendMode): ModeConfig {
  return MODE_CONFIGS.find(m => m.key === mode)!
}

// Game labels A, B, C… derived, so a future 7-game mode never renders undefined.
export function gameLabel(i: number): string {
  return String.fromCharCode(65 + i)
}

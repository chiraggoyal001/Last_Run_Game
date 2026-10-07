import { GAME_CONFIG } from '../game/GameConfig';

export type PoliceArchetypeId = 'patrol_sedan' | 'interceptor' | 'pursuit_suv' | 'heavy_pursuit';

export interface PoliceArchetype {
  id: PoliceArchetypeId;
  name: string;
  damage: number;
  health: number;
  speedMultiplier: number;
  steerRate: number;
  threatCost: number;
  width: number;
  length: number;
  color: string;
}

export const POLICE_ARCHETYPES: Record<PoliceArchetypeId, PoliceArchetype> = {
  patrol_sedan: GAME_CONFIG.POLICE.PATROL_SEDAN,
  interceptor: GAME_CONFIG.POLICE.INTERCEPTOR,
  pursuit_suv: GAME_CONFIG.POLICE.PURSUIT_SUV,
  heavy_pursuit: GAME_CONFIG.POLICE.HEAVY_PURSUIT
};

export interface VehicleDimensions {
  width: number;
  length: number;
  wheelbase: number;
}

export const GAME_CONFIG = {
  // Canvas / Viewport
  TARGET_FPS: 60,
  FIXED_DELTA: 1 / 60,

  // Player Vehicle Physics
  PLAYER: {
    MAX_HEALTH: 100,
    COLLISION_COOLDOWN_SEC: 0.5,
    MAX_FORWARD_SPEED: 420, // Pixels per second
    MAX_REVERSE_SPEED: 420 * 0.45, // 45% of forward speed = 189
    FORWARD_ACCELERATION: 260, // Automatic forward drive
    BRAKE_DECELERATION: 540, // Active braking
    REVERSE_ACCELERATION: 220, // Reversing acceleration
    NATURAL_FRICTION: 70, // Passive road friction
    LATERAL_GRIP: 0.88, // Drift friction damping
    BASE_STEER_RATE: 2.8, // Radians per sec at low speed
    HIGH_SPEED_STEER_DAMPING: 0.45, // Reduction at max speed
    DIMENSIONS: {
      width: 28,
      length: 52,
      wheelbase: 36
    }
  },

  // Obstacles
  OBSTACLES: {
    DAMAGE: 10,
    TYPES: {
      ROCK: { name: 'Rock', radius: 18, color: '#6b7280' },
      BARRIER: { name: 'Barrier', width: 68, length: 22, color: '#f59e0b' },
      ABANDONED_CAR: { name: 'Abandoned Car', width: 30, length: 54, color: '#b91c1c' },
      DEBRIS_CLUSTER: { name: 'Debris Cluster', radius: 24, color: '#78716c' }
    }
  },

  // Police Types & Balance (Configurable in one place)
  POLICE: {
    PATROL_SEDAN: {
      id: 'patrol_sedan',
      name: 'Patrol Sedan',
      damage: 8,
      health: 32,
      speedMultiplier: 0.96, // 96% of player max speed
      steerRate: 2.3,
      threatCost: 1,
      width: 28,
      length: 50,
      color: '#1e293b'
    },
    INTERCEPTOR: {
      id: 'interceptor',
      name: 'Interceptor',
      damage: 12,
      health: 44,
      speedMultiplier: 1.08, // 108% of player max speed (can overtake)
      steerRate: 2.8,
      threatCost: 1,
      width: 26,
      length: 52,
      color: '#0f172a'
    },
    PURSUIT_SUV: {
      id: 'pursuit_suv',
      name: 'Pursuit SUV',
      damage: 18,
      health: 75,
      speedMultiplier: 0.90, // 90% of player max speed
      steerRate: 1.6,
      threatCost: 1,
      width: 34,
      length: 58,
      color: '#111827'
    },
    HEAVY_PURSUIT: {
      id: 'heavy_pursuit',
      name: 'Heavy Pursuit',
      damage: 25,
      health: 140,
      speedMultiplier: 0.80, // Heavy battering ram
      steerRate: 1.2,
      threatCost: 2, // Counts as 2 threat units
      width: 42,
      length: 70,
      color: '#020617'
    }
  },

  // Boxed-In Capture System
  CAPTURE: {
    PROXIMITY_RADIUS: 160, // Distance to consider a police car boxing in
    STALL_SPEED_THRESHOLD: 420 * 0.25, // Player speed < 105 px/s counts as low speed
    REQUIRED_POLICE_COUNT: 3,
    CAPTURE_TIME_SEC: 1.8 // 1.8 seconds trapped = BUSTED
  },

  // Health Pickup System
  HEALTH_PICKUP: {
    RESTORE_AMOUNT: 50,
    MAX_CAP: 100,
    SPAWN_INTERVAL_MIN_SEC: 20,
    SPAWN_INTERVAL_MAX_SEC: 30,
    HIGH_HP_DELAY_THRESHOLD: 85, // If HP > 85, delay spawn
    HIGH_HP_DELAY_SEC: 12,
    RADIUS: 18
  },

  // Difficulty & Spawn Director
  DIFFICULTY: {
    TIME_BASE_DIVISOR: 45, // Difficulty = 1 + SurvivalSecs / 45
    MAX_POLICE_TIERS: [
      { timeSec: 30, maxThreat: 2 },
      { timeSec: 60, maxThreat: 3 },
      { timeSec: 120, maxThreat: 4 },
      { timeSec: Infinity, maxThreat: 5 }
    ],
    BASE_SPAWN_INTERVAL_SEC: 6.5,
    MIN_SPAWN_INTERVAL_SEC: 2.8
  },

  // Scoring
  SCORING: {
    SURVIVAL_PTS_PER_SEC: 10,
    POLICE_DESTROYED_PTS: 100,
    NEAR_MISS_PTS: 25,
    NEAR_MISS_DISTANCE: 48,
    NEAR_MISS_COOLDOWN_SEC: 1.2
  },

  // Procedural World & Chunks
  WORLD: {
    CHUNK_SIZE: 800, // Square chunk size
    VISIBLE_CHUNK_RADIUS: 2, // Load 2 chunks ahead/around
    ROAD_WIDTH: 720,
    LANE_COUNT: 5
  }
} as const;

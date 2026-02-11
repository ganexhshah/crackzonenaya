import { api } from '@/lib/api';

export interface Scrim {
  id: string;
  title: string;
  description?: string;
  teamId?: string;
  team?: {
    id: string;
    name: string;
    tag: string;
    logo?: string;
  };
  opponentName: string;
  matchType: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  scheduledAt: string;
  startedAt?: string;
  endedAt?: string;
  result?: string;
  score?: string;
  roomId?: string;
  roomPassword?: string;
  scrimConfig?: ScrimConfig;
  createdAt: string;
  updatedAt: string;
  players?: ScrimPlayer[];
  _count?: {
    players: number;
  };
}

export interface ScrimPlayer {
  id: string;
  matchId: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  kills: number;
  deaths: number;
  assists: number;
  damage: number;
}

export interface ScrimConfig {
  basicInformation: {
    scrimCode?: string;
    scrimType: 'SOLO' | 'SQUAD';
    gameMode: 'BATTLE_ROYALE' | 'CLASH_SQUAD';
    mapSelection: 'BERMUDA' | 'PURGATORY' | 'ALPINE' | 'RANDOM';
    organizerName?: string;
    contactLink?: string;
    shortRules?: string;
    fullRules?: string;
    description?: string;
  };
  dateTimeSettings: {
    matchDate: string;
    matchTime: string;
    registrationOpenTime?: string;
    registrationCloseTime?: string;
    countdownAutoEnable: boolean;
    timezone: string;
  };
  slotConfiguration: {
    totalSlots?: number;
    totalTeamSlots?: number;
    playersPerTeam?: number;
    allowSubstitute?: boolean;
    waitlistEnable: boolean;
    waitlistLimit?: number;
    autoSlotAssign: boolean;
  };
  entryPrizeSettings: {
    entryType: 'FREE' | 'PAID';
    entryFeeAmount?: number;
    paymentMethods: string[];
    paymentDeadline?: string;
    firstPrizeAmount?: number;
    secondPrizeAmount?: number;
    thirdPrizeAmount?: number;
    mvpPrizeAmount?: number;
    prizeDescription?: string;
  };
  pointsSystemSetup: {
    mode: 'PRESET' | 'CUSTOM';
    placementPoints?: Record<string, number>;
    killPoints: number;
    bonusPoints?: number;
    tieBreakerRule?: string;
  };
  matchFormat: {
    totalMatches: number;
    mapMode: 'SAME_MAP' | 'DIFFERENT_MAP';
    mapsByMatch?: string[];
    pointsMode: 'CUMULATIVE' | 'PER_MATCH';
    dropLowestMatchPoints?: boolean;
  };
  roomControlSettings: {
    roomIdVisibility: 'MANUAL_RELEASE' | 'AUTO_RELEASE';
    autoReleaseMinutesBefore?: number;
    manualReleasePolicy?: 'ADMIN_CLICK_ONLY';
    roomDetailsVisibility?: 'APPROVED_ONLY' | 'ALL_REGISTERED';
    roomPasswordChangeNotes?: string;
    allowRoomPasswordChange: boolean;
    lockRoomDetailsAfterRelease: boolean;
  };
  registrationRules: {
    requireVerifiedAccount: boolean;
    allowMultipleRegistrations: boolean;
    allowBannedPlayers: boolean;
    blockDuplicateUid?: boolean;
    registrationLimitPerTeam?: number;
    minimumLevelRequirement?: number;
    autoApproveRegistration: boolean;
  };
  penaltyFairPlayRules: {
    disqualificationRules?: string;
    lateEntryRule?: string;
    lateJoinGraceMinutes?: number;
    teamReplacementRule?: string;
    emulatorAllowed: boolean;
    hackSuspicionPolicy?: string;
    cheatingReportAllowed?: boolean;
    penaltyPoints?: number;
    penaltyReason?: string;
    disqualifyToggle?: boolean;
    disqualifyReason?: string;
  };
  scrimStatusControls: {
    visibilityStatus: 'DRAFT' | 'PUBLISHED';
    lifecycleStatus: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  };
  visibilityPromotion: {
    featureOnHomepage: boolean;
    featuredPriority?: number;
    highlightBadge?: string;
    bannerImage?: string;
    sponsorLogos: string[];
  };
  advancedOptions: {
    maxKillLimitPerMatch?: number;
    tiebreakerRule?: string;
    manualResultEditingAllowed: boolean;
    resultEditLockAfterPublish?: boolean;
    screenshotProofRequired: boolean;
    autoLeaderboardUpdate: boolean;
    enableLivePointsTracking: boolean;
  };
}

export interface CreateScrimData {
  title: string;
  description?: string;
  teamId?: string;
  opponentName?: string;
  scheduledAt: string;
  roomId?: string;
  roomPassword?: string;
  status?: string;
  scrimConfig?: ScrimConfig;
}

export interface UpdateScrimData {
  title?: string;
  description?: string;
  opponentName?: string;
  scheduledAt?: string;
  roomId?: string;
  roomPassword?: string;
  status?: string;
  result?: string;
  score?: string;
  scrimConfig?: ScrimConfig;
}

export interface UpdatePlayerStatsData {
  kills?: number;
  deaths?: number;
  assists?: number;
  damage?: number;
}

class ScrimService {
  async getPublicScrims(): Promise<Scrim[]> {
    const response = await api.get<Scrim[]>('/scrims/public');
    return response;
  }

  async getScrims(params?: { status?: string; type?: string; search?: string }): Promise<Scrim[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/scrims?${queryString}` : '/scrims';
    
    const response = await api.get<Scrim[]>(endpoint);
    return response;
  }

  async getScrim(id: string): Promise<Scrim> {
    const response = await api.get<Scrim>(`/scrims/${id}/public`);
    return response;
  }

  async getScrimAdmin(id: string): Promise<Scrim> {
    const response = await api.get<Scrim>(`/scrims/${id}`);
    return response;
  }

  async createScrim(data: CreateScrimData): Promise<Scrim> {
    const response = await api.post<Scrim>('/scrims', data);
    return response;
  }

  async updateScrim(id: string, data: UpdateScrimData): Promise<Scrim> {
    const response = await api.put<Scrim>(`/scrims/${id}`, data);
    return response;
  }

  async deleteScrim(id: string): Promise<void> {
    await api.delete<void>(`/scrims/${id}`);
  }

  async updateRoomDetails(id: string, roomId: string, roomPassword?: string): Promise<Scrim> {
    const response = await api.put<Scrim>(`/scrims/${id}/room`, { roomId, roomPassword });
    return response;
  }

  async addPlayer(scrimId: string, userId: string): Promise<ScrimPlayer> {
    const response = await api.post<ScrimPlayer>(`/scrims/${scrimId}/players`, { userId });
    return response;
  }

  async updatePlayerStats(scrimId: string, playerId: string, data: UpdatePlayerStatsData): Promise<ScrimPlayer> {
    const response = await api.put<ScrimPlayer>(`/scrims/${scrimId}/players/${playerId}`, data);
    return response;
  }
}

export const scrimService = new ScrimService();

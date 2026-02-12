import { api } from "@/lib/api";

export type CustomRoomType = "CUSTOM_ROOM" | "LONE_WOLF";
export type CustomRoomTeamSize = "ONE_V_ONE" | "TWO_V_TWO" | "THREE_V_THREE" | "FOUR_V_FOUR";
export type CustomRoomStatus =
  | "OPEN"
  | "WAITING_JOIN"
  | "READY_TO_START"
  | "STARTED"
  | "RESULT_SUBMITTED"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED"
  | "CANCELLED";

export type CustomRoom = {
  id: string;
  type: CustomRoomType;
  status: CustomRoomStatus;
  creatorId: string;
  opponentId?: string | null;
  teamSize: CustomRoomTeamSize;
  rounds: number;
  throwableLimit: boolean;
  characterSkill: boolean;
  headshotOnly: boolean;
  gunAttributes: boolean;
  coinSetting: number;
  roomMaker: "ME" | "OPPONENT";
  entryFee: number;
  odds: number;
  payout: number;
  creatorReady: boolean;
  opponentReady: boolean;
  roomId?: string | null;
  roomPassword?: string | null;
  resultScreenshotUrl?: string | null;
  winnerSide?: "CREATOR" | "OPPONENT" | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: string; username: string; gameId?: string; gameName?: string };
  opponent?: { id: string; username: string; gameId?: string; gameName?: string } | null;
};

export const customRoomService = {
  async createRoom(input: {
    type: CustomRoomType;
    teamSize: CustomRoomTeamSize;
    rounds: number;
    throwableLimit: boolean;
    characterSkill: boolean;
    headshotOnly: boolean;
    gunAttributes: boolean;
    coinSetting: number;
    roomMaker: "ME" | "OPPONENT";
    entryFee: number;
  }): Promise<CustomRoom> {
    return api.post("/custom-rooms", input);
  },

  async listMyRooms(): Promise<CustomRoom[]> {
    return api.get("/custom-rooms/my");
  },

  async listOpenRooms(): Promise<CustomRoom[]> {
    return api.get("/custom-rooms/open");
  },

  async joinRoom(id: string): Promise<CustomRoom> {
    return api.post(`/custom-rooms/${id}/join`, {});
  },

  async ready(id: string): Promise<CustomRoom> {
    return api.post(`/custom-rooms/${id}/ready`, {});
  },

  async setRoomDetails(id: string, input: { roomId: string; roomPassword?: string }): Promise<CustomRoom> {
    return api.post(`/custom-rooms/${id}/room`, input);
  },

  async submitResult(id: string, input: { winnerSide: "CREATOR" | "OPPONENT"; screenshot: File }): Promise<CustomRoom> {
    const form = new FormData();
    form.append("winnerSide", input.winnerSide);
    form.append("screenshot", input.screenshot);

    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const normalizedApiUrl = rawApiUrl.replace(/\/$/, "");
    const API_URL = normalizedApiUrl.endsWith("/api") ? normalizedApiUrl : `${normalizedApiUrl}/api`;

    const headers: HeadersInit = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/custom-rooms/${encodeURIComponent(id)}/result`, {
      method: "POST",
      headers,
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || "Failed to submit result");
    return data as CustomRoom;
  },
};

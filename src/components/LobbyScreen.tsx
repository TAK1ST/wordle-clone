import React, { useState } from "react";
import { UserPlus } from "lucide-react";

interface LobbyScreenProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  onJoinRoom: (roomId: string) => void;
  isConnecting: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  playerName,
  setPlayerName,
  onJoinRoom,
  isConnecting,
}) => {
  const [roomId, setRoomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    console.log(params.get("roomId"));
    return params.get("roomId") || "";
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
           Word Play In Free 
          </h1>
          <p className="text-gray-600">Nhập tên và mã phòng để tham gia</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên người chơi
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlayerName(e.currentTarget.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập tên của bạn..."
              maxLength={100}
              disabled={isConnecting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã phòng
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.currentTarget.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mã phòng..."
              maxLength={20}
              disabled={isConnecting}
            />
          </div>

          <button
            onClick={() => onJoinRoom(roomId || `room_${Date.now()}`)}
            disabled={isConnecting || !playerName.trim() || !roomId.trim()}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang kết nối...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Tham gia phòng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
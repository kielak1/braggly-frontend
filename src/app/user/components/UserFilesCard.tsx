// components/UserFilesCard.tsx
"use client";

import { FC } from "react";

interface Props {
  userId: number;
  userName: string;
  balance: number;
  role: string;
  freeAccess: boolean;
}

const UserFilesCard: FC<Props> = () => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[180px]">
      <h2 className="font-semibold text-lg mb-2">📂 My XRD files</h2>
      <p className="text-sm text-gray-500">Placeholder for user file list</p>
    </div>
  );
};

export default UserFilesCard;
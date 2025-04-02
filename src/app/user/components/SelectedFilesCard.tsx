// components/SelectedFilesCard.tsx
"use client";

import { FC } from "react";

interface Props {
  userId: number;
  userName: string;
  balance: number;
  role: string;
  freeAccess: boolean;
}

const SelectedFilesCard: FC<Props> = () => {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm min-h-[200px]">
      <h2 className="font-semibold text-lg mb-2">
        📊 Files selected for analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 min-h-[100px] rounded bg-gray-50">
          filelist
        </div>
        <div className="border p-4 min-h-[100px] rounded bg-gray-50">
          button area – analysis options
        </div>
      </div>
    </div>
  );
};

export default SelectedFilesCard;

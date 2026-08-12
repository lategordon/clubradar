'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { IdeaBacklogView } from '@/components/ideas/IdeaBacklogView';

export default function IdeasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar activeTab="ideas" />
      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        <IdeaBacklogView />
      </main>
    </div>
  );
}

'use client';

import { useState, useOptimistic } from 'react';
import { Orbit, Users, Star, GraduationCap } from 'lucide-react';

interface OrbitButtonProps {
  userId: string;
  userName: string;
  isOrbited: boolean;
  isAligned: boolean;
  isMentor: boolean;
  onOrbitChange?: (isOrbited: boolean) => void;
}

export function OrbitButton({ 
  userId, 
  userName, 
  isOrbited, 
  isAligned, 
  isMentor,
  onOrbitChange 
}: OrbitButtonProps) {
  const [optimisticOrbited, addOptimisticOrbit] = useOptimistic(
    isOrbited,
    (state, action: { type: 'toggle' }) => {
      if (action.type === 'toggle') {
        return !state;
      }
      return state;
    }
  );

  const handleOrbit = async () => {
    addOptimisticOrbit({ type: 'toggle' });
    const newIsOrbited = !optimisticOrbited;

    try {
      const response = await fetch(`/api/orbit/${userId}`, {
        method: newIsOrbited ? 'POST' : 'DELETE',
      });
      
      if (!response.ok) {
        // Revert on error
        addOptimisticOrbit({ type: 'toggle' });
      } else {
        onOrbitChange?.(newIsOrbited);
      }
    } catch (error) {
      // Revert on error
      addOptimisticOrbit({ type: 'toggle' });
    }
  };

  // Determine button state and styling
  if (isMentor) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium"
      >
        <GraduationCap className="h-4 w-4" />
        Mentor
      </button>
    );
  }

  if (isAligned) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
      >
        <Star className="h-4 w-4" />
        Aligned
      </button>
    );
  }

  if (optimisticOrbited) {
    return (
      <button
        onClick={handleOrbit}
        className="flex items-center gap-2 px-4 py-2 bg-sky-100 text-sky-700 rounded-lg text-sm font-medium hover:bg-sky-200 transition-colors"
      >
        <Orbit className="h-4 w-4 fill-current" />
        In Your Orbit
      </button>
    );
  }

  return (
    <button
      onClick={handleOrbit}
      className="flex items-center gap-2 px-4 py-2 border border-border bg-card rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
    >
      <Orbit className="h-4 w-4" />
      Add to Orbit
    </button>
  );
}

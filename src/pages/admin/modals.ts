import { useState } from 'react';
import type { Appointment } from '@/types';

export function useRefuseModal() {
  const [apt, setApt] = useState<Appointment | null>(null);
  return {
    apt,
    open: (a: Appointment) => setApt(a),
    close: () => setApt(null),
  };
}

export function useProposeModal() {
  const [apt, setApt] = useState<Appointment | null>(null);
  return {
    apt,
    open: (a: Appointment) => setApt(a),
    close: () => setApt(null),
  };
}

export function useDelayModal() {
  const [apt, setApt] = useState<Appointment | null>(null);
  return {
    apt,
    open: (a: Appointment) => setApt(a),
    close: () => setApt(null),
  };
}

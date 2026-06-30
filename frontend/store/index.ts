import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organisation, Project } from "@/types";

interface AppState {
  activeOrg: Organisation | null;
  activeProject: Project | null;
  activeEnv: string;
  setActiveOrg: (org: Organisation | null) => void;
  setActiveProject: (project: Project | null) => void;
  setActiveEnv: (env: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeOrg: null,
      activeProject: null,
      activeEnv: "development",
      setActiveOrg: (org) => set({ activeOrg: org }),
      setActiveProject: (project) => set({ activeProject: project }),
      setActiveEnv: (env) => set({ activeEnv: env }),
    }),
    { name: "envvault-store" }
  )
);

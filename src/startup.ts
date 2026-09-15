export type StartupTimerContext = {
  isTauri: boolean;
  isBackgroundLaunch: boolean;
};

export const shouldAutoStartTimer = ({ isTauri, isBackgroundLaunch }: StartupTimerContext) =>
  !isTauri || isBackgroundLaunch;

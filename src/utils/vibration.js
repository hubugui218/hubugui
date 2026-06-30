// 震动/触觉反馈工具 — 使用 React Native 内置 Vibration API

import { Vibration, Platform } from 'react-native';

/**
 * 倒计时结束时的震动提醒
 */
export function timerAlert() {
  if (Platform.OS === 'ios') {
    Vibration.vibrate(500);
  } else {
    Vibration.vibrate([0, 200, 100, 200]);
  }
}

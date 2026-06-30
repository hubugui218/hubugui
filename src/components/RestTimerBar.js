// 组间歇倒计时底部栏
// 支持跳过、+30秒、快速切换时长、结束本动作

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

const QUICK_TIMES = [30, 60, 90, 120];

export default function RestTimerBar() {
  const { state, skipRest, addRestTime, setRestTime, completeExercise } = useWorkout();
  const { colors: c } = useTheme();
  const { restTimer } = state;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (restTimer.isActive && restTimer.remainingSeconds <= 5 && restTimer.remainingSeconds > 0) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [restTimer.remainingSeconds, restTimer.isActive]);

  if (!restTimer.isActive) return null;

  const remainingText = restTimer.remainingSeconds >= 60
    ? `${Math.floor(restTimer.remainingSeconds / 60)}:${String(restTimer.remainingSeconds % 60).padStart(2, '0')}`
    : `${restTimer.remainingSeconds}`;

  const isUrgent = restTimer.remainingSeconds <= 5;
  const isLongRest = restTimer.remainingSeconds >= 60;

  return (
    <View style={[styles.container, { backgroundColor: c.restBarBg, borderTopColor: c.border }]}>
      {/* 主倒计时显示 + 操作按钮行 */}
      <View style={styles.mainRow}>
        {/* 结束休息（跳过） */}
        <TouchableOpacity
          style={[styles.sideBtn, { borderColor: c.border, backgroundColor: c.panel }]}
          onPress={skipRest}
          activeOpacity={0.7}
        >
          <Text style={[styles.sideText, { color: c.textSecondary }]}>结束休息</Text>
        </TouchableOpacity>

        {/* 倒计时数字 */}
        <View style={styles.timerCenter}>
          <Animated.Text
            style={[
              styles.timerText,
              { color: colors.warning },
              isUrgent && styles.timerTextUrgent,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            {remainingText}
          </Animated.Text>
          <Text style={[styles.timerUnit, { color: c.textSecondary }]}>
            {isLongRest ? '' : '秒'}
          </Text>
        </View>

        {/* 结束本动作 */}
        <TouchableOpacity
          style={[styles.sideBtn, { borderColor: colors.danger, backgroundColor: c.panel }]}
          onPress={() => completeExercise(restTimer.exerciseId)}
          activeOpacity={0.7}
        >
          <Text style={[styles.sideText, { color: colors.danger }]}>结束动作</Text>
        </TouchableOpacity>
      </View>

      {/* 快捷时长切换 */}
      <View style={styles.quickRow}>
        {QUICK_TIMES.map((seconds) => (
          <TouchableOpacity
            key={seconds}
            style={[
              styles.quickButton,
              { borderColor: c.border, backgroundColor: c.panel },
              restTimer.restDuration === seconds && styles.quickButtonActive,
            ]}
            onPress={() => setRestTime(seconds)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.quickText,
                { color: c.textSecondary },
                restTimer.restDuration === seconds && styles.quickTextActive,
              ]}
            >
              {seconds >= 60 ? `${seconds / 60}分` : `${seconds}秒`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.restBarBg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    backgroundColor: colors.panel,
    minWidth: 70,
    alignItems: 'center',
  },
  sideText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  timerCenter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  timerText: {
    color: colors.warning,
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerTextUrgent: {
    color: colors.danger,
  },
  timerUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginLeft: spacing.xs,
    marginBottom: spacing.xs,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  quickButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.rail,
    backgroundColor: colors.panel,
  },
  quickButtonActive: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.warning,
  },
  quickText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  quickTextActive: {
    color: colors.warning,
    fontWeight: '600',
  },
});

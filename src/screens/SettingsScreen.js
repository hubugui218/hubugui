// 设置页
// 默认组间歇时间、倒计时提醒、重量单位

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { themes, colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useWorkout } from '../context/WorkoutContext';
import { useTheme } from '../context/ThemeContext';

const REST_TIME_OPTIONS = [30, 45, 60, 90, 120, 180];

function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const c = themes[mode];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: c.panel, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: c.border }}>
      <View>
        <Text style={{ color: c.text, fontSize: fontSize.md }}>{mode === 'dark' ? '🌙 深色模式' : '☀️ 浅色模式'}</Text>
        <Text style={{ color: c.textMuted, fontSize: fontSize.xs, marginTop: 2 }}>点击右侧开关切换</Text>
      </View>
      <Switch
        value={mode === 'light'}
        onValueChange={toggle}
        trackColor={{ false: c.surfaceLight, true: colors.primaryDark }}
        thumbColor={mode === 'light' ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { state, updateSettings } = useWorkout();
  const { settings } = state;
  const { colors: c } = useTheme();

  const [localSettings, setLocalSettings] = useState({ ...settings });

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const handleRestTimeChange = (seconds) => {
    const updated = { ...localSettings, defaultRestSeconds: seconds };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  const handleTimerAlertChange = (value) => {
    const updated = { ...localSettings, timerAlertEnabled: value };
    setLocalSettings(updated);
    updateSettings(updated);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>设置</Text>
        </View>

        {/* 默认组间歇时间 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>默认组间歇时间</Text>
          <Text style={[styles.sectionDesc, { color: c.textMuted }]}>
            每完成一组后自动启动的休息倒计时时长
          </Text>
          <View style={styles.restTimeGrid}>
            {REST_TIME_OPTIONS.map((seconds) => {
              const isActive = localSettings.defaultRestSeconds === seconds;
              let label;
              if (seconds < 60) {
                label = `${seconds} 秒`;
              } else if (seconds === 60) {
                label = '1 分钟';
              } else if (seconds === 90) {
                label = '1 分半';
              } else if (seconds === 120) {
                label = '2 分钟';
              } else {
                label = '3 分钟';
              }

              return (
                <TouchableOpacity
                  key={seconds}
                  style={[
                    styles.restTimeButton,
                    { backgroundColor: c.panel, borderColor: c.border },
                    isActive && styles.restTimeButtonActive,
                  ]}
                  onPress={() => handleRestTimeChange(seconds)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.restTimeText,
                      { color: c.textSecondary },
                      isActive && styles.restTimeTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 倒计时提醒 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>倒计时结束提醒</Text>
          <View style={[styles.settingRow, { backgroundColor: c.panel }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: c.text }]}>震动提醒</Text>
              <Text style={[styles.settingDesc, { color: c.textMuted }]}>
                倒计时结束时手机震动提醒
              </Text>
            </View>
            <Switch
              value={localSettings.timerAlertEnabled}
              onValueChange={handleTimerAlertChange}
              trackColor={{
                false: c.surfaceLight,
                true: colors.primaryDark,
              }}
              thumbColor={
                localSettings.timerAlertEnabled
                  ? colors.primary
                  : colors.textMuted
              }
            />
          </View>
        </View>

        {/* 主题切换 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>主题设置</Text>
          <ThemeToggle />
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>数据管理</Text>
          <Text style={[styles.settingDesc, { color: c.textMuted }]}>
            所有训练数据保存在手机本地，不会上传到云端。卸载 App 会丢失全部数据。
          </Text>
        </View>

        {/* 版本信息 */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>极简力训 v3.2</Text>
          <Text style={styles.versionDesc}>
            记录每一次训练，见证每一点进步
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },

  // 分区
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },

  // 休息时间选择
  restTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  restTimeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  restTimeButtonActive: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.primaryLight,
  },
  restTimeText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  restTimeTextActive: {
    color: colors.primaryLight,
    fontWeight: '600',
  },

  // 开关行
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    color: colors.text,
    fontSize: fontSize.md,
  },
  settingDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // 版本
  versionSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.xl,
  },
  versionText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  versionDesc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});

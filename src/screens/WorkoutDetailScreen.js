// 训练详情页
// 展示单次训练的完整记录：日期、时间、时长、动作和组数据

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDuration, formatDateTime, formatDurationLong } from '../utils/time';
import * as database from '../storage/database';

export default function WorkoutDetailScreen({ route, navigation }) {
  const { workoutId } = route.params;
  const { colors: c } = useTheme();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await database.getWorkout(workoutId);
      setWorkout(data);
      setLoading(false);
    }
    load();
  }, [workoutId]);

  const handleDelete = () => {
    Alert.alert('删除训练', '确定要删除这次训练记录吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await database.deleteWorkout(workoutId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!workout) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.notFoundText, { color: c.textMuted }]}>训练记录不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = workout.exercises?.reduce(
    (sum, ex) => sum + (ex.sets?.length || 0),
    0
  ) || 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: c.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 训练概览 */}
        <View style={[styles.overviewCard, { backgroundColor: c.panel, borderColor: c.border }]}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: c.textMuted }]}>训练日期</Text>
              <Text style={[styles.overviewValue, { color: c.text }]}>
                {formatDateTime(workout.recordDate || workout.startedAt).split(' ')[0]}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: c.textMuted }]}>总时长</Text>
              <Text style={[styles.overviewValueAccent, { color: colors.accent }]}>
                {formatDurationLong(workout.durationSeconds || 0)}
              </Text>
            </View>
          </View>
          <View style={styles.overviewRow}>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: c.textMuted }]}>开始时间</Text>
              <Text style={[styles.overviewValue, { color: c.text }]}>
                {formatDateTime(workout.startedAt).split(' ')[1] || '-'}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={[styles.overviewLabel, { color: c.textMuted }]}>结束时间</Text>
              <Text style={[styles.overviewValue, { color: c.text }]}>
                {workout.endedAt
                  ? formatDateTime(workout.endedAt).split(' ')[1] || '-'
                  : '-'}
              </Text>
            </View>
          </View>
          <View style={[styles.overviewStats, { borderTopColor: c.border }]}>
            <View style={styles.overviewStatItem}>
              <Text style={[styles.overviewStatValue, { color: colors.primary }]}>
                {workout.exercises?.length || 0}
              </Text>
              <Text style={[styles.overviewStatLabel, { color: c.textMuted }]}>动作</Text>
            </View>
            <View style={[styles.overviewStatDivider, { backgroundColor: c.border }]} />
            <View style={styles.overviewStatItem}>
              <Text style={[styles.overviewStatValue, { color: colors.primary }]}>{totalSets}</Text>
              <Text style={[styles.overviewStatLabel, { color: c.textMuted }]}>总组数</Text>
            </View>
          </View>
        </View>

        {/* 动作详情 */}
        {workout.exercises?.map((exercise) => (
          <View key={exercise.id} style={[styles.exerciseCard, { backgroundColor: c.panel, borderColor: c.border }]}>
            <View style={[styles.exerciseHeader, { borderBottomColor: c.border }]}>
              <View style={styles.exerciseBadge}>
                <Text style={styles.exerciseBadgeText}>{exercise.order}</Text>
              </View>
              <Text style={[styles.exerciseName, { color: c.text }]}>{exercise.name}</Text>
              <Text style={[styles.exerciseSetCount, { color: c.textMuted }]}>
                {exercise.sets?.length || 0} 组
              </Text>
            </View>

            {exercise.sets && exercise.sets.length > 0 ? (
              <View style={styles.setsList}>
                {exercise.sets.map((set) => (
                  <View key={set.id} style={[styles.setRow, { borderBottomColor: c.border }]}>
                    <Text style={[styles.setNumber, { color: c.textMuted }]}>第 {set.setNumber} 组</Text>
                    <View style={styles.setData}>
                      <Text style={[styles.setWeight, { color: colors.accent }]}>{set.weight} kg</Text>
                      <Text style={[styles.setTimes, { color: c.textMuted }]}>×</Text>
                      <Text style={[styles.setReps, { color: c.text }]}>{set.reps} 次</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noSetText, { color: c.textMuted }]}>没有组记录</Text>
            )}
          </View>
        ))}

        {/* 删除按钮 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteText}>删除此训练记录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // 概览卡片
  overviewCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  overviewItem: {
    flex: 1,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  overviewValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  overviewValueAccent: {
    color: colors.metric,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  overviewStatItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  overviewStatValue: {
    color: colors.primaryLight,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  overviewStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  overviewStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },

  // 动作卡片
  exerciseCard: {
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exerciseBadge: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  exerciseBadgeText: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  exerciseName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  exerciseSetCount: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  // 组列表
  setsList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  setNumber: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  setData: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  setWeight: {
    color: colors.metric,
    fontSize: fontSize.md,
    fontWeight: '500',
    minWidth: 50,
    textAlign: 'right',
  },
  setTimes: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  setReps: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  noSetText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    padding: spacing.md,
    textAlign: 'center',
  },

  // 删除
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    fontSize: fontSize.md,
  },
});

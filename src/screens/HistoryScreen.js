// 历史记录页
// 按日期展示历史训练列表

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDuration, formatDateTime, getRelativeDate, parseLocal, makeDateKey } from '../utils/time';
import * as database from '../storage/database';

export default function HistoryScreen({ navigation, route }) {
  const { colors: c } = useTheme();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const filterDate = route.params?.filterDate || null;

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        const data = await database.getAllWorkouts();
        const filtered = filterDate
          ? data.filter(w => makeDateKey(w.recordDate || w.startedAt) === filterDate)
          : data;
        setWorkouts(filtered);
        setLoading(false);
      }
      load();
    }, [filterDate])
  );

  const handleDelete = (workout) => {
    Alert.alert('删除训练', '确定要删除这次训练记录吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await database.deleteWorkout(workout.id);
          setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
        },
      },
    ]);
  };

  const renderWorkoutItem = ({ item, index }) => {
    const totalSets = item.exercises?.reduce(
      (sum, ex) => sum + (ex.sets?.length || 0),
      0
    ) || 0;

    // 同一天的训练只显示时间，不同天显示日期
    const showDateHeader =
      index === 0 ||
      parseLocal(item.recordDate || item.startedAt).toDateString() !==
        parseLocal(workouts[index - 1].recordDate || workouts[index - 1].startedAt).toDateString();

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {getRelativeDate(item.recordDate || item.startedAt)}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.workoutCard, { backgroundColor: c.panel, borderColor: c.border }]}
          onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id })}
          onLongPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTime, { color: c.text }]}>
              {formatDateTime(item.recordDate || item.startedAt)}
            </Text>
            <View style={styles.cardStats}>
              <Text style={[styles.cardStat, { color: c.textMuted }]}>
                {item.exercises?.length || 0} 个动作
              </Text>
              <Text style={[styles.cardStatSeparator, { color: c.textMuted }]}>·</Text>
              <Text style={[styles.cardStat, { color: c.textMuted }]}>{totalSets} 组</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.cardDuration}>
              {formatDuration(item.durationSeconds || 0)}
            </Text>
            <Text style={[styles.cardArrow, { color: c.textMuted }]}>›</Text>
          </View>
        </TouchableOpacity>
      </>
    );
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>
          {filterDate ? `${filterDate} 训练记录` : '历史记录'}
        </Text>
        <Text style={[styles.count, { color: c.textMuted }]}>{workouts.length} 次训练</Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>还没有训练记录</Text>
          <Text style={[styles.emptyHint, { color: c.textMuted }]}>完成一次训练后，记录会出现在这里</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  count: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },

  // 日期分组头
  dateHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  dateHeaderText: {
    color: colors.primaryLight,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },

  // 列表
  listContent: {
    paddingBottom: spacing.xxl,
  },

  // 训练卡片
  workoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.panel,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: {},
  cardTime: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cardStat: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  cardStatSeparator: {
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDuration: {
    color: colors.metric,
    fontSize: fontSize.md,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  cardArrow: {
    color: colors.textMuted,
    fontSize: fontSize.xl,
  },

  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSize.lg,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});

// 月结啦 — 本月训练总结，可展开查看每日详情
import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { formatDuration, formatDateTime, getRelativeDate, parseLocal, makeDateKey } from '../utils/time';
import * as database from '../storage/database';

export default function MonthSummaryScreen({ navigation }) {
  const { colors: c } = useTheme();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      database.getAllWorkouts().then(data => {
        setWorkouts(data);
        setLoading(false);
      });
    });
    database.getAllWorkouts().then(data => {
      setWorkouts(data);
      setLoading(false);
    });
    return unsub;
  }, [navigation]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const monthWorkouts = useMemo(() => {
    return workouts.filter(w => {
      const d = parseLocal(w.recordDate || w.startedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [workouts, year, month]);

  const dayGroups = useMemo(() => {
    const map = {};
    monthWorkouts.forEach(w => {
      const d = parseLocal(w.recordDate || w.startedAt);
      const key = makeDateKey(d);
      if (!map[key]) map[key] = { key, date: d, workouts: [], totalSets: 0, totalDuration: 0, exercises: 0 };
      const sets = w.exercises?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0;
      map[key].workouts.push(w);
      map[key].totalSets += sets;
      map[key].totalDuration += (w.durationSeconds || 0);
      map[key].exercises += (w.exercises?.length || 0);
    });
    return Object.values(map).sort((a, b) => b.date - a.date);
  }, [monthWorkouts]);

  const totalDays = dayGroups.length;
  const totalSets = dayGroups.reduce((s, g) => s + g.totalSets, 0);
  const totalDur = dayGroups.reduce((s, g) => s + g.totalDuration, 0);
  const totalEx = dayGroups.reduce((s, g) => s + g.exercises, 0);

  const monthLabel = `${year}年${month + 1}月`;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← 返回</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: c.text }]}>月结啦</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{monthLabel}</Text>
        </View>

        {/* 统计卡片 — 可点击展开 */}
        <TouchableOpacity
          style={styles.statsRow}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={[styles.statCard, { backgroundColor: c.panel, borderColor: c.border }]}>
            <Text style={[styles.statVal, { color: colors.primary }]}>{totalDays}</Text>
            <Text style={[styles.statLbl, { color: c.textMuted }]}>训练天数{expanded ? ' ▾' : ' ▸'}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.panel, borderColor: c.border }]}>
            <Text style={[styles.statVal, { color: colors.accent }]}>{totalEx}</Text>
            <Text style={[styles.statLbl, { color: c.textMuted }]}>总动作</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.panel, borderColor: c.border }]}>
            <Text style={[styles.statVal, { color: colors.accent }]}>{totalSets}</Text>
            <Text style={[styles.statLbl, { color: c.textMuted }]}>总组数</Text>
          </View>
        </TouchableOpacity>

        {/* 月度总时长 */}
        <View style={[styles.durCard, { backgroundColor: c.panel, borderColor: c.border }]}>
          <Text style={[styles.durLabel, { color: c.textMuted }]}>本月总训练时长</Text>
          <Text style={[styles.durValue, { color: colors.accent }]}>{formatDuration(totalDur)}</Text>
        </View>

        {/* 日期列表 — 展开时显示 */}
        {expanded && (
          <View style={styles.dateList}>
            <Text style={[styles.dateListTitle, { color: c.textSecondary }]}>训练日期</Text>
            {dayGroups.length === 0 ? (
              <Text style={[styles.emptyText, { color: c.textMuted }]}>本月还没有训练记录</Text>
            ) : (
              dayGroups.map(g => {
                const multi = g.workouts.length > 1;
                return (
                  <View key={g.key} style={[styles.dateGroup, { backgroundColor: c.panel, borderColor: c.border }]}>
                    {/* 日期摘要行 */}
                    <TouchableOpacity
                      style={styles.dateCardInner}
                      onPress={() => {
                        if (!multi) navigation.navigate('WorkoutDetail', { workoutId: g.workouts[0].id });
                      }}
                      activeOpacity={multi ? 1 : 0.7}
                      disabled={multi}
                    >
                      <View style={styles.dateLeft}>
                        <Text style={[styles.dateDay, { color: c.text }]}>
                          {g.date.getMonth() + 1}月{g.date.getDate()}日
                        </Text>
                        <Text style={[styles.dateMeta, { color: c.textMuted }]}>
                          {getRelativeDate(g.date)} · {g.workouts.length}次训练 · {g.exercises}动作 · {g.totalSets}组
                        </Text>
                      </View>
                      <View style={styles.dateRight}>
                        <Text style={[styles.dateDur, { color: colors.accent }]}>
                          {formatDuration(g.totalDuration)}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* 多次训练子条目 */}
                    {multi && (
                      <View style={[styles.subList, { borderTopColor: c.border }]}>
                        {g.workouts.map((w, wi) => {
                          const wSets = w.exercises?.reduce((s, e) => s + (e.sets?.length || 0), 0) || 0;
                          const wEx = w.exercises?.length || 0;
                          return (
                            <TouchableOpacity
                              key={w.id}
                              style={[styles.subCard, wi < g.workouts.length - 1 && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                              onPress={() => navigation.navigate('WorkoutDetail', { workoutId: w.id })}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.subTime, { color: c.textSecondary }]}>
                                {formatDateTime(w.startedAt)}
                              </Text>
                              <Text style={[styles.subMeta, { color: c.textMuted }]}>
                                {wEx}动作 · {wSets}组
                              </Text>
                              <Text style={[styles.subDur, { color: colors.accent }]}>
                                {formatDuration(w.durationSeconds || 0)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* 收起的提示 */}
        {!expanded && dayGroups.length > 0 && (
          <Text style={[styles.tapHint, { color: c.textMuted }]}>
            👆 点击上方「训练天数」查看具体日期
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.lg,
  },
  backText: { color: colors.primary, fontSize: fontSize.md, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '700' },
  subtitle: { fontSize: fontSize.sm, marginTop: spacing.xs },

  statsRow: { flexDirection: 'row', marginHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    flex: 1, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center',
    borderWidth: 1,
  },
  statVal: { fontSize: fontSize.xxl, fontWeight: '700' },
  statLbl: { fontSize: fontSize.xs, marginTop: 2 },

  durCard: {
    marginHorizontal: spacing.md, borderRadius: borderRadius.lg,
    padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md,
    borderWidth: 1,
  },
  durLabel: { fontSize: fontSize.xs, marginBottom: spacing.xs },
  durValue: { fontSize: fontSize.xxxl, fontWeight: '800', fontVariant: ['tabular-nums'] },

  dateList: {
    marginHorizontal: spacing.md,
    backgroundColor: 'transparent',
    paddingBottom: spacing.xxl,
  },
  dateListTitle: {
    fontSize: fontSize.sm, fontWeight: '600',
    marginBottom: spacing.sm, paddingLeft: spacing.xs,
  },
  dateGroup: {
    borderRadius: borderRadius.lg, marginBottom: spacing.sm,
    borderWidth: 1, overflow: 'hidden',
  },
  dateCardInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md,
  },
  dateLeft: { flex: 1 },
  dateDay: { fontSize: fontSize.md, fontWeight: '600' },
  dateMeta: { fontSize: fontSize.xs, marginTop: 2 },
  dateRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dateDur: { fontSize: fontSize.md, fontWeight: '600' },
  subList: {
    borderTopWidth: 1,
  },
  subCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
  },
  subTime: { fontSize: fontSize.sm, fontWeight: '500', width: 70 },
  subMeta: { fontSize: fontSize.xs, flex: 1, marginLeft: spacing.md },
  subDur: { fontSize: fontSize.sm, fontWeight: '600', width: 50, textAlign: 'right' },

  emptyText: { fontSize: fontSize.md, textAlign: 'center', paddingVertical: spacing.xl },
  tapHint: {
    textAlign: 'center', fontSize: fontSize.xs,
    paddingVertical: spacing.md,
  },
});

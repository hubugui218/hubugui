// 首页 — 本周训练视图 + 月历

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useWorkout } from '../context/WorkoutContext';
import * as database from '../storage/database';
import { getBodyParts, setBodyPart as saveBodyPart } from '../storage/database';
import { makeDateKey } from '../utils/time';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const BP_LABELS = { shoulders: '肩', legs: '腿', back: '背', chest: '胸' };
const BP_COLORS = { chest: '#FF3B30', back: '#007AFF', legs: '#34C759', shoulders: '#FF9500' };

const BP_OPTIONS = [
  { k: 'shoulders', icon: '💪', label: '肩', hint: '推举·侧平举', ac: BP_COLORS.shoulders },
  { k: 'chest',    icon: '🏋️', label: '胸', hint: '卧推·飞鸟',   ac: BP_COLORS.chest },
  { k: 'back',     icon: '🔙', label: '背', hint: '划船·引体',   ac: BP_COLORS.back },
  { k: 'legs',     icon: '🦵', label: '腿', hint: '深蹲·硬拉',   ac: BP_COLORS.legs },
];

export default function HomeScreen({ navigation }) {
  const { checkActiveWorkout } = useWorkout();
  const { colors: c } = useTheme();
  const [workouts, setWorkouts] = useState([]);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [bodyParts, setBodyParts] = useState({});
  const [partPicker, setPartPicker] = useState(null);
  const [dayPicker, setDayPicker] = useState(null);
  const [untrainedMenu, setUntrainedMenu] = useState(null); // { key, day, month }

  useEffect(() => {
    const load = () => {
      Promise.all([database.getAllWorkouts(), checkActiveWorkout(), getBodyParts()]).then(([all, active, bp]) => {
        setWorkouts(all);
        setHasActive(!!active);
        setBodyParts(bp || {});
        setLoading(false);
      });
    };
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation, checkActiveWorkout]);

  const trainedDates = useMemo(() => {
    const set = new Set();
    workouts.forEach(w => {
      set.add(makeDateKey(w.recordDate || w.startedAt));
    });
    return set;
  }, [workouts]);

  const today = new Date();
  const todayKey = makeDateKey(today);
  const isTodayTrained = trainedDates.has(todayKey);

  // ==================== 本周训练数据 ====================
  const weekDays = useMemo(() => {
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const key = makeDateKey(date);
      const isTrained = trainedDates.has(key);
      const bp = bodyParts[key] || null;
      const isToday = key === todayKey;

      let status, bpLabel, bpColor;
      if (isTrained && bp) {
        status = 'done'; bpLabel = BP_LABELS[bp] || bp; bpColor = BP_COLORS[bp] || colors.accent;
      } else if (isTrained && !bp) {
        status = 'done'; bpLabel = '已练'; bpColor = colors.accent;
      } else if (!isTrained && bp) {
        status = 'planned'; bpLabel = BP_LABELS[bp] || bp; bpColor = BP_COLORS[bp] || colors.primaryLight;
      } else {
        status = 'rest'; bpLabel = '休'; bpColor = c.textMuted;
      }

      days.push({
        date, key, isTrained, bodyPart: bp, isToday,
        status, bpLabel, bpColor,
        dow: i, dayNum: date.getDate(), month: date.getMonth(),
      });
    }
    return days;
  }, [trainedDates, bodyParts, todayKey, c.textMuted]);

  const weekSummary = useMemo(() => {
    const trainedCount = weekDays.filter(d => d.isTrained).length;
    const partCounts = {};
    weekDays.forEach(d => {
      if (d.isTrained && d.bodyPart) {
        partCounts[d.bodyPart] = (partCounts[d.bodyPart] || 0) + 1;
      }
    });
    const parts = [];
    ['chest', 'back', 'legs', 'shoulders'].forEach(p => {
      if (partCounts[p]) parts.push(`${BP_LABELS[p]} ${partCounts[p]}`);
    });
    const plain = weekDays.filter(d => d.isTrained && !d.bodyPart).length;
    if (plain > 0) parts.push(`已练 ${plain}`);
    if (parts.length === 0 && trainedCount > 0) parts.push(`已练 ${trainedCount}`);
    return { trainedCount, parts };
  }, [weekDays]);

  // ==================== 月历数据 ====================
  const calendar = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);
    return { year, month, cells, totalDays: lastDay.getDate() };
  }, [viewDate]);

  const monthLabel = `${calendar.year}年${calendar.month + 1}月`;

  const changeMonth = (delta) => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + delta);
    setViewDate(d);
  };

  const dateKey = (day) => makeDateKey(new Date(calendar.year, calendar.month, day));
  const isToday = (day) => day === today.getDate() && calendar.month === today.getMonth() && calendar.year === today.getFullYear();

  // 日历日点击分流
  const handleDayPress = (day) => {
    const key = dateKey(day);
    if (trainedDates.has(key)) {
      setDayPicker({ key, day, month: calendar.month, trained: true });
    } else {
      setUntrainedMenu({ key, day, month: calendar.month });
    }
  };

  // 周视图日点击
  const handleWeekDayPress = (wd) => {
    if (wd.isTrained) {
      setDayPicker({ key: wd.key, day: wd.dayNum, month: wd.month, trained: true });
    } else {
      setUntrainedMenu({ key: wd.key, day: wd.dayNum, month: wd.month });
    }
  };

  // 引导进入训练准备页
  const goTrain = (dateKey, trained, bodyPart) => {
    navigation.navigate('TrainingPrep', { date: dateKey, trained, bodyPart });
  };

  const pickerMonthLabel = (picker) => {
    const m = picker?.month;
    if (m === undefined) return calendar.month + 1;
    return m + 1;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 头部 */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: c.text }]}>极简力训</Text>
            <View style={styles.headerBtns}>
              <TouchableOpacity onPress={() => navigation.navigate('MonthSummary')}>
                <Text style={styles.headerBtn}>月结</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.headerBtn}>历史</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.todayBadge}>
            <View style={[styles.dot, { backgroundColor: isTodayTrained ? colors.accent : c.textMuted }]} />
            <Text style={[styles.todayText, { color: c.textSecondary }]}>
              {isTodayTrained ? '今日已完成' : hasActive ? '训练进行中' : '今日未训练'}
            </Text>
          </View>
        </View>

        {/* 未完成训练 */}
        {hasActive && (
          <TouchableOpacity style={styles.activeBanner} onPress={() => navigation.navigate('Workout')} activeOpacity={0.7}>
            <View style={styles.activeBannerInner}>
              <Text style={styles.activeBannerText}>⚡ 正在训练中 · 点击继续</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ===== 月历 ===== */}
        <View style={[styles.calCard, { backgroundColor: c.panel }]}>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthBtn}>
              <Text style={styles.monthBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.monthLabel, { color: c.text }]}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthBtn}>
              <Text style={styles.monthBtnText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.weekdayRow, { borderBottomColor: c.border }]}>
            {WEEKDAYS.map(d => <Text key={d} style={[styles.weekday, { color: c.textMuted }]}>{d}</Text>)}
          </View>
          <View style={styles.dayGrid}>
            {calendar.cells.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayCell,
                  day && trainedDates.has(dateKey(day)) && styles.dayTrained,
                  day && isToday(day) && styles.dayToday,
                ]}
                onPress={() => day && handleDayPress(day)}
                activeOpacity={day ? 0.6 : 1}
                disabled={!day}
              >
                {day && (
                  <>
                    <Text style={[ styles.dayNum, { color: c.textSecondary },
                      (trainedDates.has(dateKey(day)) || bodyParts[dateKey(day)]) && styles.dayNumTrained,
                      isToday(day) && styles.dayNumToday,
                    ]}>{day}</Text>
                    {(trainedDates.has(dateKey(day)) || bodyParts[dateKey(day)]) && (
                      <Text style={[styles.dayCheck, { color: bodyParts[dateKey(day)] ? colors.primaryLight : colors.accent }]}>
                        {bodyParts[dateKey(day)] ? (BP_LABELS[bodyParts[dateKey(day)]] || bodyParts[dateKey(day)]) : '✓'}
                      </Text>
                    )}
                    {trainedDates.has(dateKey(day)) && bodyParts[dateKey(day)] && (
                      <Text style={[styles.dayCheck, { color: colors.accent, marginTop: -6 }]}>✓</Text>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== 本周训练视图 ===== */}
        <View style={[styles.weekCard, { backgroundColor: c.panel, borderColor: c.border }]}>
          <View style={[styles.weekHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.weekHeaderText, { color: c.text }]}>本周训练</Text>
          </View>
          <View style={styles.weekRow}>
            {weekDays.map((wd, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.weekDay, wd.isToday && styles.weekDayToday]}
                onPress={() => handleWeekDayPress(wd)}
                activeOpacity={0.7}
              >
                <Text style={[styles.weekDow, { color: c.textMuted }]}>{WEEKDAYS[i]}</Text>
                <Text style={[styles.weekDate, { color: wd.isToday ? colors.primary : c.textSecondary }, wd.isToday && styles.weekDateToday]}>
                  {wd.dayNum}
                </Text>
                <Text style={[styles.weekBp, { color: wd.bpColor }, wd.status === 'rest' && styles.weekBpRest, wd.status === 'planned' && styles.weekBpPlanned]}>
                  {wd.bpLabel}
                </Text>
                {wd.isTrained && <Text style={[styles.weekCheck, { color: colors.accent }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.weekSum, { borderTopColor: c.border }]}>
            <Text style={[styles.weekSumText, { color: c.textSecondary }]}>
              本周训练 {weekSummary.trainedCount} 天{weekSummary.parts.length > 0 ? ` · ${weekSummary.parts.join(' · ')}` : ''}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={[styles.settingsText, { color: c.textMuted }]}>⚙️ 设置</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ===== 已训练日期菜单 ===== */}
      <Modal visible={!!dayPicker} transparent animationType="fade" onRequestClose={() => setDayPicker(null)}>
        <TouchableOpacity style={styles.overlayCenter} activeOpacity={1} onPress={() => setDayPicker(null)}>
          <View style={[styles.menuCard, { backgroundColor: c.panel }]}>
            <Text style={[styles.menuTitle, { color: c.text }]}>
              {dayPicker ? `${pickerMonthLabel(dayPicker)}月${dayPicker.day}日` : ''}
            </Text>
            <TouchableOpacity style={[styles.menuBtn, { borderColor: c.border }]} onPress={() => {
              const k = dayPicker?.key; setDayPicker(null);
              const dayWorkouts = workouts.filter(w => makeDateKey(w.recordDate || w.startedAt) === k);
              navigation.navigate(dayWorkouts.length === 1 ? 'WorkoutDetail' : 'History', dayWorkouts.length === 1 ? { workoutId: dayWorkouts[0].id } : { filterDate: k });
            }}>
              <Text style={[styles.menuBtnText, { color: c.text }]}>查看记录</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuBtn, { borderColor: c.border }]} onPress={() => {
              const k = dayPicker?.key, tr = dayPicker?.trained; setDayPicker(null);
              if (hasActive) {
                Alert.alert('训练冲突', '当前有未完成的训练', [
                  { text: '继续训练', onPress: () => navigation.navigate('Workout') },
                  { text: '放弃并开始新训练', onPress: () => goTrain(k, tr) },
                  { text: '取消', style: 'cancel' },
                ]);
              } else { goTrain(k, tr); }
            }}>
              <Text style={[styles.menuBtnText, { color: c.text }]}>再练一次</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuBtn, { borderColor: c.border }]} onPress={() => {
              const info = dayPicker; setDayPicker(null);
              setTimeout(() => setPartPicker({ key: info.key, day: info.day, month: info.month, mode: 'mark' }), 300);
            }}>
              <Text style={[styles.menuBtnText, { color: c.text }]}>标记部位</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuCancel, { borderTopColor: c.border }]} onPress={() => setDayPicker(null)}>
              <Text style={[styles.menuCancelText, { color: c.textMuted }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== 未训练日期轻量菜单 ===== */}
      <Modal visible={!!untrainedMenu} transparent animationType="fade" onRequestClose={() => setUntrainedMenu(null)}>
        <TouchableOpacity style={styles.overlayCenter} activeOpacity={1} onPress={() => setUntrainedMenu(null)}>
          <View style={[styles.menuCard, { backgroundColor: c.panel }]}>
            <Text style={[styles.menuTitle, { color: c.text }]}>
              {untrainedMenu ? `${pickerMonthLabel(untrainedMenu)}月${untrainedMenu.day}日` : ''}
            </Text>
            <TouchableOpacity style={[styles.menuBtn, { borderColor: c.border }]} onPress={() => {
              const info = untrainedMenu; setUntrainedMenu(null);
              setTimeout(() => setPartPicker({ ...info, mode: 'train' }), 300);
            }}>
              <Text style={[styles.menuBtnText, { color: c.text }]}>开始训练</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuBtn, { borderColor: c.border }]} onPress={() => {
              const info = untrainedMenu; setUntrainedMenu(null);
              setTimeout(() => setPartPicker({ ...info, mode: 'mark' }), 300);
            }}>
              <Text style={[styles.menuBtnText, { color: c.text }]}>仅标记部位</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuCancel, { borderTopColor: c.border }]} onPress={() => setUntrainedMenu(null)}>
              <Text style={[styles.menuCancelText, { color: c.textMuted }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ===== 部位选择底部弹窗 ===== */}
      <Modal visible={!!partPicker} transparent animationType="slide" onRequestClose={() => setPartPicker(null)}>
        <TouchableOpacity style={styles.sheetBg} activeOpacity={1} onPress={() => setPartPicker(null)}>
          <TouchableOpacity style={[styles.sheetCard, { backgroundColor: c.panel }]} activeOpacity={1}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={[styles.sheetTitle, { color: c.text }]}>
                {partPicker ? `${pickerMonthLabel(partPicker)}月${partPicker.day}日 · 选择训练部位` : ''}
              </Text>
            </View>
            <View style={styles.bpList}>
              {BP_OPTIONS.map(bp => {
                const isSelected = bodyParts[partPicker?.key] === bp.k;
                return (
                  <TouchableOpacity key={bp.k}
                    style={[styles.bpCard, { backgroundColor: c.surfaceLight, borderColor: isSelected ? bp.ac : 'transparent', borderWidth: isSelected ? 2 : 1 }]}
                    onPress={() => {
                      const { key, mode } = partPicker || {}, bodyPart = bp.k;
                      setPartPicker(null);

                      if (mode === 'mark') {
                        // 仅标记部位：保存并留在首页
                        saveBodyPart(key, bodyPart);
                        setBodyParts(prev => ({ ...prev, [key]: bodyPart }));
                        return;
                      }

                      // mode === 'train' 或从已训练菜单来
                      saveBodyPart(key, bodyPart);
                      setBodyParts(prev => ({ ...prev, [key]: bodyPart }));
                      if (hasActive) {
                        Alert.alert('训练冲突', '当前有未完成的训练', [
                          { text: '继续训练', onPress: () => navigation.navigate('Workout') },
                          { text: '放弃并开始新训练', onPress: () => navigation.navigate('TrainingPrep', { date: key, trained: false, bodyPart }) },
                          { text: '取消', style: 'cancel' },
                        ]);
                      } else {
                        navigation.navigate('TrainingPrep', { date: key, trained: false, bodyPart });
                      }
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={styles.bpCardIcon}><Text style={styles.bpEmoji}>{bp.icon}</Text></View>
                    <View style={styles.bpCardInfo}>
                      <Text style={[styles.bpCardLabel, { color: c.text }]}>{bp.label}</Text>
                      <Text style={[styles.bpCardHint, { color: c.textMuted }]}>{bp.hint}</Text>
                    </View>
                    <View style={[styles.bpCardBar, { backgroundColor: bp.ac }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[styles.sheetClearBtn, { borderTopColor: c.border }]} onPress={() => {
              const key = partPicker?.key;
              saveBodyPart(key, '');
              setBodyParts(prev => { const n = { ...prev }; delete n[key]; return n; });
              setPartPicker(null);
            }} activeOpacity={0.7}>
              <Text style={[styles.sheetClearText, { color: c.textMuted }]}>清除此日期部位</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sheetCancelBtn, { borderTopColor: c.border }]} onPress={() => setPartPicker(null)} activeOpacity={0.7}>
              <Text style={[styles.sheetCancelText, { color: c.textSecondary }]}>取消</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl + spacing.md, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBtns: { flexDirection: 'row', gap: spacing.md },
  headerBtn: { color: colors.primary, fontSize: fontSize.md, fontWeight: '500' },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  todayBadge: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  todayText: { color: colors.textSecondary, fontSize: fontSize.sm },
  activeBanner: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  activeBannerInner: { backgroundColor: colors.primaryDark, borderRadius: borderRadius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  activeBannerText: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },

  // ===== 本周训练 =====
  weekCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    borderRadius: borderRadius.xl, borderWidth: 1, overflow: 'hidden',
  },
  weekHeader: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  weekHeaderText: { fontSize: fontSize.sm, fontWeight: '600' },
  weekRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: 'space-around',
  },
  weekDay: {
    alignItems: 'center',
    width: 44,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  weekDayToday: {
    borderWidth: 1.5, borderColor: colors.primary,
  },
  weekDow: { fontSize: 10, marginBottom: 2 },
  weekDate: { fontSize: fontSize.sm, fontWeight: '700', marginBottom: 4 },
  weekDateToday: { color: colors.primary },
  weekBp: { fontSize: 12, fontWeight: '600' },
  weekBpRest: { opacity: 0.4 },
  weekBpPlanned: { opacity: 0.7 },
  weekCheck: { fontSize: 9, marginTop: 1, fontWeight: '700' },
  weekSum: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  weekSumText: { fontSize: fontSize.xs },

  // ===== 月历 =====
  calCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.panel, borderRadius: borderRadius.xl, padding: spacing.md },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  monthBtn: { padding: spacing.sm },
  monthBtnText: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '700' },
  monthLabel: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  weekday: { color: colors.textMuted, fontSize: fontSize.xs, fontWeight: '600', width: 36, textAlign: 'center' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  dayCell: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', marginVertical: 2, borderRadius: borderRadius.sm },
  dayTrained: { backgroundColor: 'rgba(97,211,148,0.15)' },
  dayToday: { borderWidth: 2, borderColor: colors.primary, borderRadius: borderRadius.md },
  dayNum: { color: colors.textSecondary, fontSize: fontSize.sm },
  dayNumTrained: { color: colors.accent, fontWeight: '700' },
  dayNumToday: { color: colors.primary, fontWeight: '700' },
  dayCheck: { color: colors.accent, fontSize: 10, marginTop: -2 },

  settingsBtn: { marginHorizontal: spacing.md, marginTop: spacing.sm, alignItems: 'center', padding: spacing.md },
  settingsText: { color: colors.textMuted, fontSize: fontSize.sm },

  // ===== 已训练日期菜单 =====
  overlayCenter: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  menuCard: { borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%' },
  menuTitle: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center', marginBottom: spacing.lg },
  menuBtn: { borderWidth: 1, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  menuBtnText: { fontSize: fontSize.md, fontWeight: '500' },
  menuCancel: { borderTopWidth: 1, paddingTop: spacing.md, alignItems: 'center' },
  menuCancelText: { fontSize: fontSize.md },

  // ===== 部位选择底部弹窗 =====
  sheetBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheetCard: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: spacing.xxl },
  sheetHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, alignItems: 'center' },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.rail, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  bpList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  bpCard: { flexDirection: 'row', alignItems: 'center', borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'transparent' },
  bpCardIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  bpEmoji: { fontSize: 28 },
  bpCardInfo: { flex: 1 },
  bpCardLabel: { fontSize: fontSize.md, fontWeight: '700', marginBottom: 2 },
  bpCardHint: { fontSize: fontSize.xs },
  bpCardBar: { width: 4, height: 36, borderRadius: 2 },
  sheetClearBtn: { marginTop: spacing.md, marginHorizontal: spacing.lg, borderTopWidth: 1, paddingTop: spacing.md, alignItems: 'center' },
  sheetClearText: { fontSize: fontSize.sm },
  sheetCancelBtn: { marginHorizontal: spacing.lg, borderTopWidth: 1, paddingTop: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  sheetCancelText: { fontSize: fontSize.md, fontWeight: '500' },
});

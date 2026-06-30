// 极简力训 - 设计系统（深色 + 浅色）

const shared = {
  primary: '#36A3FF',
  primaryLight: '#73C3FF',
  primaryDark: '#1675C1',
  accent: '#61D394',
  success: '#61D394',
  danger: '#FF5C5C',
  warning: '#F5A524',
  overlay: 'rgba(0,0,0,0.6)',
};

const dark = {
  ...shared,
  background: '#080B0E',
  surface: '#111820',
  surfaceLight: '#1A242E',
  panel: '#0D1319',
  panelRaised: '#16212B',
  text: '#FFFFFF',
  textSecondary: '#9BAAB7',
  textMuted: '#667482',
  border: '#24313D',
  rail: '#2A3846',
  metric: '#D9E7F2',
  timerBg: '#36A3FF',
  restBarBg: '#0D1319',
};

const light = {
  ...shared,
  background: '#F2F4F7',
  surface: '#FFFFFF',
  surfaceLight: '#F0F2F5',
  panel: '#FFFFFF',
  panelRaised: '#F7F8FA',
  text: '#1A1D23',
  textSecondary: '#5F6673',
  textMuted: '#9BA1AC',
  border: '#E1E4E8',
  rail: '#E8ECF0',
  metric: '#1675C1',
  timerBg: '#36A3FF',
  restBarBg: '#FFFFFF',
};

export const themes = { dark, light };

// 默认导出深色主题（兼容已有代码的静态引用）
export const colors = dark;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const fontSize = {
  xs: 12, sm: 14, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48, xxxxl: 64,
};

export const borderRadius = {
  sm: 3, md: 6, lg: 8, xl: 10, round: 999,
};

// 常用训练动作列表（多处复用）
export const COMMON_EXERCISES = [
  '卧推', '深蹲', '硬拉', '划船', '推举',
  '引体向上', '弯举', '臂屈伸', '飞鸟', '腿举',
  '罗马尼亚硬拉', '侧平举',
];

export const shadow = {
  sm: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  md: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
};

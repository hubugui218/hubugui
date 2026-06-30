// 极简力训 App - 入口

const g = typeof globalThis !== 'undefined' ? globalThis : global;
if (typeof g.queueMicrotask !== 'function') {
  g.queueMicrotask = cb => Promise.resolve().then(cb).catch(e => setTimeout(() => { throw e; }, 0));
}

const React = require('react');
const { AppRegistry, StatusBar } = require('react-native');
const { GestureHandlerRootView } = require('react-native-gesture-handler');
const { NavigationContainer } = require('@react-navigation/native');
const { createNativeStackNavigator } = require('@react-navigation/native-stack');
const { WorkoutProvider } = require('./src/context/WorkoutContext');
const { ThemeProvider, useTheme } = require('./src/context/ThemeContext');
const { themes, colors: defaultColors } = require('./src/constants/theme');
const HomeScreen = require('./src/screens/HomeScreen').default;
const TrainingPrepScreen = require('./src/screens/TrainingPrepScreen').default;
const WorkoutScreen = require('./src/screens/WorkoutScreen').default;
const HistoryScreen = require('./src/screens/HistoryScreen').default;
const WorkoutDetailScreen = require('./src/screens/WorkoutDetailScreen').default;
const MonthSummaryScreen = require('./src/screens/MonthSummaryScreen').default;
const SettingsScreen = require('./src/screens/SettingsScreen').default;

const Stack = createNativeStackNavigator();

// 内部组件 — 读取主题后渲染 StatusBar + 导航
function AppContent() {
  const { mode, c } = useTheme();
  const t = themes[mode];

  const navTheme = {
    dark: mode === 'dark',
    colors: {
      primary: t.primary,
      background: t.background,
      card: t.panel,
      text: t.text,
      border: t.border,
      notification: t.primary,
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '900' },
    },
  };

  const screenOptions = {
    headerStyle: { backgroundColor: t.background },
    headerTintColor: t.text,
    headerTitleStyle: { fontWeight: '600', fontSize: 18 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: t.background },
    animation: 'slide_from_right',
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(StatusBar, {
      translucent: true,
      backgroundColor: 'transparent',
      barStyle: mode === 'dark' ? 'light-content' : 'dark-content',
    }),
    React.createElement(
      WorkoutProvider,
      null,
      React.createElement(
        NavigationContainer,
        { theme: navTheme },
        React.createElement(
          Stack.Navigator,
          { screenOptions },
          React.createElement(Stack.Screen, { name: 'Home', component: HomeScreen, options: { headerShown: false } }),
          React.createElement(Stack.Screen, { name: 'TrainingPrep', component: TrainingPrepScreen, options: { headerShown: false } }),
          React.createElement(Stack.Screen, { name: 'Workout', component: WorkoutScreen, options: { headerShown: false, gestureEnabled: false } }),
          React.createElement(Stack.Screen, { name: 'History', component: HistoryScreen, options: { headerShown: false } }),
          React.createElement(Stack.Screen, { name: 'WorkoutDetail', component: WorkoutDetailScreen, options: { title: '训练详情' } }),
          React.createElement(Stack.Screen, { name: 'MonthSummary', component: MonthSummaryScreen, options: { headerShown: false } }),
          React.createElement(Stack.Screen, { name: 'Settings', component: SettingsScreen, options: { headerShown: false } }),
        )
      )
    )
  );
}

function App() {
  return React.createElement(
    GestureHandlerRootView,
    { style: { flex: 1 } },
    React.createElement(
      ThemeProvider,
      null,
      React.createElement(AppContent)
    )
  );
}

AppRegistry.registerComponent('main', () => App);

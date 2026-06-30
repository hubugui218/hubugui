# 极简力量训练日记 App

面向力量训练用户的极简健身日记 App。

## 功能

- **快速开始训练** — 一键创建训练记录，自动计时
- **动作记录** — 添加动作，记录每组重量和次数
- **组间歇倒计时** — 完成每组后自动启动，支持跳过 / +30s / 快速切换
- **历史记录** — 按日期查看所有训练，支持详情和删除
- **设置** — 默认休息时间（30/45/60/90/120/180秒）、震动提醒开关

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React Native 0.76 + Expo SDK 52 |
| 导航 | @react-navigation/native-stack |
| 存储 | @react-native-async-storage/async-storage |
| 构建 | Android Gradle (APK) |

## 项目结构

```
├── App.js                        # 入口 + 导航配置
├── src/
│   ├── constants/theme.js        # 设计系统
│   ├── utils/
│   │   ├── uuid.js               # ID 生成
│   │   ├── time.js               # 时间格式化
│   │   └── vibration.js          # 震动反馈
│   ├── storage/database.js       # AsyncStorage 数据层
│   ├── context/WorkoutContext.js # 全局状态管理
│   ├── components/
│   │   ├── RestTimerBar.js       # 休息倒计时栏
│   │   └── ExerciseSection.js    # 动作区域组件
│   └── screens/
│       ├── HomeScreen.js         # 首页
│       ├── WorkoutScreen.js      # 训练中（核心）
│       ├── HistoryScreen.js      # 历史列表
│       ├── WorkoutDetailScreen.js# 训练详情
│       └── SettingsScreen.js     # 设置
└── android/                      # Android 原生项目
```

## 构建 APK

```bash
# 确保已安装 Java 17+ 和 Android SDK
export ANDROID_HOME="D:/android-sdk"
cd android
./gradlew assembleRelease
# APK 输出: android/app/build/outputs/apk/release/app-release.apk
```

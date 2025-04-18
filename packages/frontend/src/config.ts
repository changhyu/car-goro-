/**
 * 앱 설정 정보
 */

interface Config {
  apiUrl: string;
  appName: string;
  version: string;
  environment: 'development' | 'test' | 'production';
  notificationSettings: {
    enableDesktopNotifications: boolean;
    defaultReminderTime: number; // 마감일 n일 전 알림 (일 단위)
    storageQuota: number; // 보관할 최대 알림 수
    overdueRemindInterval: number; // 기한 초과 알림 주기 (일 단위)
    autoMarkReadAfter: number; // n일 후 자동 읽음 처리 (일 단위)
    prioritizedTypes: readonly string[]; // 우선시되는 알림 유형들
    reminderTimes: readonly number[]; // 여러 시점에서 알림 (ex: [1, 3, 7] - 마감일 1일, 3일, 7일 전)
    silentHours: {
      // 무음 시간
      enabled: boolean;
      start: string; // "HH:MM" 포맷
      end: string; // "HH:MM" 포맷
    };
  };
  dateFormat: string;
  maxConcurrentRequests: number;
  featureFlags: {
    enableTemplates: boolean;
    enableReports: boolean;
    enablePredictiveMaintenance: boolean;
    enableDarkMode: boolean;
    enableNotificationFiltering: boolean;
    enableNotificationCustomization: boolean;
  };
}

// 환경별 설정
const configs = {
  development: {
    apiUrl: 'http://localhost:8000/api',
    appName: '차량 정비 관리 시스템',
    version: '0.1.0',
    environment: 'development',
    notificationSettings: {
      enableDesktopNotifications: true,
      defaultReminderTime: 3,
      storageQuota: 100,
      overdueRemindInterval: 1,
      autoMarkReadAfter: 7,
      prioritizedTypes: ['overdue', 'priority_high', 'upcoming_due'],
      reminderTimes: [1, 3, 7],
      silentHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    dateFormat: 'YYYY-MM-DD',
    maxConcurrentRequests: 5,
    featureFlags: {
      enableTemplates: true,
      enableReports: true,
      enablePredictiveMaintenance: true,
      enableDarkMode: true,
      enableNotificationFiltering: true,
      enableNotificationCustomization: true
    }
  },
  test: {
    apiUrl: 'http://test-api.example.com/api',
    appName: '차량 정비 관리 시스템',
    version: '0.1.0',
    environment: 'test',
    notificationSettings: {
      enableDesktopNotifications: true,
      defaultReminderTime: 3,
      storageQuota: 100,
      overdueRemindInterval: 1,
      autoMarkReadAfter: 7,
      prioritizedTypes: ['overdue', 'priority_high', 'upcoming_due'],
      reminderTimes: [1, 3, 7],
      silentHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    },
    dateFormat: 'YYYY-MM-DD',
    maxConcurrentRequests: 5,
    featureFlags: {
      enableTemplates: true,
      enableReports: true,
      enablePredictiveMaintenance: true,
      enableDarkMode: true,
      enableNotificationFiltering: true,
      enableNotificationCustomization: true
    }
  },
  production: {
    apiUrl: 'https://api.example.com/api',
    appName: '차량 정비 관리 시스템',
    version: '0.1.0',
    environment: 'production',
    notificationSettings: {
      enableDesktopNotifications: true,
      defaultReminderTime: 3,
      storageQuota: 100,
      overdueRemindInterval: 1,
      autoMarkReadAfter: 14,
      prioritizedTypes: ['overdue', 'priority_high', 'upcoming_due'],
      reminderTimes: [1, 3, 7],
      silentHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      }
    },
    dateFormat: 'YYYY-MM-DD',
    maxConcurrentRequests: 10,
    featureFlags: {
      enableTemplates: true,
      enableReports: true,
      enablePredictiveMaintenance: true,
      enableDarkMode: true,
      enableNotificationFiltering: true,
      enableNotificationCustomization: true
    }
  }
} as const;

// 현재 환경 설정
const env = import.meta.env.MODE || 'development';
const config: Config = configs[env as keyof typeof configs] || configs.development;

export default config;

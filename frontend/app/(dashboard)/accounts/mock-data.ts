export interface Account {
  id: string;
  appName: string;
  appIconUrl?: string;
  username?: string;
  email: string;
  encodedPassword: string;
  lastUpdated: string;
  inheritedUserId?: string;
}

// ユーザー型定義
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

// ユーザーモックデータ
// TODO: 本番環境では /api/users などのエンドポイントからデータ取得予定
export const users: User[] = [
  {
    id: "user1",
    name: "田中 太郎",
    email: "tanaka@example.com",
  },
  {
    id: "user2",
    name: "佐藤 花子",
    email: "sato@example.com",
  },
  {
    id: "user3",
    name: "山田 一郎",
    email: "yamada@example.com",
  },
  {
    id: "user4",
    name: "鈴木 次郎",
    email: "suzuki@example.com",
  },
];

// アカウントモックデータ
// TODO: 本番環境では /api/accounts などのエンドポイントからデータ取得予定
export const accounts: Account[] = [
  {
    id: "1",
    appName: "Google",
    appIconUrl: "/icons/google.png",
    username: "user1",
    email: "user1@example.com",
    encodedPassword: "enc_pass_123",
    lastUpdated: "2023-10-03",
    inheritedUserId: "user1"
  },
  {
    id: "2",
    appName: "Twitter",
    username: "user2",
    email: "user2@example.com",
    encodedPassword: "enc_pass_456",
    lastUpdated: "2023-09-28",
    inheritedUserId: "user2"
  },
  {
    id: "3",
    appName: "Facebook",
    username: "user3",
    email: "user3@example.com",
    encodedPassword: "enc_pass_789",
    lastUpdated: "2023-10-01",
    inheritedUserId: "user3"
  },
  {
    id: "4",
    appName: "LinkedIn",
    username: "user4",
    email: "user4@example.com",
    encodedPassword: "enc_pass_abc",
    lastUpdated: "2023-09-25",
    inheritedUserId: "user4"
  },
  {
    id: "5",
    appName: "GitHub",
    username: "user5",
    email: "user5@example.com",
    encodedPassword: "enc_pass_def",
    lastUpdated: "2023-10-02",
    inheritedUserId: "user1"
  },
  {
    id: "6",
    appName: "Slack",
    username: "user6",
    email: "user6@example.com",
    encodedPassword: "enc_pass_ghi",
    lastUpdated: "2023-10-05",
    inheritedUserId: "user2"
  },
];

// アカウントテンプレート
export interface AccountTemplate {
  id: string;
  appName: string;
  appIconUrl?: string;
  emailDomain?: string;
}

// アカウントテンプレートデータ
export const accountTemplates: AccountTemplate[] = [
  {
    id: "google",
    appName: "Google",
    appIconUrl: "/icons/google.png",
    emailDomain: "gmail.com"
  },
  {
    id: "twitter",
    appName: "Twitter",
  },
  {
    id: "facebook",
    appName: "Facebook",
    emailDomain: "facebook.com"
  },
  {
    id: "amazon",
    appName: "Amazon",
  },
  {
    id: "apple",
    appName: "Apple",
    emailDomain: "icloud.com"
  },
  {
    id: "microsoft",
    appName: "Microsoft",
    emailDomain: "outlook.com"
  }
]; 
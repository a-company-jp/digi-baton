import { HandlersDeviceResponse } from "@/app/api/generated/schemas";


export const getDeviceType = (id: number) => {
    switch (id) {
        case 1:
            return "PC";
        case 2:
            return "Mobile";
    }
};

export const devicesMockData: HandlersDeviceResponse[] = [
    {
        id: 1,
        deviceType: 2,
        deviceDescription: "iPhone 12",
        deviceUsername: "user1",
        encPassword: "enc_pass_123",
        memo: "メモ",
        message: "メッセージ",
        passerID: "user1",
        trustID: 1,
    },
    {
        id: 2,
        deviceType: 1,
        deviceDescription: "MacBook Pro",
        deviceUsername: "user2",
        encPassword: "enc_pass_456",
        memo: "メモ",
        message: "メッセージ",
        passerID: "user2",
        trustID: 2,
    },
    {
        id: 3,
        deviceType: 1,
        deviceDescription: "Surface Pro",
        deviceUsername: "user3",
        encPassword: "enc_pass_789",
        memo: "メモ",
        message: "メッセージ",
        passerID: "user3",
        trustID: 3,
    },
    {
        id: 4,
        deviceType: 2,
        deviceDescription: "Pixel 6",
        deviceUsername: "user4",
        encPassword: "enc_pass_012",
        memo: "メモ",
        message: "メッセージ",
        passerID: "user4",
        trustID: 4,
    },
    {
        id: 5,
        deviceType: 0,
        deviceDescription: "iMac",
        deviceUsername: "user5",
        encPassword: "enc_pass_345",
        memo: "メモ",
        message: "メッセージ",
        passerID: "user5",
        trustID: 5,
    },
];


import type { ChatModel } from "./models";

export type UserType = "guest" | "regular";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 20,
    availableChatModelIds: ["chat-model"],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 10000, // Increased for development/testing
    availableChatModelIds: ["chat-model"],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};

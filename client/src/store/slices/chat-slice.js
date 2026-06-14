export const createChatSlice = (set, get) => ({
  selectedChatType: undefined,
  selectedChatData: undefined,
  selectedChatMessages: [],
  directMessagesContacts: [],
  isUploading: false,
  isDownloading: false,
  fileUploadProgress: 0,
  fileDownloadProgress: 0,
  channels: [],
  chatWallpaper: "default",
  setChatWallpaper: (chatWallpaper) => set({ chatWallpaper }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  onlineUsers: [],
  setOnlineUsers: (onlineUsers) => set({ onlineUsers }),
  setChannels: (channels) => set({ channels }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsDownloading: (isDownloading) => set({ isDownloading }),
  setFileUploadProgress: (fileUploadProgress) => set({ fileUploadProgress }),
  setFileDownloadProgress: (fileDownloadProgress) =>
    set({ fileDownloadProgress }),
  setSelectedChatType: (selectedChatType) => set({ selectedChatType }),
  setSelectedChatData: (selectedChatData) => set({ selectedChatData }),
  setSelectedChatMessages: (selectedChatMessages) =>
    set({ selectedChatMessages }),
  setDirectMessagesContacts: (directMessagesContacts) =>
    set({ directMessagesContacts }),
  typingUsers: [],
  setUserTypingStart: (typingData) => set((state) => {
    const alreadyExists = state.typingUsers.some(
      (t) => t.userId === typingData.userId && t.chatId === typingData.chatId
    );
    if (alreadyExists) return {};
    return { typingUsers: [...state.typingUsers, typingData] };
  }),
  setUserTypingStop: (typingData) => set((state) => ({
    typingUsers: state.typingUsers.filter(
      (t) => !(t.userId === typingData.userId && t.chatId === typingData.chatId)
    )
  })),
  addChannel: (channel) => {
    const channels = get().channels;
    set({
      channels: [channel, ...channels],
    });
  },
  closeChat: () =>
    set({
      selectedChatData: undefined,
      selectedChatType: undefined,
      selectedChatMessages: [],
      searchQuery: "",
    }),
  addMessage: (message) => {
    const selectedChatMessages = get().selectedChatMessages;
    const selectedChatType = get().selectedChatType;

    set({
      selectedChatMessages: [
        ...selectedChatMessages,
        {
          ...message,
          recipient:
            selectedChatType === "channel"
              ? message.recipient
              : message.recipient._id,
          sender:
            selectedChatType === "channel"
              ? message.sender
              : message.sender._id,
        },
      ],
    });
  },
  // addMessage: (message) => {
  //   set((state) => ({
  //     selectedChatMessages: [
  //       ...state.selectedChatMessages,
  //       {
  //         ...message,
  //         recipient:
  //           state.selectedChatType === "channel"
  //             ? message.recipient
  //             : message.recipient._id,
  //         sender:
  //           state.selectedChatType === "channel"
  //             ? message.sender
  //             : message.sender._id,
  //       },
  //     ],
  //   }));
  // },
});

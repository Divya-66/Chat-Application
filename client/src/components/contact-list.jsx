import { useAppStore } from "@/store";
import { HOST } from "@/utils/constants";
import { getColor } from "@/lib/utils";

const ContactList = ({ contacts, isChannel = false }) => {
  const {
    selectedChatData,
    setSelectedChatData,
    setSelectedChatType,
    setSelectedChatMessages,
    onlineUsers,
  } = useAppStore();

  const handleClick = (contact) => {
    if (isChannel) setSelectedChatType("channel");
    else setSelectedChatType("contact");
    setSelectedChatData(contact);
    if (selectedChatData && selectedChatData._id !== contact._id) {
      setSelectedChatMessages([]);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-1 px-3 select-none">
      {contacts.map((contact) => {
        const isSelected = selectedChatData && selectedChatData._id === contact._id;
        const isOnline = !isChannel && onlineUsers.includes(contact._id);
        return (
          <div
            key={contact._id}
            className={`px-4 py-2.5 transition-all duration-300 cursor-pointer rounded-xl flex items-center gap-4 ${
              isSelected
                ? "bg-gradient-to-r from-[#8338ec]/20 to-[#975aed]/5 border-l-4 border-[#8338ec] text-white shadow-md scale-[1.01]"
                : "hover:bg-white/5 text-neutral-300 hover:text-white"
            }`}
            onClick={() => handleClick(contact)}
          >
            <div className="flex gap-3 items-center justify-start w-full">
              {!isChannel && (
                <div className="w-9 h-9 rounded-full overflow-visible flex-shrink-0 relative border border-white/5">
                  <div className="w-9 h-9 rounded-full overflow-hidden">
                    {contact.image ? (
                      <img
                        src={`${HOST}/${contact.image}`}
                        alt="profile"
                        className="object-cover w-full h-full bg-black"
                      />
                    ) : (
                      <div
                        className={`uppercase h-full w-full text-sm flex items-center justify-center rounded-full font-bold select-none ${getColor(
                          contact.color
                        )}`}
                      >
                        {contact.firstName
                          ? contact.firstName.substring(0, 1)
                          : contact.email.substring(0, 1)}
                      </div>
                    )}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-[-1px] right-[-1px] block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-[#1b1c24] animate-pulse z-10" />
                  )}
                </div>
              )}
              {isChannel && (
                <div className="bg-[#ffffff10] h-9 w-9 flex items-center justify-center rounded-full text-neutral-300 font-bold border border-white/5 flex-shrink-0 text-sm">
                  #
                </div>
              )}
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium tracking-wide truncate">
                  {isChannel ? contact.name : `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || contact.email}
                </span>
                {!isChannel && contact.firstName && (
                  <span className="text-[10px] text-neutral-500 truncate">
                    {contact.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContactList;

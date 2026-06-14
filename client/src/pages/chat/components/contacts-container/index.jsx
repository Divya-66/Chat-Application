import { useEffect } from "react";
import NewDM from "./components/new-dm";
import ProfileInfo from "./components/profile-info";
import { apiClient } from "@/lib/api-client";
import {
  GET_DM_CONTACTS_ROUTES,
  GET_USER_CHANNELS_ROUTE,
} from "@/utils/constants";
import { useAppStore } from "@/store";
import ContactList from "@/components/contact-list";
import CreateChannel from "./components/create-channel";

const ContactsContainer = () => {
  const {
    setDirectMessagesContacts,
    directMessagesContacts,
    channels,
    setChannels,
  } = useAppStore();

  useEffect(() => {
    const getContacts = async () => {
      const response = await apiClient.get(GET_DM_CONTACTS_ROUTES, {
        withCredentials: true,
      });
      if (response.data.contacts) {
        setDirectMessagesContacts(response.data.contacts);
      }
    };
    const getChannels = async () => {
      const response = await apiClient.get(GET_USER_CHANNELS_ROUTE, {
        withCredentials: true,
      });
      if (response.data.channels) {
        setChannels(response.data.channels);
      }
    };

    getContacts();
    getChannels();
  }, [setChannels, setDirectMessagesContacts]);

  return (
    <div className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] bg-[#1b1c24] border-r-2 border-[#2f303b] w-full h-full flex flex-col overflow-hidden">
      <div className="pt-3 flex-shrink-0">
        <Logo />
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-hidden mb-16">
        <div className="my-5">
          <div className="flex items-center justify-between pr-10">
            <Title text="Direct Messages" />
            <NewDM />
          </div>
          <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
            <ContactList contacts={directMessagesContacts} />
          </div>
        </div>
        <div className="my-5">
          <div className="flex items-center justify-between pr-10">
            <Title text="Channels" />
            <CreateChannel />
          </div>
          <div className="max-h-[38vh] overflow-y-auto scrollbar-hidden">
            <ContactList contacts={channels} isChannel={true} />
          </div>
        </div>
      </div>
      
      <ProfileInfo />
    </div>
  );
};

export default ContactsContainer;

const Logo = () => {
  return (
    <div className="flex p-5 justify-start items-center gap-2 select-none flex-shrink-0">
      <svg
        id="logo-38"
        width="38"
        height="32"
        viewBox="0 0 78 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {" "}
        <path
          d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
          className="ccustom"
          fill="#8338ec"
        ></path>{" "}
        <path
          d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
          className="ccompli1"
          fill="#975aed"
        ></path>{" "}
        <path
          d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
          className="ccompli2"
          fill="#a16ee8"
        ></path>{" "}
      </svg>
      <span className="text-xl md:text-2xl font-bold tracking-tight text-white whitespace-nowrap">
        Walkie-Talkie
      </span>
    </div>
  );
};

const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-10 font-semibold text-opacity-90 text-[10px] md:text-xs">
      {text}
    </h6>
  );
};

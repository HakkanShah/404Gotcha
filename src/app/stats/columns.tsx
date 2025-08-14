import {
  Calendar,
  Hash,
  MapPin,
  Laptop,
  Link as LinkIcon,
  Bot,
} from "lucide-react";

export const columns = [
  {
    id: "timestamp",
    header: "Timestamp",
    icon: <Calendar size={16} />,
    className: "w-[200px]",
  },
  {
    id: "ip",
    header: "IP Address",
    icon: <Hash size={16} />,
    className: "w-[150px]",
  },
  {
    id: "location",
    header: "Location",
    icon: <MapPin size={16} />,
    className: "w-[180px]",
  },
  {
    id: "device",
    header: "Device Info",
    icon: <Laptop size={16} />,
    className: "w-[250px]",
  },
  {
    id: "referrer",
    header: "Referrer",
    icon: <LinkIcon size={16} />,
  },
  {
    id: "type",
    header: "Type",
    icon: <Bot size={16} />,
    className: "w-[100px]",
  },
];

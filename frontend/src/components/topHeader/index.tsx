import { useEffect, useState } from "react";
import { auth } from "../../services/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import "./topHeader.css";

type TopHeaderProps = {
  selectedMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export default function TopHeader({
  selectedMonth,
  onPreviousMonth,
  onNextMonth,
}: TopHeaderProps) {
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || "Usuário");
    }
  }, []);

  const monthName = selectedMonth.toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboardHeader">
      <h1 className="dashboardGreeting">Olá, {userName}!</h1>

      <div className="monthNavigator">
        <button className="monthButton" onClick={onPreviousMonth}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <span className="monthDisplay">
          <FontAwesomeIcon icon={faCalendar} className="calendarIcon" />
          {monthName}
        </span>

        <button className="monthButton" onClick={onNextMonth}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}
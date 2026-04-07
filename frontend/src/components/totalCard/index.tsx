import { useState, useEffect } from "react";
import { auth, db } from "../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./totalCard.css";

const BrazilianCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

type TotalCardPorps = {
  selectedMonth : Date;
};

export default function TotalCard({selectedMonth} : TotalCardPorps) {
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setTotalBalance(0);
        return;
      }

      const startOfMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth(),
        1
      )

      const startOfNextMonth = new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        1
      )

      const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("createdAt", ">=", startOfMonth),
        where("createdAt", "<", startOfNextMonth)
      );

      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        let incomeSum = 0;
        let expenseSum = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const value = Number(data.amount) || 0;

          if (data.type === "income") {
            incomeSum += value;
          }

          if (data.type === "expense") {
            expenseSum += value;
          }
        });

        setTotalBalance(incomeSum - expenseSum);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [selectedMonth]);

  return (
    <div className="totalCard">
      <h3 className="titleTotal">Total</h3>
      <p className="totalCardMoney">
        {BrazilianCurrencyFormatter.format(totalBalance)}
      </p>
    </div>
  );
}
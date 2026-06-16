export type UserRole = "user" | "admin";

export type UserProfile = {
  uid: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt?: string | null;
};

export type UserDetailsSummary = {
  transactionsCount: number;
  accountsCount: number;
  categoriesCount: number;
  goalsCount: number;
  budgetsCount: number;
};

export type UserTransactionItem = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  createdAt: string | null;
};

export type UserAccountItem = {
  id: string;
  name: string;
  type: string | null;
  initialBalance: number;
};

export type UserGoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
};

export type UserCategoryItem = {
  id: string;
  name: string;
  type: string | null;
};

export type UserBudgetItem = {
  id: string;
  category: string;
  monthlyLimit: number;
};

export type UserDetails = {
  user: UserProfile;
  summary: UserDetailsSummary;
  transactions: UserTransactionItem[];
  accounts: UserAccountItem[];
  goals: UserGoalItem[];
  categories: UserCategoryItem[];
  budgets: UserBudgetItem[];
};

export type UserDetailsTab =
  | "transactions"
  | "accounts"
  | "goals"
  | "categories"
  | "budgets";

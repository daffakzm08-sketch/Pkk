import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  ReceiptText,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  ArrowLeftRight,
  Landmark,
  Banknote,
  Smartphone,
  PiggyBank,
  Coffee,
  Plane,
  Home,
  ShieldCheck,
  Palmtree,
  CreditCard,
  Tag,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  ReceiptText,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coins,
  ArrowLeftRight,
  Landmark,
  Banknote,
  Smartphone,
  PiggyBank,
  Coffee,
  Plane,
  Home,
  ShieldCheck,
  Palmtree,
  CreditCard,
  Tag,
  CircleDollarSign,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = ICON_MAP[name] || CircleDollarSign;
  return <IconComponent className={className} size={size} />;
};

import { Image, Text, View } from "react-native";
import { styles } from "@/styles/badgeCard";

export interface BadgeItem {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
  is_earned: boolean;
}

interface BadgeCardProps {
  badge: BadgeItem;
}

export function BadgeCard({ badge }: BadgeCardProps) {
  // Map badge icon to local assets
  const getBadgeImage = (icon: string) => {
    const iconMap: { [key: string]: any } = {
      "badge-25.png": require("@/assets/images/badges/badge-1.png"),
      "badge-50.png": require("@/assets/images/badges/badge-2.png"),
      "badge-75.png": require("@/assets/images/badges/badge-3.png"),
      "badge-100.png": require("@/assets/images/badges/badge-4.png"),
      "badge-topic.png": require("@/assets/images/badges/badge-5.png"),
      "badge-variabel.png": require("@/assets/images/badges/badge-5.png"),
      "badge-operator.png": require("@/assets/images/badges/badge-6.png"),
      "badge-percabangan.png": require("@/assets/images/badges/badge-4.png"),
      "badge-perulangan.png": require("@/assets/images/badges/badge-3.png"),
      "badge-pengurutan.png": require("@/assets/images/badges/badge-2.png"),
      "badge-pencarian.png": require("@/assets/images/badges/badge-1.png"),
    };
    return iconMap[icon] || require("@/assets/images/badges/badge-1.png");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <View style={[styles.badgeItem, !badge.is_earned && styles.badgeItemLocked]}>
      <View style={styles.badgeImageContainer}>
        <Image source={getBadgeImage(badge.icon)} style={styles.badgeImage} />
        {!badge.is_earned && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}
      </View>
      <Text style={styles.badgeName} numberOfLines={2}>
        {badge.name}
      </Text>
      {badge.earned_at && badge.is_earned && <Text style={styles.earnedDate}>{formatDate(badge.earned_at)}</Text>}
    </View>
  );
}

// Lista de miembros actuales del hogar con su rol.
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import type { HouseholdMember } from "../types";
import styles from "./HouseholdDetail.module.css";

type Props = {
  members: HouseholdMember[];
  currentUserId: string;
};

export function MemberList({ members, currentUserId }: Props) {
  const t = useTranslations("Households");

  return (
    <ul className={styles.members}>
      {members.map((m) => (
        <li key={m.userId} className={styles.member}>
          <Avatar name={m.displayName} imageUrl={m.avatarUrl} size="sm" />
          <span className={styles.memberName}>
            {m.displayName}
            {m.userId === currentUserId ? (
              <span className={styles.you}> ({t("membersSection.you")})</span>
            ) : null}
          </span>
          <span className={m.role === "admin" ? styles.roleAdmin : styles.role}>
            {t(`roles.${m.role}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}

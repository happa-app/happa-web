// Lista de miembros actuales del hogar con su rol. Si quien mira es admin, junto a cada miembro adulto
// sale "Hacer admin" (menores y casero no pueden serlo).
import { useTranslations } from "next-intl";
import { Avatar } from "@/components/ui/Avatar";
import type { HouseholdMember } from "../types";
import styles from "./HouseholdDetail.module.css";
import { MakeAdminButton } from "./MakeAdminButton";

type Props = {
  members: HouseholdMember[];
  currentUserId: string;
  householdId: string;
  isAdmin: boolean;
};

export function MemberList({ members, currentUserId, householdId, isAdmin }: Props) {
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
          {isAdmin && m.role === "member" && m.userId !== currentUserId ? (
            <MakeAdminButton householdId={householdId} userId={m.userId} name={m.displayName} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

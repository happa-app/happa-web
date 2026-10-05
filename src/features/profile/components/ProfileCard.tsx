// Tu inicial (o foto), tu nombre y tu correo, arriba de la página del perfil.
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import type { MyProfile } from "../types";
import styles from "./Profile.module.css";

export function ProfileCard({ profile }: { profile: MyProfile }) {
  return (
    <Card>
      <div className={styles.head}>
        <Avatar name={profile.name} imageUrl={profile.avatarUrl} />
        <div className={styles.headText}>
          <span className={styles.name}>{profile.name}</span>
          {profile.email ? <span className={styles.email}>{profile.email}</span> : null}
        </div>
      </div>
    </Card>
  );
}

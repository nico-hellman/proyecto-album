import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAlbumForUser } from "@/lib/album-data";
import AlbumClient from "@/components/AlbumClient";

export const dynamic = "force-dynamic";

export default async function AlbumPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const album = await getAlbumForUser(session.userId);
  return (
    <AlbumClient
      album={album}
      userName={session.name}
      isAdmin={session.role === "ADMIN"}
    />
  );
}

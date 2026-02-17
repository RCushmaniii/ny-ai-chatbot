import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { generateUUID } from "@/lib/utils";

export default async function Page() {
  const id = generateUUID();

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}

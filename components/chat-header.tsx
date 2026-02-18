"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { useWindowSize } from "usehooks-ts";
import { useChatLayout } from "@/components/chat-layout-provider";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";

function PureChatHeader({
  chatId,
}: {
  chatId: string;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { isAuthenticated } = useChatLayout();

  const { width: windowWidth } = useWindowSize({ initializeWithValue: false });
  const isNarrow = windowWidth !== undefined && windowWidth < 768;

  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      {isAuthenticated && <SidebarToggle />}

      {isAuthenticated && (!open || isNarrow) && (
        <Button
          className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {!isAuthenticated && (
        <Button
          asChild
          className="order-3 ml-auto h-8 px-3 md:h-fit md:px-4"
          variant="default"
        >
          <Link href="/sign-in">Sign in</Link>
        </Button>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.chatId === nextProps.chatId;
});

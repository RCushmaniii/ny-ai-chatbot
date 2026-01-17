import { getMessageByErrorCode } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";
import { expect, test } from "../fixtures";
import { TEST_PROMPTS } from "../prompts/routes";

const chatIdsCreatedByAda: string[] = [];

test.describe
  .serial("/api/chat", () => {
    test("Ada cannot invoke a chat generation with empty request body", async ({
      adaContext,
    }) => {
      const response = await adaContext.request.post("/api/chat", {
        data: JSON.stringify({}),
      });
      expect(response.status()).toBe(400);

      const { code, message } = await response.json();
      expect(code).toEqual("bad_request:api");
      expect(message).toEqual(getMessageByErrorCode("bad_request:api"));
    });

    test("Ada can invoke chat generation", async ({ adaContext }) => {
      const chatId = generateUUID();

      const response = await adaContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: TEST_PROMPTS.SKY.MESSAGE,
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
        },
      });
      expect(response.status()).toBe(200);

      const text = await response.text();
      const lines = text.split("\n").filter(Boolean);

      // Verify stream structure contains expected event types
      const eventTypes = lines
        .map((line) => {
          if (!line.startsWith("data: ")) return null;
          const content = line.slice(6);
          if (content === "[DONE]") return "done";
          try {
            const data = JSON.parse(content);
            return data.type;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      // Check for essential stream events
      expect(eventTypes).toContain("start-step");
      expect(eventTypes).toContain("text-start");
      expect(eventTypes).toContain("text-delta");
      expect(eventTypes).toContain("text-end");
      expect(eventTypes).toContain("finish-step");
      expect(eventTypes).toContain("finish");
      expect(eventTypes).toContain("done");

      chatIdsCreatedByAda.push(chatId);
    });

    test("Babbage cannot append message to Ada's chat", async ({
      babbageContext,
    }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await babbageContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: TEST_PROMPTS.GRASS.MESSAGE,
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
        },
      });
      expect(response.status()).toBe(403);

      const { code, message } = await response.json();
      expect(code).toEqual("forbidden:chat");
      expect(message).toEqual(getMessageByErrorCode("forbidden:chat"));
    });

    test("Babbage cannot delete Ada's chat", async ({ babbageContext }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await babbageContext.request.delete(
        `/api/chat?id=${chatId}`,
      );
      expect(response.status()).toBe(403);

      const { code, message } = await response.json();
      expect(code).toEqual("forbidden:chat");
      expect(message).toEqual(getMessageByErrorCode("forbidden:chat"));
    });

    test("Ada can delete her own chat", async ({ adaContext }) => {
      const [chatId] = chatIdsCreatedByAda;

      const response = await adaContext.request.delete(
        `/api/chat?id=${chatId}`,
      );
      expect(response.status()).toBe(200);

      const deletedChat = await response.json();
      expect(deletedChat).toMatchObject({ id: chatId });
    });

    test("Ada cannot resume stream of chat that does not exist", async ({
      adaContext,
    }) => {
      const response = await adaContext.request.get(
        `/api/chat/${generateUUID()}/stream`,
      );
      // Returns 204 when no stream context available, or 404 when chat not found
      expect([204, 404]).toContain(response.status());
    });

    // Skip: Requires Redis/resumable streams which aren't configured in test env
    test.skip("Ada can resume chat generation", async ({ adaContext }) => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: "user",
            content: "Help me write an essay about Silcon Valley",
            parts: [
              {
                type: "text",
                text: "Help me write an essay about Silicon Valley",
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondRequest = adaContext.request.get(
        `/api/chat/${chatId}/stream`,
      );

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(200);

      const [firstResponseBody, secondResponseBody] = await Promise.all([
        await firstResponse.body(),
        await secondResponse.body(),
      ]);

      expect(firstResponseBody.toString()).toEqual(
        secondResponseBody.toString(),
      );
    });

    // Skip: Requires Redis/resumable streams which aren't configured in test env
    test.skip("Ada can resume chat generation that has ended during request", async ({
      adaContext,
    }) => {
      const chatId = generateUUID();

      const firstRequest = await adaContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: "user",
            content: "Help me write an essay about Silcon Valley",
            parts: [
              {
                type: "text",
                text: "Help me write an essay about Silicon Valley",
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
        },
      });

      const secondRequest = adaContext.request.get(
        `/api/chat/${chatId}/stream`,
      );

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(200);

      const [, secondResponseContent] = await Promise.all([
        firstResponse.text(),
        secondResponse.text(),
      ]);

      expect(secondResponseContent).toContain("appendMessage");
    });

    // Skip: Requires Redis/resumable streams which aren't configured in test env
    test.skip("Ada cannot resume chat generation that has ended", async ({
      adaContext,
    }) => {
      const chatId = generateUUID();

      const firstResponse = await adaContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: "user",
            content: "Help me write an essay about Silcon Valley",
            parts: [
              {
                type: "text",
                text: "Help me write an essay about Silicon Valley",
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
        },
      });

      const firstStatusCode = firstResponse.status();
      expect(firstStatusCode).toBe(200);

      await firstResponse.text();
      await new Promise((resolve) => setTimeout(resolve, 15 * 1000));
      await new Promise((resolve) => setTimeout(resolve, 15_000));
      const secondResponse = await adaContext.request.get(
        `/api/chat/${chatId}/stream`,
      );

      const secondStatusCode = secondResponse.status();
      expect(secondStatusCode).toBe(200);

      const secondResponseContent = await secondResponse.text();
      expect(secondResponseContent).toEqual("");
    });

    // Skip: Requires Redis/resumable streams which aren't configured in test env
    test.skip("Babbage cannot resume a private chat generation that belongs to Ada", async ({
      adaContext,
      babbageContext,
    }) => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: "user",
            content: "Help me write an essay about Silcon Valley",
            parts: [
              {
                type: "text",
                text: "Help me write an essay about Silicon Valley",
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: "chat-model",
          selectedVisibilityType: "private",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const secondRequest = babbageContext.request.get(
        `/api/chat/${chatId}/stream`,
      );

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(403);
    });

    // Skip: Requires Redis/resumable streams which aren't configured in test env
    test.skip("Babbage can resume a public chat generation that belongs to Ada", async ({
      adaContext,
      babbageContext,
    }) => {
      const chatId = generateUUID();

      const firstRequest = adaContext.request.post("/api/chat", {
        data: {
          id: chatId,
          message: {
            id: generateUUID(),
            role: "user",
            content: "Help me write an essay about Silicon Valley",
            parts: [
              {
                type: "text",
                text: "Help me write an essay about Silicon Valley",
              },
            ],
            createdAt: new Date().toISOString(),
          },
          selectedChatModel: "chat-model",
          selectedVisibilityType: "public",
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 10 * 1000));

      const secondRequest = babbageContext.request.get(
        `/api/chat/${chatId}/stream`,
      );

      const [firstResponse, secondResponse] = await Promise.all([
        firstRequest,
        secondRequest,
      ]);

      const [firstStatusCode, secondStatusCode] = await Promise.all([
        firstResponse.status(),
        secondResponse.status(),
      ]);

      expect(firstStatusCode).toBe(200);
      expect(secondStatusCode).toBe(200);

      const [firstResponseContent, secondResponseContent] = await Promise.all([
        firstResponse.text(),
        secondResponse.text(),
      ]);

      expect(firstResponseContent).toEqual(secondResponseContent);
    });
  });

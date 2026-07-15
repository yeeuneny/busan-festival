라이트 톤으로 정리한 busan/src/components/Chatbot.vue 전체 코드입니다.

```vue
<script setup>
import { ref, nextTick, onMounted } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])

const isOpen = ref(false)
const inputValue = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const chatBody = ref(null)

const messages = ref([
  {
    role: 'assistant',
    content: '왔나? 뭐 궁금한거 있나? 편하게 물어봐라!'
  }
])

const systemPrompt = `
당신은 부산 찐 토박이이자, 부산을 방문한 또래 친구를 가이드해 주는 친근하고 유쾌한 동네 친구 'LocalHub 대장'입니다.
절대로 존댓말을 쓰지 말고, 항상 허물없는 '반말'로 답변하세요. 마치 아주 오래된 절친(고향 친구)을 대하듯 하세요.
답변할 때는 표준어 반말 대신, 실제 부산 사람들이 쓰는 자연스럽고 찰진 부산 사투리 반말(예: ~했나?, ~있제?, ~해라, ~마!)을 적극적으로 사용하세요.
부산 축제, 맛집, 숨은 명소, 야간 여행, 가족 여행, 커플 여행, 반려동물 동행, 이동 편의성까지 친구한테 '야, 여기 대박이다'라며 추천하듯이 적극적으로 소개해 주세요.
답변은 의리 있고 든든하며, 실용적인 정보 위주로 간단하고 쉽게 설명하세요.
`

function scrollToBottom() {
  nextTick(() => {
    if (chatBody.value) {
      chatBody.value.scrollTop = chatBody.value.scrollHeight
    }
  })
}

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    scrollToBottom()
  }
}

async function sendMessage() {
  const text = inputValue.value.trim()
  if (!text || isLoading.value) return

  const userText = text
  inputValue.value = ''
  errorMessage.value = ''

  messages.value.push({
    role: 'user',
    content: userText
  })

  isLoading.value = true
  scrollToBottom()

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    messages.value.push({
      role: 'assistant',
      content:
        'OpenAI API 키가 아직 설정되지 않았어요. 프로젝트 루트에 .env 파일을 만들고 VITE_OPENAI_API_KEY를 넣어주세요.'
    })
    errorMessage.value = 'API 키가 없습니다.'
    isLoading.value = false
    scrollToBottom()
    return
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.value.slice(-10)
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI 요청 실패: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const aiReply =
      data?.choices?.[0]?.message?.content?.trim() ||
      '답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.'

    messages.value.push({
      role: 'assistant',
      content: aiReply
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content:
        '죄송해요. 잠시 후 다시 시도해 주세요. OpenAI API 연결에 문제가 생겼어요.'
    })
    errorMessage.value =
      err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[9999] font-sans">
    <!-- 플로팅 토글 버튼 -->
    <button
      type="button"
      class="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500 text-2xl shadow-lg shadow-cyan-500/30 transition hover:scale-110 hover:bg-cyan-400"
      @click="toggleChat"
    >
      💬
    </button>

    <!-- 챗봇 패널 -->
    <div
      v-if="isOpen"
      class="mt-3 w-[92vw] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-200/70 backdrop-blur"
    >
      <!-- 헤더 -->
      <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p class="text-sm font-semibold text-slate-900">부기</p>
          <p class="text-xs text-slate-500">부산 여행 가이드 챗봇</p>
        </div>

        <button
          type="button"
          class="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-600 transition hover:bg-slate-200"
          @click="toggleChat"
        >
          ✕
        </button>
      </div>

      <!-- 대화창 본문 -->
      <div
        ref="chatBody"
        class="flex h-80 flex-col gap-2 overflow-y-auto px-4 py-3 scrollbar-thin"
      >
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[
            'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 whitespace-pre-wrap',
            msg.role === 'user'
              ? 'self-end rounded-tr-none bg-cyan-500 text-white'
              : 'self-start rounded-tl-none border border-slate-200 bg-slate-50 text-slate-700'
          ]"
        >
          {{ msg.content }}
        </div>

        <!-- 답변 로딩 상태 -->
        <div
          v-if="isLoading"
          class="self-start max-w-[85%] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 rounded-tl-none"
        >
          <span class="flex items-center gap-2">
            <span class="h-2 w-2 animate-pulse rounded-full bg-cyan-400"></span>
            <span class="h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:120ms]"></span>
            <span class="h-2 w-2 animate-pulse rounded-full bg-cyan-400 [animation-delay:240ms]"></span>
            <span class="text-xs font-medium text-slate-500">부기가 생각 중...</span>
          </span>
        </div>
      </div>

      <!-- 에러 메세지 오버레이 -->
      <div
        v-if="errorMessage"
        class="mx-4 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
      >
        {{ errorMessage }}
      </div>

      <form @submit.prevent="sendMessage" class="border-t border-slate-200 bg-slate-50 p-3">
        <div class="flex gap-2">
          <input
            v-model="inputValue"
            type="text"
            placeholder="부산에서 뭐가 좋을까?"
            class="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-cyan-400 placeholder-slate-400 disabled:opacity-50"
            :disabled="isLoading"
          />

          <button
            type="submit"
            :disabled="isLoading"
            class="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.12);
  border-radius: 999px;
}
</style>
```
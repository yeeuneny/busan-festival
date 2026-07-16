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

// 💡 [추가] 브라우저 상의 실제 오늘 날짜를 구해서 YYYYMMDD 포맷과 읽기 쉬운 한글 포맷으로 파싱합니다.
const todayDateStr = computed(() => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}` // 예: "20260716"
})

const todayFormatted = computed(() => {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = d.getMonth() + 1
  const dd = d.getDate()
  return `${yyyy}년 ${mm}월 ${dd}일` // 예: "2026년 7월 16일"
})

// 💡 [수정] 축제 DB를 제공할 때 시작일과 종료일 날짜 정보도 함께 묶어서 전송합니다.
const festivalBriefList = computed(() => {
  const items = festivalsData?.items ?? []
  return items.map(item => {
    const start = item.eventstartdate || '정보없음'
    const end = item.eventenddate || '정보없음'
    return `- ${item.title} (ID: ${item.contentid}, 기간: ${start} ~ ${end})`
  }).join('\n')
})

const systemPrompt = computed(() => {
  return `
부산을 방문한 또래 친구를 가이드해 주는 친근한 부산 마스코트 '부기'입니다.
존댓말을 쓰지 말고, 오직 자연스러운 '경상도 사투리' 반말 만을 사용하며 고향 친구을 대하듯 하세요.
실용적인 정보 위주로 간단하고 쉽게 설명하세요.

★ [중요 - 오늘 날짜 기준 정밀 필터링 미션]
기준이 되는 오늘 날짜는 **${todayFormatted.value} (YYYYMMDD 기준: ${todayDateStr.value})** 야.
사용자가 "지금 하고 있는 축제 있어?", "앞으로 열릴 축제는?", "특정 월(예: 10월)에 하는 축제는?" 이라고 물어보면 아래 규칙에 따라 각 축제의 기간과 비교해서 판단해줘.

1. 진행 중 (Ongoing): 시작일 <= 오늘 날짜(${todayDateStr.value}) <= 종료일 인 경우
2. 진행 예정 (Upcoming): 오늘 날짜(${todayDateStr.value}) < 시작일 인 경우
3. 종료됨 (Ended): 종료일 < 오늘 날짜(${todayDateStr.value}) 인 경우
4. 특정 월 검색: 사용자가 물어본 달이 시작일과 종료일 사이에 걸쳐 있는 경우 (예: "10월" 검색 시 기간에 "10"월이 포함된 것들을 추려줌)

위 조건에 해당하지 않는 기간 미정의 축제는 일정 조율 중이라고 부드럽게 넘어가면 돼.

★ [매우 중요 미션 - 축제 정보 바로가기 카드 발급 규칙]
사용자가 질문한 맥락에 맞는 알맞은 축제를 아래 '부산 축제 DB'에서 하나 선정하여 친절히 소개해주고,
답변 본문 맨 끝에 무조건 '[FESTIVAL_ID:콘텐트ID]' 형태로 ID 태그를 딱 하나만 덧붙여줘.
(예: 수영구 드론쇼를 소개했다면 답변 맨 마지막 줄에 단독으로 [FESTIVAL_ID:2813137] 라고 작성해야 함)
사용자 질문에 해당하는 축제가 여러 개일 경우 말로 간단히 나열해주고, 카드용 ID 태그는 가장 대표적인 한 가지만 마지막 줄에 발급해주면 된다.
사용자 대화 내용 중에 해당 축제가 없거나, 가벼운 잡담을 나눌 때는 이 ID 태그를 절대로 붙이지 마라.

부산 축제 DB:
${festivalBriefList.value}
`
})

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

function goToDetail(contentid) {
  emit('select-festival', String(contentid))
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

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt.value },
          ...messages.value.slice(-10)
        ],
        temperature: 1,
        max_completion_tokens: 4000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenAI 요청 실패: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const aiReply =
      data?.choices?.[0]?.message?.content?.trim() ||
      '쫌만 이따 다시 물어봐라'

    const tagRegex = /\[FESTIVAL_ID:(\d+)\]/
    const match = aiReply.match(tagRegex)
    let cleanReply = aiReply
    let matchedFestival = null

    if (match) {
      const contentId = match[1]
      matchedFestival = (festivalsData?.items ?? []).find(item => String(item.contentid) === String(contentId))
      cleanReply = aiReply.replace(tagRegex, '').trim()
    }

    messages.value.push({
      role: 'assistant',
      content: cleanReply,
      festival: matchedFestival
    })
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content:
        '아이고 미안합니다. 쫌 이따 다시 해 보이소. OpenAI API 연결하는 데 문제가 좀 생ꄄ네예..'
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
      class="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl text-white shadow-lg shadow-sky-500/30 transition hover:scale-110 hover:bg-sky-600"
      @click="toggleChat"
    >
      💬
    </button>

    <!-- 챗봇 패널 -->
    <div
      v-if="isOpen"
      class="mt-3 w-[92vw] sm:w-[460px] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 backdrop-blur"
    >
      <!-- 헤더 -->
      <div class="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p class="text-sm font-bold text-900">부기</p>
          <p class="text-xs text-slate-900">부산 여행 가이드 챗봇</p>
        </div>

        <button
          type="button"
          class="rounded-full bg-slate-100 px-2.5 py-1 text-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          @click="toggleChat"
        >
          ✕
        </button>
      </div>

      <!-- 대화창 본문 -->
      <div 
        ref="chatBody" 
        class="flex h-[500px] flex-col gap-4 overflow-y-auto px-5 py-4 scrollbar-thin bg-slate-950/20"
      >
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="flex flex-col gap-2.5"
          :class="msg.role === 'user' ? 'items-end' : 'items-start'"
        >
          <!-- 말풍선 -->
          <div
            :class="[
              'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap',
              msg.role === 'user'
                ? 'bg-sky-500 text-white rounded-tr-none shadow-md shadow-sky-500/15'
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/40'
            ]"
          >
          {{ msg.content }}
        </div>

<!-- 추천 축제 카드 뉴스 피드 (가로 폭 증가에 맞춘 카드 비율 최적화) -->
          <div 
            v-if="msg.festival"
            class="w-[85%] rounded-2xl border border-slate-700/70 bg-slate-900 overflow-hidden shadow-lg flex flex-col gap-3 shrink-0"
          >
            <!-- 축제 이미지 (높이: h-28 -> h-36 확대) -->
            <div class="relative w-full h-36 bg-slate-950/40">
              <img 
                v-if="msg.festival.firstimage || msg.festival.firstimage2"
                :src="msg.festival.firstimage || msg.festival.firstimage2" 
                :alt="msg.festival.title"
                class="w-full h-full object-cover"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                포스터 준비중 📸
              </div>
            </div>

            <!-- 축제 메타데이터 -->
            <div class="px-4 pb-4 space-y-3">
              <div class="space-y-1">
                <h4 class="text-sm font-black text-white truncate">{{ msg.festival.title }}</h4>
                <p class="text-xs text-slate-400 truncate">📍 {{ msg.festival.addr1 || '부산 지역' }}</p>
                <p class="text-[10px] text-cyan-400 font-mono">
                  📅 {{ msg.festival.eventstartdate ? `${msg.festival.eventstartdate.substring(0, 4)}.${msg.festival.eventstartdate.substring(4, 6)}.${msg.festival.eventstartdate.substring(6, 8)}` : '일정조율중' }} 
                  ~ 
                  {{ msg.festival.eventenddate ? `${msg.festival.eventenddate.substring(0, 4)}.${msg.festival.eventenddate.substring(4, 6)}.${msg.festival.eventenddate.substring(6, 8)}` : '일정조율중' }}
                </p>
              </div>

              <!-- 상세보기 이동 버튼 -->
              <button
                type="button"
                @click="goToDetail(msg.festival.contentid)"
                class="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold transition duration-200 text-center shadow-md shadow-cyan-500/10 cursor-pointer"
              >
                상세보기 →
              </button>
            </div>
          </div>
        </div>

        <!-- 답변 로딩 상태 -->
        <div
          v-if="isLoading"
          class="self-start max-w-[85%] rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-600 rounded-tl-none border border-slate-700/40"
        >
          <span class="flex items-center gap-2">
            <span class="h-2 w-2 animate-pulse rounded-full bg-sky-400"></span>
            <span class="h-2 w-2 animate-pulse rounded-full bg-sky-400 [animation-delay:120ms]"></span>
            <span class="h-2 w-2 animate-pulse rounded-full bg-sky-400 [animation-delay:240ms]"></span>
            <span class="text-xs text-slate-400 font-medium">부기가 생각 중...</span>
          </span>
        </div>
      </div>

      <!-- 에러 메세지 오버레이 -->
      <div
        v-if="errorMessage"
        class="mx-4 mb-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300"
      >
        {{ errorMessage }}
      </div>

      <!-- 💡 입력 영역: HTML 표준 Form 전송 구조로 개편하여 반응성 극대화 -->
      <form @submit.prevent="sendMessage" class="border-t border-slate-700 p-4 bg-slate-50">
        <div class="flex gap-2">
          <input
            v-model="inputValue"
            type="text"
            placeholder="부산에서 뭐가 좋을까?"
            class="flex-1 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 placeholder-slate-500 disabled:opacity-50"
            :disabled="isLoading"
          />

          <button
            type="submit"
            :disabled="isLoading"
            class="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* 부드럽고 얇은 스크롤바 디자인 터치 */
.scrollbar-thin::-webkit-scrollbar {
  width: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}
</style>
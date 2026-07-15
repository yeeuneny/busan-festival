<script setup>
import { ref, onMounted, computed } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])
const ENABLE_DEMO_REVIEWS = true

const allReviews = ref([])
const searchQuery = ref('')
const selectedRating = ref('all')

function isDemoReview(review) {
  return (
    review?.isDemo === true ||
    review?.password === 'seed' ||
    String(review?.id ?? '').startsWith('demo-')
  )
}

function getReviewTime(review) {
  if (typeof review?.id === 'number') return review.id
  const match = String(review?.id ?? '').match(/\d{13}/)
  return match ? Number(match[0]) : 0
}

function loadAllReviews() {
  if (typeof window === 'undefined') return

  const loaded = []
  const items = festivalsData?.items ?? []
  const reviewKeys = Object.keys(window.localStorage).filter((key) =>
    key.startsWith('festival-reviews-')
  )

  reviewKeys.forEach((key) => {
    try {
      const festivalId = key.replace('festival-reviews-', '')
      const rawData = window.localStorage.getItem(key)
      if (!rawData) return

      const reviewsList = JSON.parse(rawData)
      if (!Array.isArray(reviewsList)) return

      const festivalInfo = items.find(
        (item) => String(item.contentid) === String(festivalId)
      )

      reviewsList.forEach((review) => {
        if (!review || typeof review !== 'object') return

        const demo = isDemoReview(review)
        if (!ENABLE_DEMO_REVIEWS && demo) return

        loaded.push({
          ...review,
          nickname: String(review.nickname ?? '익명'),
          content: String(review.content ?? ''),
          rating: Number(review.rating) || 0,
          isDemo: demo,
          festivalId,
          festivalTitle: festivalInfo?.title || '알 수 없는 축제',
          festivalImage:
            festivalInfo?.firstimage ||
            festivalInfo?.firstimage2 ||
            ''
        })
      })
    } catch (error) {
      console.error(`리뷰 데이터 처리 실패: ${key}`, error)
    }
  })

  allReviews.value = loaded.sort(
    (a, b) => getReviewTime(b) - getReviewTime(a)
  )
}

const filteredReviews = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return allReviews.value.filter((review) => {
    const festivalTitle = String(review.festivalTitle ?? '').toLowerCase()
    const content = String(review.content ?? '').toLowerCase()
    const nickname = String(review.nickname ?? '').toLowerCase()
    const rating = Number(review.rating)
    const selected = selectedRating.value

    const matchesSearch =
      !query ||
      festivalTitle.includes(query) ||
      content.includes(query) ||
      nickname.includes(query)

    const matchesRating =
      selected === 'all' ||
      (selected === '5' && rating === 5) ||
      (selected === '4' && rating >= 4) ||
      (selected === '3' && rating >= 3) ||
      (selected === '2' && rating <= 2) ||
      (selected === '1' && rating === 1)

    return matchesSearch && matchesRating
  })
})

function formatReviewDate(review) {
  const timestamp = getReviewTime(review)
  if (!timestamp) return review.isDemo ? '미리 등록된 후기' : ''
  return new Date(timestamp).toLocaleDateString('ko-KR')
}

function goToFestival(festivalId) {
  emit('select-festival', String(festivalId))
}

onMounted(loadAllReviews)
</script>

<template>
  <div class="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <div class="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-3xl font-bold text-white">
            💬 전체 방문자 한 줄 후기
          </h1>
          <p class="mt-2 text-sm text-slate-400">
            부산 곳곳의 축제를 다녀온 방문자들의 후기를 모아보세요.
          </p>
        </div>

        <div class="w-fit rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300">
          🔥 누적 후기 {{ allReviews.length }}개
        </div>
      </div>

      <div class="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-[1fr_200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="축제 이름, 후기 내용, 닉네임으로 검색하세요"
          class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        />

        <select
          v-model="selectedRating"
          class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        >
          <option value="all">⭐ 별점 전체 보기</option>
          <option value="5">⭐⭐⭐⭐⭐ 5점만</option>
          <option value="4">⭐⭐⭐⭐ 4점 이상</option>
          <option value="3">⭐⭐⭐ 3점 이상</option>
          <option value="2">⭐⭐ 2점 이하</option>
          <option value="1">⭐ 1점만</option>
        </select>
      </div>

      <div class="space-y-4">
        <div
          v-if="filteredReviews.length === 0"
          class="rounded-[24px] border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400"
        >
          <div class="mb-3 text-4xl">💬</div>
          <p class="font-medium text-slate-300">작성된 한 줄 후기가 없습니다.</p>
          <p class="mt-1 text-xs text-slate-500">
            지도를 통해 축제를 선택하고 첫 후기를 남겨보세요.
          </p>
        </div>

        <div
          v-for="review in filteredReviews"
          :key="`${review.festivalId}-${review.id}`"
          class="group flex flex-col items-start gap-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-cyan-400/60 hover:bg-slate-900/80 md:flex-row"
        >
          <div
            class="h-20 w-full flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-950 md:w-28"
            @click="goToFestival(review.festivalId)"
          >
            <img
              v-if="review.festivalImage"
              :src="review.festivalImage"
              :alt="review.festivalTitle"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-xs text-slate-600">
              No Image
            </div>
          </div>

          <div class="w-full flex-1 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="space-y-1">
                <button
                  type="button"
                  class="block text-left text-xs font-bold text-cyan-400 hover:underline"
                  @click="goToFestival(review.festivalId)"
                >
                  📍 {{ review.festivalTitle }}
                </button>

                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-bold text-white">{{ review.nickname }}</span>

                  <span
                    v-if="review.isDemo"
                    class="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300"
                  >
                    시연용
                  </span>

                  <span class="text-xs font-medium text-rose-400">
                    {{ '★'.repeat(Number(review.rating)) }}{{ '☆'.repeat(5 - Number(review.rating)) }}
                  </span>
                </div>
              </div>

              <span class="font-mono text-[11px] text-slate-500">
                {{ formatReviewDate(review) }}
              </span>
            </div>

            <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {{ review.content }}
            </p>
          </div>
        </div>
      </div>
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
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
}
</style>

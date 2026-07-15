<script setup>
import { ref, onMounted, computed } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])

const allReviews = ref([])
const searchQuery = ref('')
const selectedRating = ref('all') // 'all' | '5' | '4' | '3' | '2' | '1'

function loadAllReviews() {
  if (typeof window === 'undefined') return
  const loaded = []
  const items = festivalsData?.items ?? []

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)

      if (key && key.startsWith('festival-reviews-')) {
        const festivalId = key.replace('festival-reviews-', '')
        const rawData = window.localStorage.getItem(key)

        if (rawData) {
          const reviewsList = JSON.parse(rawData)
          if (Array.isArray(reviewsList)) {
            const festivalInfo = items.find(item => String(item.contentid) === String(festivalId))

            reviewsList.forEach(review => {
              loaded.push({
                ...review,
                festivalId,
                festivalTitle: festivalInfo?.title || '알 수 없는 축제',
                festivalImage: festivalInfo?.firstimage || festivalInfo?.firstimage2 || ''
              })
            })
          }
        }
      }
    }
  } catch (e) {
    console.error('리뷰를 모아오는 중 오류가 발생했습니데이:', e)
  }

  allReviews.value = loaded.sort((a, b) => b.id - a.id)
}

const filteredReviews = computed(() => {
  return allReviews.value.filter(review => {
    const matchesSearch =
      review.festivalTitle.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      review.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      review.nickname.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesRating =
      selectedRating.value === 'all' ||
      Number(review.rating) === Number(selectedRating.value)

    return matchesSearch && matchesRating
  })
})

function goToFestival(festivalId) {
  emit('select-festival', String(festivalId))
}

onMounted(() => {
  loadAllReviews()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <!-- 상단 타이틀 영역 -->
      <div class="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="flex items-center gap-2 text-3xl font-bold text-slate-900">
            💬 전체 방문자 한 줄 후기
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            부산 곳곳의 축제를 다녀온 유저들의 솔직하고 찰진 실시간 후기들을 모아보세요.
          </p>
        </div>

        <div class="flex w-fit items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
          🔥 누적 후기 {{ allReviews.length }}개
        </div>
      </div>

      <!-- 검색 및 별점 필터 -->
      <div class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="축제 이름, 후기 내용, 닉네임으로 검색하세요..."
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
        />

        <select
          v-model="selectedRating"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
        >
          <option value="all">⭐ 별점 전체 보기</option>
          <option value="5">⭐⭐⭐⭐⭐ 5점만</option>
          <option value="4">⭐⭐⭐⭐ 4점 이상</option>
          <option value="3">⭐⭐⭐ 3점 이상</option>
          <option value="2">⭐⭐ 2점 이하</option>
          <option value="1">⭐ 1점만</option>
        </select>
      </div>

      <!-- 후기 리스트 영역 -->
      <div class="space-y-4">
        <!-- 후기가 없을 때 -->
        <div
          v-if="filteredReviews.length === 0"
          class="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-slate-600"
        >
          <div class="mb-3 text-4xl">💬</div>
          <p class="font-medium text-slate-700">작성된 한 줄 후기가 없습니데이.</p>
          <p class="mt-1 text-xs text-slate-500">
            지도를 통해 축제를 선택하고 생생한 첫 후기를 남겨보세요!
          </p>
        </div>

        <!-- 후기가 존재할 때 카드 레이아웃 -->
        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="group flex flex-col items-start gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-cyan-400/60 hover:bg-slate-50 md:flex-row"
        >
          <!-- 축제 이미지 미니어처 -->
          <div
            class="h-20 w-full flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:w-28"
            @click="goToFestival(review.festivalId)"
          >
            <img
              v-if="review.festivalImage"
              :src="review.festivalImage"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-xs text-slate-500">
              No Image
            </div>
          </div>

          <!-- 후기 디테일 영역 -->
          <div class="w-full flex-1 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="space-y-1">
                <button
                  type="button"
                  class="block text-left text-xs font-bold text-cyan-600 hover:underline"
                  @click="goToFestival(review.festivalId)"
                >
                  📍 {{ review.festivalTitle }}
                </button>

                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900">{{ review.nickname }}</span>
                  <span class="text-xs font-medium text-rose-500">
                    {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                  </span>
                </div>
              </div>

              <span class="font-mono text-[11px] text-slate-500">
                {{ new Date(review.id).toLocaleDateString() }}
              </span>
            </div>

            <p class="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
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
  background: rgba(15, 23, 42, 0.12);
  border-radius: 999px;
}
</style>
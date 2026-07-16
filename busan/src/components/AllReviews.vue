<script setup>
import { ref, onMounted, computed } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])

const allReviews = ref([])
const searchQuery = ref('')
const selectedRating = ref('all')

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
    console.error('리뷰를 모아오는 중 오류가 발생했습니다:', e)
  }

  // 최신순 정렬
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
  <div class="min-h-screen bg-white px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
            💬 전체 방문자 한 줄 후기
          </h1>
          <p class="mt-2 text-slate-500 text-sm">
            부산 곳곳의 축제를 다녀온 유저들의 솔직하고 다양한 생생한 후기들을 모아보세요.
          </p>
        </div>
        
        <div class="flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 px-4 py-2 rounded-2xl text-sky-400 font-semibold text-sm w-fit">
          🔥 누적 후기 {{ allReviews.length }}개
        </div>
      </div>

      <div class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_200px]">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="축제 이름, 후기 내용, 닉네임으로 검색하세요"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900"
        />
        
        <select
          v-model="selectedRating"
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900"
        >
          <option value="all">⭐ 별점 전체 보기</option>
          <option value="5">⭐⭐⭐⭐⭐ 5점만</option>
          <option value="4">⭐⭐⭐⭐ 4점만</option>
          <option value="3">⭐⭐⭐ 3점만</option>
          <option value="2">⭐⭐ 2점만</option>
          <option value="1">⭐ 1점만</option>
        </select>
      </div>

      <div class="space-y-4">
        <div
          v-if="filteredReviews.length === 0"
          class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500"
        >
          <div class="text-4xl mb-3">💬</div>
          <p class="font-medium text-slate-600">작성된 한 줄 후기가 없습니다.</p>
          <p class="text-xs text-slate-500 mt-1">지도를 통해 축제를 선택하고 생생한 첫 후기를 남겨보세요!</p>
        </div>

        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-sky-500/60 hover:bg-slate-50 flex flex-col md:flex-row gap-5 items-start"
        >
          <div 
            class="w-full md:w-28 h-20 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50 cursor-pointer"
            @click="goToFestival(review.festivalId)"
          >
            <img 
              v-if="review.festivalImage" 
              :src="review.festivalImage" 
              class="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
            />
            <div v-else class="w-full h-full flex items-center justify-center text-xs text-slate-600">
              No Image
            </div>
          </div>

          <div class="flex-1 w-full space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="space-y-1">
                <button 
                  type="button" 
                  class="text-xs font-bold text-sky-500 hover:underline text-left block"
                  @click="goToFestival(review.festivalId)"
                >
                  📍 {{ review.festivalTitle }}
                </button>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-slate-900 text-sm">{{ review.nickname }}</span>
                  <span class="text-xs text-rose-400 font-medium">
                    {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                  </span>
                </div>
              </div>
              <span class="text-[11px] text-slate-900 font-mono">
                {{ new Date(review.id).toLocaleDateString() }}
              </span>
            </div>

            <p class="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
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
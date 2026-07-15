<script setup>
import { ref, onMounted, computed } from 'vue'
import festivalsData from '../assets/festivals.json'

const emit = defineEmits(['select-festival'])

const allReviews = ref([])
const searchQuery = ref('')
const selectedRating = ref('all') // 'all' | '5' | '4' | '3' | '2' | '1'

// 💡 브라우저의 모든 서랍을 싹 스캔해서 리뷰 데이터를 수집하는 핵심 함수
function loadAllReviews() {
  if (typeof window === 'undefined') return
  const loaded = []
  const items = festivalsData?.items ?? []

  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      
      // 'festival-reviews-'로 시작하는 키값만 타겟팅
      if (key && key.startsWith('festival-reviews-')) {
        const festivalId = key.replace('festival-reviews-', '')
        const rawData = window.localStorage.getItem(key)
        
        if (rawData) {
          const reviewsList = JSON.parse(rawData)
          if (Array.isArray(reviewsList)) {
            // festivals.json에서 해당 축제의 이름과 포스터 이미지를 매핑
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

  // 최신순 정렬 (ID가 타임스탬프이므로 내림차순 정렬)
  allReviews.value = loaded.sort((a, b) => b.id - a.id)
}

// 💡 검색 및 별점 필터링을 반영하는 실시간 컴퓨터 변수
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
  <div class="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      
      <!-- 상단 타이틀 영역 -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 class="text-3xl font-bold text-white flex items-center gap-2">
            💬 전체 방문자 한 줄 후기
          </h1>
          <p class="mt-2 text-slate-400 text-sm">
            부산 곳곳의 축제를 다녀온 유저들의 솔직하고 찰진 실시간 후기들을 모아보세요.
          </p>
        </div>
        
        <div class="flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/30 px-4 py-2 rounded-2xl text-cyan-300 font-semibold text-sm w-fit">
          🔥 누적 후기 {{ allReviews.length }}개
        </div>
      </div>

      <!-- 검색 및 별점 필터 필터바 -->
      <div class="grid gap-3 md:grid-cols-[1fr_200px] bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
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

      <!-- 후기 리스트 영역 -->
      <div class="space-y-4">
        <!-- 후기가 없을 때 -->
        <div
          v-if="filteredReviews.length === 0"
          class="rounded-[24px] border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center text-slate-400"
        >
          <div class="text-4xl mb-3">💬</div>
          <p class="font-medium text-slate-300">작성된 한 줄 후기가 없습니다.</p>
          <p class="text-xs text-slate-500 mt-1">지도를 통해 축제를 선택하고 생생한 첫 후기를 남겨보세요!</p>
        </div>

        <!-- 후기가 존재할 때 카드 레이아웃 -->
        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="group rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 transition hover:border-cyan-400/60 hover:bg-slate-900/80 flex flex-col md:flex-row gap-5 items-start"
        >
          <!-- 축제 이미지 미니어처 -->
          <div 
            class="w-full md:w-28 h-20 rounded-xl overflow-hidden border border-slate-800 flex-shrink-0 bg-slate-950 cursor-pointer"
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

          <!-- 후기 디테일 영역 -->
          <div class="flex-1 w-full space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="space-y-1">
                <!-- 어떤 축제인지 가리키는 태그 링크 -->
                <button 
                  type="button" 
                  class="text-xs font-bold text-cyan-400 hover:underline text-left block"
                  @click="goToFestival(review.festivalId)"
                >
                  📍 {{ review.festivalTitle }}
                </button>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white text-sm">{{ review.nickname }}</span>
                  <span class="text-xs text-rose-400 font-medium">
                    {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                  </span>
                </div>
              </div>
              <span class="text-[11px] text-slate-500 font-mono">
                {{ new Date(review.id).toLocaleDateString() }}
              </span>
            </div>

            <!-- 후기 내용 -->
            <p class="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap">
              {{ review.content }}
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* 부드럽고 얇은 스크롤바 커스텀 */
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
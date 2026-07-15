<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import FestivalDetailMap from './FestivalDetailMap.vue'
import festivalsData from '../assets/festivals.json'

const props = defineProps({
  festivalId: {
    type: [String, Number],
    default: ''
  },
  contentid: {
    type: [String, Number],
    default: ''
  }
})

const selectedFestival = ref(null)
const reviews = ref([])
const editingId = ref(null)
const errorText = ref('')
const likesMeta = ref({})
// 💡 내가 어떤 축제들에 좋아요를 눌렀는지 ID를 저장할 배열 변수
const myLikes = ref([])

const reviewForm = ref({
  nickname: '',
  content: '',
  rating: 5,
  password: ''
})

const resolvedFestivalId = computed(() => {
  const rawValue = props.festivalId ?? props.contentid ?? ''
  return String(rawValue).trim() || '506545'
})

const storageKey = computed(() => `festival-reviews-${resolvedFestivalId.value}`)
const likesStorageKey = 'busan-festival-likes-meta-v2'
const myLikesStorageKey = 'busan-festival-user-liked' // 💡 유저 개인의 좋아요 기록 키

// 💡 현재 보고 있는 축제에 내가 좋아요를 눌렀는지 확인하는 컴퓨터 변수
const isCurrentFestivalLiked = computed(() => {
  if (!selectedFestival.value) return false
  return myLikes.value.includes(String(selectedFestival.value.contentid))
})

function getFestivalById() {
  const items = festivalsData?.items ?? []
  const targetId = resolvedFestivalId.value

  const matched = items.find((item) => String(item.contentid) === String(targetId))
  const fallback = items.find((item) => String(item.contentid) === '506545')

  selectedFestival.value = matched || fallback || items[0] || null
}

function loadLikesMeta() {
  if (typeof window === 'undefined') return

  try {
    const raw = window.localStorage.getItem(likesStorageKey)

    if (raw) {
      likesMeta.value = JSON.parse(raw)
    } else {
      // 💡 요구사항 반영: 가짜 데이터 제거하고 처음엔 무조건 하트가 0개로 시작하도록 초기화
      const fallback = {}
      const items = festivalsData?.items ?? []
      items.forEach((item) => {
        fallback[String(item.contentid)] = 0
      })

      likesMeta.value = fallback
      window.localStorage.setItem(likesStorageKey, JSON.stringify(fallback))
    }
  } catch {
    likesMeta.value = {}
  }
}

// 💡 내가 과거에 눌렀던 좋아요 목록 불러오기
function loadMyLikes() {
  if (typeof window === 'undefined') return
  try {
    const saved = window.localStorage.getItem(myLikesStorageKey)
    myLikes.value = saved ? JSON.parse(saved) : []
  } catch {
    myLikes.value = []
  }
}

function saveLikesMeta() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(likesStorageKey, JSON.stringify(likesMeta.value))
  // 다른 컴포넌트(구별 지도 목록 등)에 실시간으로 좋아요가 바뀌었다고 이벤트를 쏴줍니다.
  window.dispatchEvent(new Event('likes-meta-updated'))
}

// 💡 내가 누른 좋아요 기록 저장하기
function saveMyLikes() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(myLikesStorageKey, JSON.stringify(myLikes.value))
}

function getLikeCount(contentid) {
  const value = likesMeta.value?.[String(contentid)]
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// 💡 1인 1하트 제한 토글 함수로 전면 수정
function toggleLike() {
  if (!selectedFestival.value) return

  const id = String(selectedFestival.value.contentid)
  const currentCount = getLikeCount(id)

  if (isCurrentFestivalLiked.value) {
    // 이미 하트를 누른 축제라면 ➡️ 취소 요청 (-1)
    likesMeta.value = {
      ...likesMeta.value,
      [id]: Math.max(0, currentCount - 1)
    }
    // 내 하트 기록 배열에서 삭제
    myLikes.value = myLikes.value.filter((item) => item !== id)
  } else {
    // 처음 누르는 축제라면 ➡️ 하트 추가 (+1)
    likesMeta.value = {
      ...likesMeta.value,
      [id]: currentCount + 1
    }
    // 내 하트 기록 배열에 추가
    myLikes.value.push(id)
  }

  saveLikesMeta()
  saveMyLikes()
}

function loadReviews() {
  if (typeof window === 'undefined') return

  try {
    const saved = window.localStorage.getItem(storageKey.value)
    reviews.value = saved ? JSON.parse(saved) : []
  } catch {
    reviews.value = []
  }
}

function saveReviews() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey.value, JSON.stringify(reviews.value))
}

function resetForm() {
  reviewForm.value = {
    nickname: '',
    content: '',
    rating: 5,
    password: ''
  }
  editingId.value = null
  errorText.value = ''
}

function submitReview() {
  const nickname = reviewForm.value.nickname.trim()
  const content = reviewForm.value.content.trim()
  const password = reviewForm.value.password.trim()

  if (!nickname || !content || !password) {
    errorText.value = '닉네임, 리뷰 내용, 비밀번호를 모두 입력해주세요.'
    return
  }

  if (editingId.value) {
    const target = reviews.value.find((item) => item.id === editingId.value)

    if (!target) {
      errorText.value = '수정할 리뷰를 찾지 못했습니다.'
      return
    }

    if (target.password !== password) {
      errorText.value = '비밀번호가 일치하지 않아 수정할 수 없어요.'
      return
    }

    target.nickname = nickname
    target.content = content
    target.rating = Number(reviewForm.value.rating)
    target.password = password
  } else {
    reviews.value.unshift({
      id: Date.now(),
      nickname,
      content,
      rating: Number(reviewForm.value.rating),
      password
    })
  }

  saveReviews()
  resetForm()
}

function startEdit(review) {
  editingId.value = review.id
  reviewForm.value = {
    nickname: review.nickname,
    content: review.content,
    rating: review.rating,
    password: ''
  }
  errorText.value = ''
}

function deleteReview(review) {
  const password = reviewForm.value.password.trim()

  if (!password) {
    errorText.value = '삭제하려면 비밀번호를 입력해주세요.'
    return
  }

  if (review.password !== password) {
    errorText.value = '비밀번호가 일치하지 않아 삭제할 수 없어요.'
    return
  }

  reviews.value = reviews.value.filter((item) => item.id !== review.id)
  saveReviews()

  if (editingId.value === review.id) {
    resetForm()
  } else {
    errorText.value = ''
  }
}

watch(
  resolvedFestivalId,
  () => {
    getFestivalById()
    loadReviews()
    resetForm()
  },
  { immediate: true }
)

onMounted(() => {
  getFestivalById()
  loadLikesMeta()
  loadMyLikes() // 💡 유저 하트 기록 가져오기 추가
  loadReviews()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl space-y-8">
      <section
        v-if="selectedFestival"
        class="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/90 shadow-2xl shadow-black/30"
      >
        <div class="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div class="flex items-center justify-center">
            <img
              v-if="selectedFestival.firstimage"
              :src="selectedFestival.firstimage"
              :alt="selectedFestival.title"
              class="h-[340px] w-full rounded-[24px] border border-slate-700 object-cover shadow-lg"
            />
            <div
              v-else
              class="flex h-[340px] w-full items-center justify-center rounded-[24px] border border-dashed border-slate-700 bg-slate-800/60 text-slate-400"
            >
              이미지가 없습니다
            </div>
          </div>

          <div class="flex flex-col justify-center">
            <div class="mb-4 inline-flex w-fit rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
              부산 축제 상세 소개
            </div>

            <div class="flex flex-wrap items-start justify-between gap-3">
              <h1 class="text-3xl font-bold leading-tight sm:text-4xl">
                {{ selectedFestival.title }}
              </h1>

              <!-- 💡 내가 누른 상태에 따라 하트 버튼 디자인이 연동되도록 반응형 클래스 지정 -->
              <button
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-bold transition shadow-md"
                :class="isCurrentFestivalLiked 
                  ? 'border-rose-500 bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600' 
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'"
                @click="toggleLike"
              >
                ❤️ {{ getLikeCount(selectedFestival.contentid) }}
              </button>
            </div>

            <div class="mt-5 space-y-3 text-sm text-slate-300 sm:text-base">
              <div class="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <p class="text-slate-400">주소</p>
                <p class="mt-1 font-medium text-white">{{ selectedFestival.addr1 || '주소 정보 없음' }}</p>
              </div>

              <div class="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <p class="text-slate-400">전화번호</p>
                <p class="mt-1 font-medium text-white">{{ selectedFestival.tel || '전화번호 정보 없음' }}</p>
              </div>

              <div class="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
                <p class="text-slate-400">축제 소개</p>
                <p class="mt-1 leading-7 text-slate-300">
                  이 축제는 부산의 분위기와 특별한 감성을 함께 느낄 수 있는 대표적인 여행 포인트입니다.
                  주변 관광지와 숙소까지 함께 둘러보며 여행 계획을 완성해보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-[28px] border border-slate-800 bg-slate-900/90 p-4 shadow-2xl shadow-black/30 sm:p-6">
        <FestivalDetailMap :selectedContentId="resolvedFestivalId" />
      </section>

      <section class="rounded-[28px] border border-slate-800 bg-slate-900/90 p-4 shadow-2xl shadow-black/30 sm:p-6">
        <div class="mb-5">
          <h2 class="text-2xl font-semibold text-white">방문자 한 줄 리뷰</h2>
          <p class="mt-1 text-sm text-slate-400">
            이 축제에 대한 솔직한 후기를 남겨주세요. 수정과 삭제는 비밀번호가 맞아야 가능합니다.
          </p>
        </div>

        <form class="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5" @submit.prevent="submitReview">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm text-slate-300">닉네임</label>
              <input
                v-model="reviewForm.nickname"
                type="text"
                placeholder="닉네임을 입력하세요"
                class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-300">별점</label>
              <select
                v-model="reviewForm.rating"
                class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              >
                <option :value="5">5점</option>
                <option :value="4">4점</option>
                <option :value="3">3점</option>
                <option :value="2">2점</option>
                <option :value="1">1점</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-300">리뷰 내용</label>
              <textarea
                v-model="reviewForm.content"
                rows="4"
                placeholder="이 축제에 대한 느낌을 남겨주세요."
                class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-300">비밀번호</label>
              <input
                v-model="reviewForm.password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                class="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              class="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-400"
            >
              {{ editingId ? '수정 완료' : '리뷰 등록' }}
            </button>

            <button
              v-if="editingId"
              type="button"
              class="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              @click="resetForm"
            >
              취소
            </button>
          </div>

          <div v-if="errorText" class="mt-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {{ errorText }}
          </div>
        </form>

        <div class="mt-6 space-y-3">
          <div
            v-if="reviews.length === 0"
            class="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-center text-sm text-slate-400"
          >
            아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨보세요.
          </div>

          <div
            v-for="review in reviews"
            :key="review.id"
            class="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-semibold text-white">{{ review.nickname }}</p>
                <p class="text-sm text-slate-400">
                  {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
                </p>
              </div>

              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
                  @click="startEdit(review)"
                >
                  수정
                </button>

                <button
                  type="button"
                  class="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-red-400 hover:text-red-300"
                  @click="deleteReview(review)"
                >
                  삭제
                </button>
              </div>
            </div>

            <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {{ review.content }}
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  font: inherit;
}

:deep(.leaflet-popup-content-wrapper) {
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

:deep(.leaflet-popup-content) {
  margin: 0;
}

:deep(.custom-pin),
:deep(.festival-pin) {
  background: transparent;
  border: none;
}
</style>
<template>
  <div class="utterances-wrapper">
    <div ref="commentBox" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

type Theme =
  | 'github-light'
  | 'github-dark'
  | 'github-dark-orange'
  | 'github-light-high-contrast'
  | 'github-dark-high-contrast'
  | 'github-dark-dimmed'
  | 'preferred-color-scheme'
  | 'photon-dark'

type IssueTerm = 'pathname' | 'url' | 'title' | 'og:title' | string

const props = defineProps<{
  repo?: string
  theme?: Theme
  issueTerm?: IssueTerm
  label?: string
}>()

const route = useRoute()
const commentBox = ref<HTMLDivElement | null>(null)
let mounted = false

// Defaults pensados para tu repo:
const repo = props.repo ?? 'Infil505/TareaP1ArquiSistemas'
const theme = ref<Theme>(props.theme ?? 'photon-dark')
const issueTerm = props.issueTerm ?? 'pathname'
const label = props.label ?? 'comments'

// Helper: obtiene el iframe actual de Utterances (si ya está montado)
const getUtterancesFrame = (): HTMLIFrameElement | null =>
  (commentBox.value?.querySelector('iframe.utterances-frame') as HTMLIFrameElement | null) ?? null

// Cambia el tema sin recargar usando postMessage (si ya existe el iframe)
const setUtterancesTheme = (t: Theme) => {
  const iframe = getUtterancesFrame()
  if (!iframe) return false
  iframe.contentWindow?.postMessage({ type: 'set-theme', theme: t }, 'https://utteranc.es')
  return true
}

// Carga/reinserta el script de Utterances
const loadUtterances = () => {
  if (!commentBox.value || typeof window === 'undefined') return

  // Limpieza preventiva
  commentBox.value.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://utteranc.es/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'

  script.setAttribute('repo', repo)
  script.setAttribute('issue-term', issueTerm)
  script.setAttribute('theme', theme.value)
  if (label) script.setAttribute('label', label)

  commentBox.value.appendChild(script)
}

onMounted(() => {
  mounted = true
  loadUtterances()
})

// Si cambia el tema: intenta postMessage; si aún no hay iframe, recarga
watch(
  () => props.theme,
  (t) => {
    if (!mounted || !t) return
    theme.value = t as Theme
    const changed = setUtterancesTheme(theme.value)
    if (!changed) loadUtterances()
  }
)

// Si cambia la ruta y usamos 'pathname', recarga para enlazar a un issue distinto
watch(
  () => route.path,
  () => {
    if (!mounted) return
    if (issueTerm === 'pathname') loadUtterances()
  }
)

// Si cambia el repo dinámicamente, recarga (edge case)
watch(
  () => props.repo,
  (r) => {
    if (!mounted || !r) return
    loadUtterances()
  }
)

onBeforeUnmount(() => {
  // Limpieza: elimina el iframe/script para evitar fugas al salir del componente
  if (commentBox.value) commentBox.value.innerHTML = ''
  mounted = false
})
</script>

<style scoped>
.utterances-wrapper {
  width: 100%;
  max-width: 100%;
  margin-top: 2rem;
}
.utterances-wrapper :deep(.utterances) {
  max-width: 100%;
}
</style>

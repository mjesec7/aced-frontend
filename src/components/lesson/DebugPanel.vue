<template>
  <div style="position: fixed; top: 0; right: 0; width: 400px; max-height: 100vh; overflow: auto; background: yellow; padding: 20px; z-index: 9999; font-size: 12px;">
    <h3 style="margin: 0 0 10px 0;">DEBUG INFO</h3>
    <div style="background: white; padding: 10px; margin-bottom: 10px;">
      <strong>currentExercise:</strong>
      <pre style="font-size: 10px; overflow: auto;">{{ JSON.stringify(currentExercise, null, 2) }}</pre>
    </div>
    <div style="background: white; padding: 10px; margin-bottom: 10px;">
      <strong>exerciseType:</strong> {{ exerciseType }}
    </div>
    <div style="background: white; padding: 10px; margin-bottom: 10px;">
      <strong>currentExercise.type:</strong> {{ currentExercise?.type }}
    </div>
    <div style="background: white; padding: 10px; margin-bottom: 10px;">
      <strong>currentExercise.data?.type:</strong> {{ currentExercise?.data?.type }}
    </div>
    <div style="background: white; padding: 10px; margin-bottom: 10px;">
      <strong>currentExercise.pairs:</strong> {{ currentExercise?.pairs ? 'EXISTS' : 'UNDEFINED' }}
    </div>
    <div style="background: white; padding: 10px;">
      <strong>currentExercise.data?.pairs:</strong> {{ currentExercise?.data?.pairs ? 'EXISTS' : 'UNDEFINED' }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentExercise: Object
});

const exerciseType = computed(() => {
  if (props.currentExercise?.type === 'exercise' && props.currentExercise?.data?.type) {
    return props.currentExercise.data.type;
  }
  return props.currentExercise?.type || 'short-answer';
});
</script>

# Interactive Exercise Components

This directory contains interactive exercise components for the ACED learning platform.

## 📦 Components

### BasketExercise.vue
A drag-and-drop multiplication exercise component with two modes:

**Features:**
- 🎯 **Explanation Mode**: Step-by-step breakdown of multiplication tricks
- 🎮 **Exercise Mode**: Interactive basket drag-and-drop challenge
- 📊 **Scoring System**: Points based on attempt count (50 pts first try, 25 pts after)
- 🔄 **Retry Functionality**: Learn from mistakes
- 📱 **Fully Responsive**: Works on all devices
- ✨ **Native HTML5 Drag-and-Drop**: No external libraries needed

**Usage:**
```vue
<template>
  <BasketExercise
    :initial-view-mode="'explanation'"
    @score-update="handleScoreUpdate"
    @streak-update="handleStreakUpdate"
    @continue="handleContinue"
  />
</template>

<script>
import BasketExercise from '@/components/exercises/BasketExercise.vue';

export default {
  components: { BasketExercise },
  methods: {
    handleScoreUpdate(points) {
      this.totalScore += points;
    },
    handleStreakUpdate(change) {
      if (change > 0) {
        this.streak += change;
      } else {
        this.streak = 0;
      }
    },
    handleContinue() {
      // Move to next exercise
    }
  }
};
</script>
```

**Props:**
- `initialViewMode` (String, default: 'explanation') - Starting view: 'explanation' or 'exercise'

**Events:**
- `@score-update(points)` - Emitted when user earns points
- `@streak-update(change)` - Emitted when streak changes (+1 or -1)
- `@continue` - Emitted when user completes exercise successfully

### BasketExerciseDemo.vue
A complete demo showing how to integrate BasketExercise with:
- Header with progress tracking
- Sidebar with stats and tips
- Responsive grid layout
- Score and streak management

**Usage:**
```vue
<template>
  <BasketExerciseDemo />
</template>

<script>
import BasketExerciseDemo from '@/components/exercises/BasketExerciseDemo.vue';

export default {
  components: { BasketExerciseDemo }
};
</script>
```

## 🎨 Styling

All components use scoped styles with CSS variables for easy theming. Key colors:
- Primary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Purple: `#8b5cf6`
- Orange: `#f97316`

## 🔧 Exercise Detection Fixes

### ContentPanel.vue
Updated to properly distinguish between exercise and game steps:

```javascript
computed: {
  isExerciseStep() {
    return (this.currentStep?.type === 'exercise' ||
            this.currentStep?.type === 'practice') &&
           !this.currentStep?.gameType;
  },
  isGameStep() {
    return this.currentStep?.type === 'game' ||
           Boolean(this.currentStep?.gameType);
  },
  totalExercisesInStep() {
    // Intelligently counts exercises from various data structures
  }
}
```

### useExercises.js
Enhanced `getCurrentExercise` function with:
- 🔍 Better exercise detection logic
- 📝 Detailed console logging for debugging
- 🎮 Proper separation of game vs exercise steps
- 🔄 Multiple fallback strategies for finding exercises

**Debug Output:**
```
Processing step: {...}
Found exercises directly in data array
Found 3 exercises
Returning exercise: {...}
```

## 📱 Responsive Design

All components are mobile-first and responsive:

**Breakpoints:**
- Mobile: `< 640px` - Stacked layout
- Tablet: `640px - 1024px` - Adjusted grid
- Desktop: `> 1024px` - Full sidebar layout

## 🎯 Integration with Lesson System

To integrate with your existing lesson system:

1. **Import the component:**
```javascript
import BasketExercise from '@/components/exercises/BasketExercise.vue';
```

2. **Add to your lesson step renderer:**
```vue
<BasketExercise
  v-if="currentStep.type === 'exercise' &&
        currentStep.exerciseType === 'basket'"
  :initial-view-mode="'explanation'"
  @score-update="updateScore"
  @streak-update="updateStreak"
  @continue="nextStep"
/>
```

3. **Handle events in parent component:**
```javascript
methods: {
  updateScore(points) {
    this.userScore += points;
    this.$emit('score-changed', this.userScore);
  },
  updateStreak(change) {
    this.currentStreak = change > 0 ?
      this.currentStreak + change : 0;
  },
  nextStep() {
    this.lessonOrchestrator.moveToNextStep();
  }
}
```

## 🧪 Testing

To test the components:

1. **View the demo:**
```bash
# Add to your router
{
  path: '/demo/basket-exercise',
  component: () => import('@/components/exercises/BasketExerciseDemo.vue')
}
```

2. **Test different scenarios:**
- Try correct answer on first attempt
- Try wrong answer, then correct
- Switch between explanation and exercise modes
- Test on mobile viewport

## 🚀 Future Enhancements

Potential improvements:
- [ ] Sound effects for drag/drop
- [ ] Animations for answer feedback
- [ ] Multiple question sets
- [ ] Different difficulty levels
- [ ] Custom themes
- [ ] Accessibility improvements (keyboard navigation)
- [ ] Touch-friendly mobile dragging
- [ ] Analytics tracking

## 📚 Related Files

- `/src/components/lesson/ContentPanel.vue` - Main lesson content display
- `/src/components/lesson/InteractivePanel.vue` - Interactive exercise panel
- `/src/composables/useExercises.js` - Exercise logic and validation
- `/src/composables/useLessonOrchestrator.js` - Lesson flow management

## 🐛 Debugging

Enable detailed logging:
```javascript
// The getCurrentExercise function now logs:
// - Step type detection
// - Exercise discovery path
// - Exercise count
// - Index management
```

Check console for messages like:
- "Processing step: {...}"
- "Found exercises in data.exercises"
- "No exercises found in step"

## 📝 License

Part of the ACED platform educational system.
